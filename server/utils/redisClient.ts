import Redis from 'ioredis';

export interface RedisLogEntry {
  id: string;
  timestamp: string;
  command: string;
  key?: string;
  args: string[];
  explanation: string;
  result: string;
}

// In-Memory Storage for Redis String emulation when external Redis server is unavailable
interface MemoryValue {
  value: string;
  expiresAt?: number; // Epoch time in ms
}

class InMemoryRedisClient {
  private store: Map<string, MemoryValue> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  private cleanIfExpired(key: string): boolean {
    const item = this.store.get(key);
    if (!item) return false;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key)!);
        this.timers.delete(key);
      }
      return true;
    }
    return false;
  }

  /**
   * Redis SET command: Stores a string key-value pair in Redis.
   * Command: SET <key> <value>
   */
  async set(key: string, value: string): Promise<'OK'> {
    this.cleanIfExpired(key);
    this.store.set(key, { value: String(value) });
    return 'OK';
  }

  /**
   * Redis GET command: Retrieves the string value associated with a key.
   * Command: GET <key>
   */
  async get(key: string): Promise<string | null> {
    if (this.cleanIfExpired(key)) {
      return null;
    }
    const item = this.store.get(key);
    return item ? item.value : null;
  }

  /**
   * Redis MSET command: Sets multiple key-value pairs atomically.
   * Command: MSET <key1> <value1> <key2> <value2> ...
   */
  async mset(kvMap: Record<string, string> | string[]): Promise<'OK'> {
    if (Array.isArray(kvMap)) {
      for (let i = 0; i < kvMap.length; i += 2) {
        const key = kvMap[i];
        const val = kvMap[i + 1];
        if (key && val !== undefined) {
          await this.set(key, val);
        }
      }
    } else {
      for (const [key, val] of Object.entries(kvMap)) {
        await this.set(key, val);
      }
    }
    return 'OK';
  }

  /**
   * Redis SETEX command: Sets key to hold string value and sets key to timeout after a given number of seconds.
   * Command: SETEX <key> <seconds> <value>
   */
  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    this.cleanIfExpired(key);
    const expiresAt = Date.now() + seconds * 1000;
    this.store.set(key, { value: String(value), expiresAt });

    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
    }

    const timer = setTimeout(() => {
      this.store.delete(key);
      this.timers.delete(key);
    }, seconds * 1000);

    this.timers.set(key, timer);
    return 'OK';
  }

  /**
   * Redis APPEND command: Appends a string value to an existing key's value.
   * If key does not exist, it is created as an empty string before appending.
   * Command: APPEND <key> <value>
   * Returns: Length of string after the append operation.
   */
  async append(key: string, valueToAppend: string): Promise<number> {
    this.cleanIfExpired(key);
    const item = this.store.get(key);
    const existing = item ? item.value : '';
    const newString = existing + valueToAppend;
    this.store.set(key, {
      value: newString,
      expiresAt: item?.expiresAt,
    });
    return newString.length;
  }

  /**
   * Redis DEL command: Removes the specified key from Redis.
   * Command: DEL <key>
   */
  async del(key: string): Promise<number> {
    this.cleanIfExpired(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
      this.timers.delete(key);
    }
    const existed = this.store.has(key);
    this.store.delete(key);
    return existed ? 1 : 0;
  }

  /**
   * Redis TTL command: Returns remaining time-to-live in seconds for a key with an expiration.
   * Command: TTL <key>
   * Returns: TTL in seconds, -1 if no TTL set, -2 if key doesn't exist.
   */
  async ttl(key: string): Promise<number> {
    if (this.cleanIfExpired(key)) {
      return -2;
    }
    const item = this.store.get(key);
    if (!item) return -2;
    if (!item.expiresAt) return -1;
    const remainingMs = item.expiresAt - Date.now();
    return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : -2;
  }

  /**
   * Redis KEYS command: Finds all keys matching pattern (e.g. "player_data:*")
   * Command: KEYS <pattern>
   */
  async keys(pattern: string): Promise<string[]> {
    const matchedKeys: string[] = [];
    const regexPattern = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    );

    for (const key of Array.from(this.store.keys())) {
      if (!this.cleanIfExpired(key)) {
        if (regexPattern.test(key)) {
          matchedKeys.push(key);
        }
      }
    }
    return matchedKeys.sort();
  }
}

// Log history array
const commandLogs: RedisLogEntry[] = [];

export function logRedisCommand(
  command: string,
  key: string | undefined,
  args: string[],
  explanation: string,
  result: string
) {
  const entry: RedisLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    command,
    key,
    args,
    explanation,
    result,
  };
  commandLogs.unshift(entry);
  if (commandLogs.length > 100) {
    commandLogs.pop();
  }
}

