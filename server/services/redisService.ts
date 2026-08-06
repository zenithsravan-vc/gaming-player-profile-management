import { redisClient } from '../utils/redisClient.js';

export interface PlayerProfile {
  id: string; // e.g., P001
  username: string; // e.g., GamerX
  level: number; // e.g., 15
  highScore: number; // e.g., 9800
  achievements: string[]; // e.g., ["First Win", "Level Master"]
  rawString?: string; // Raw Redis String value: P001|GamerX|15|9800|First Win,Level Master
  hasActiveBoost?: boolean;
  boostTtlSeconds?: number;
  boostDetails?: string | null;
}

export class RedisService {
  /**
   * Helper to format Player object into Redis Pipe-Delimited String
   * Format: ID|Username|Level|HighScore|Achievement1,Achievement2
   */
  public static serializePlayer(player: Omit<PlayerProfile, 'rawString'>): string {
    const achs = Array.isArray(player.achievements)
      ? player.achievements.map((a) => a.trim()).filter(Boolean).join(',')
      : '';
    return `${player.id.trim()}|${player.username.trim()}|${player.level}|${player.highScore}|${achs}`;
  }

  /**
   * Helper to parse Redis Pipe-Delimited String into Player object
   * Format: ID|Username|Level|HighScore|Achievement1,Achievement2
   */
  public static deserializePlayer(rawString: string, keyId?: string): PlayerProfile | null {
    if (!rawString) return null;
    const parts = rawString.split('|');
    if (parts.length < 4) {
      return null;
    }

    const id = parts[0] || keyId || 'UNKNOWN';
    const username = parts[1] || 'Unknown Player';
    const level = parseInt(parts[2] || '1', 10);
    const highScore = parseInt(parts[3] || '0', 10);
    const rawAch = parts[4] || '';
    const achievements = rawAch
      ? rawAch.split(',').map((a) => a.trim()).filter(Boolean)
      : [];

    return {
      id,
      username,
      level: isNaN(level) ? 1 : level,
      highScore: isNaN(highScore) ? 0 : highScore,
      achievements,
      rawString,
    };
  }

  /**
   * 1. Store a Player Profile using Redis SET command
   * Key: player_data:<id>
   * Value: P001|GamerX|15|9800|First Win,Level Master
   */
  public async setPlayer(player: Omit<PlayerProfile, 'rawString'>): Promise<PlayerProfile> {
    const key = `player_data:${player.id}`;
    const value = RedisService.serializePlayer(player);

    // Redis SET command
    await redisClient.set(key, value);

    const saved = RedisService.deserializePlayer(value, player.id)!;
    return saved;
  }

  /**
   * 2. Retrieve a Player Profile using Redis GET command
   * Also checks temporary boost using Redis GET and TTL on boost:<id>
   */
  public async getPlayer(id: string): Promise<PlayerProfile | null> {
    const key = `player_data:${id}`;

    // Redis GET command
    const rawValue = await redisClient.get(key);
    if (!rawValue) {
      return null;
    }

    const player = RedisService.deserializePlayer(rawValue, id);
    if (!player) {
      return null;
    }

    // Check boost key: boost:<id>
    const boostKey = `boost:${id}`;
    const boostVal = await redisClient.get(boostKey);
    const boostTtl = await redisClient.ttl(boostKey);

    if (boostVal && boostTtl > 0) {
      player.hasActiveBoost = true;
      player.boostTtlSeconds = boostTtl;
      player.boostDetails = boostVal;
    } else {
      player.hasActiveBoost = false;
      player.boostTtlSeconds = 0;
      player.boostDetails = null;
    }

    return player;
  }

  /**
   * 3. Store Multiple Players using Redis MSET command
   * Preloads default required players:
   * P001|GamerX|15|9800|First Win,Level Master
   * P002|Shadow|20|12500|First Win,Champion
   * P003|Blaze99|10|7600|Quick Learner,High Jumper
   */
  public async preloadPlayers(): Promise<{ count: number; players: PlayerProfile[] }> {
    const defaultData: Record<string, string> = {
      'player_data:P001': 'P001|GamerX|15|9800|First Win,Level Master',
      'player_data:P002': 'P002|Shadow|20|12500|First Win,Champion',
      'player_data:P003': 'P003|Blaze99|10|7600|Quick Learner,High Jumper',
    };

    // Redis MSET command
    await redisClient.mset(defaultData);

    const loadedPlayers: PlayerProfile[] = [];
    for (const [k, v] of Object.entries(defaultData)) {
      const pId = k.replace('player_data:', '');
      const parsed = RedisService.deserializePlayer(v, pId);
      if (parsed) loadedPlayers.push(parsed);
    }

    return {
      count: loadedPlayers.length,
      players: loadedPlayers,
    };
  }

  /**
   * 4. Temporary Boost using Redis SETEX command
   * Key: boost:<id>
   * Duration: 60 seconds
   */
  public async setPlayerBoost(
    id: string,
    boostType: string = 'DOUBLE_XP_60S'
  ): Promise<{ key: string; ttl: number; value: string }> {
    const boostKey = `boost:${id}`;
    const durationSeconds = 60;
    const boostValue = `${boostType}|ACTIVATED_${Date.now()}`;

    // Redis SETEX command: stores key with 60 seconds TTL
    await redisClient.setex(boostKey, durationSeconds, boostValue);

    return {
      key: boostKey,
      ttl: durationSeconds,
      value: boostValue,
    };
  }

  /**
   * 5. Append Achievement using Redis APPEND command
   * Appends a new achievement string to the player's profile string
   */
  public async appendAchievement(
    id: string,
    newAchievement: string
  ): Promise<{ updatedPlayer: PlayerProfile; appendedValue: string; newLength: number }> {
    const key = `player_data:${id}`;

    // Read current raw value to handle delimiter correctly
    const currentVal = await redisClient.get(key);
    if (!currentVal) {
      throw new Error(`Player profile with ID ${id} not found.`);
    }

    // Determine string to append:
    // If achievements exist (i.e. string doesn't end with '|'), prepend ','
    let stringToAppend = newAchievement.trim();
    if (!currentVal.endsWith('|') && !currentVal.endsWith(',')) {
      stringToAppend = `,${stringToAppend}`;
    }

    // Redis APPEND command
    const newLength = await redisClient.append(key, stringToAppend);

    // Get updated full profile
    const updatedRaw = await redisClient.get(key);
    const updatedPlayer = (await this.getPlayer(id))!;

    return {
      updatedPlayer,
      appendedValue: stringToAppend,
      newLength,
    };
  }

  /**
   * Retrieve All Players using Redis KEYS and GET commands
   */
  public async getAllPlayers(): Promise<PlayerProfile[]> {
    // Redis KEYS command
    const keys = await redisClient.keys('player_data:*');
    const players: PlayerProfile[] = [];

    for (const key of keys) {
      const pId = key.replace('player_data:', '');
      const player = await this.getPlayer(pId);
      if (player) {
        players.push(player);
      }
    }

    return players.sort((a, b) => a.id.localeCompare(b.id));
  }

  /**
   * Delete Player using Redis DEL command
   */
  public async deletePlayer(id: string): Promise<boolean> {
    const playerKey = `player_data:${id}`;
    const boostKey = `boost:${id}`;

    // Redis DEL command
    const deletedCount = await redisClient.del(playerKey);
    await redisClient.del(boostKey);

    return deletedCount > 0;
  }
}

export const redisService = new RedisService();