export function getRedisLogs(): RedisLogEntry[] {
  return commandLogs;
}

// Initialize Redis Client with fallback to InMemoryRedisClient
class UnifiedRedisWrapper {
  private redisInstance: Redis | InMemoryRedisClient;
  public mode: 'ioredis' | 'in-memory' = 'in-memory';

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        const ioClient = new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          connectTimeout: 2000,
          retryStrategy: () => null, // Don't block if redis URL fails
        });
        
        ioClient.on('error', () => {
          this.mode = 'in-memory';
          this.redisInstance = new InMemoryRedisClient();
        });

        ioClient.on('connect', () => {
          this.mode = 'ioredis';
        });

        this.redisInstance = ioClient;
      } catch {
        this.mode = 'in-memory';
        this.redisInstance = new InMemoryRedisClient();
      }
    } else {
      this.mode = 'in-memory';
      this.redisInstance = new InMemoryRedisClient();
    }
  }

  /**
   * Redis SET command
   * SET player_data:P001 "P001|GamerX|15|9800|First Win,Level Master"
   */
  async set(key: string, value: string): Promise<'OK'> {
    const res = await (this.redisInstance as any).set(key, value);
    logRedisCommand(
      'SET',
      key,
      [key, value],
      `Stores string key "${key}" with value "${value}". In Redis, SET overwrites any existing value associated with the key.`,
      String(res)
    );
    return res;
  }

  /**
   * Redis GET command
   * GET player_data:P001
   */
  async get(key: string): Promise<string | null> {
    const val = await (this.redisInstance as any).get(key);
    logRedisCommand(
      'GET',
      key,
      [key],
      `Retrieves string value for key "${key}". Returns string value if key exists, or null/nil if key does not exist or expired.`,
      val === null ? 'nil' : `"${val}"`
    );
    return val;
  }

  /**
   * Redis MSET command
   * MSET player_data:P001 val1 player_data:P002 val2 player_data:P003 val3
   */
  async mset(kvMap: Record<string, string>): Promise<'OK'> {
    const flatArgs: string[] = [];
    for (const [k, v] of Object.entries(kvMap)) {
      flatArgs.push(k, v);
    }
    const res = await (this.redisInstance as any).mset(flatArgs);
    logRedisCommand(
      'MSET',
      undefined,
      flatArgs,
      `Sets multiple string keys in a single atomic operation. MSET replaces existing values for all specified keys.`,
      String(res)
    );
    return res;
  }

  /**
   * Redis SETEX command
   * SETEX boost:P001 60 "SPEED_BOOST_2X"
   */
  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    const res = await (this.redisInstance as any).setex(key, seconds, value);
    logRedisCommand(
      'SETEX',
      key,
      [key, String(seconds), value],
      `Sets key "${key}" with value "${value}" and an expiration of ${seconds} seconds (Time To Live). Redis automatically deletes this key when TTL expires.`,
      String(res)
    );
    return res;
  }

  /**
   * Redis APPEND command
   * APPEND player_data:P001 ",New Achievement"
   */
  async append(key: string, valueToAppend: string): Promise<number> {
    const res = await (this.redisInstance as any).append(key, valueToAppend);
    logRedisCommand(
      'APPEND',
      key,
      [key, valueToAppend],
      `Appends string "${valueToAppend}" to the existing string value at key "${key}". If key does not exist, it creates it. Returns new total string length (${res}).`,
      `New Length: ${res}`
    );
    return res;
  }

  /**
   * Redis DEL command
   * DEL player_data:P001
   */
  async del(key: string): Promise<number> {
    const res = await (this.redisInstance as any).del(key);
    logRedisCommand(
      'DEL',
      key,
      [key],
      `Removes key "${key}" from Redis. Returns 1 if key was deleted, or 0 if key did not exist.`,
      `Deleted keys count: ${res}`
    );
    return res;
  }

  /**
   * Redis TTL command
   * TTL boost:P001
   */
  async ttl(key: string): Promise<number> {
    const res = await (this.redisInstance as any).ttl(key);
    logRedisCommand(
      'TTL',
      key,
      [key],
      `Returns remaining time to live in seconds for key "${key}". Returns -1 if key has no expiration, -2 if key does not exist.`,
      `${res} seconds`
    );
    return res;
  }

  /**
   * Redis KEYS command
   * KEYS player_data:*
   */
  async keys(pattern: string): Promise<string[]> {
    const keyList = await (this.redisInstance as any).keys(pattern);
    logRedisCommand(
      'KEYS',
      pattern,
      [pattern],
      `Finds all keys matching pattern "${pattern}". Used for searching player profiles and boost keys in Redis.`,
      `Found ${keyList.length} keys: [${keyList.join(', ')}]`
    );
    return keyList;
  }
}

export const redisClient = new UnifiedRedisWrapper();
