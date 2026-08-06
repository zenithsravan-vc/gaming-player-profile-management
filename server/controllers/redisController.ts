import { Request, Response } from 'express';
import { getRedisLogs, redisClient } from '../utils/redisClient.js';

export class RedisController {
  /**
   * GET /api/redis/logs
   * Fetch recent Redis command logs with full explanations.
   */
  public getLogs(req: Request, res: Response): void {
    const logs = getRedisLogs();
    res.status(200).json({
      count: logs.length,
      logs,
    });
  }

  /**
   * GET /api/redis/keys
   * Fetch all active Redis keys (player_data:* and boost:*) with their types, values, and TTLs.
   */
  public async getKeys(req: Request, res: Response): Promise<void> {
    try {
      const allKeys = await redisClient.keys('*');
      const keyDetails = [];

      for (const key of allKeys) {
        const value = await redisClient.get(key);
        const ttl = await redisClient.ttl(key);
        keyDetails.push({
          key,
          type: 'string', // Redis Strings only
          value,
          ttl,
          isBoostKey: key.startsWith('boost:'),
          isPlayerKey: key.startsWith('player_data:'),
        });
      }

      res.status(200).json({
        totalKeys: keyDetails.length,
        redisMode: redisClient.mode,
        keys: keyDetails,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch Redis keys' });
    }
  }

  /**
   * GET /api/redis/raw/:key
   * Inspect raw value and TTL of any Redis key.
   */
  public async getRawKey(req: Request, res: Response): Promise<void> {
    try {
      const key = req.params.key;
      const value = await redisClient.get(key);
      const ttl = await redisClient.ttl(key);

      res.status(200).json({
        key,
        value,
        ttl,
        type: 'string',
        exists: value !== null,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to read key' });
    }
  }
}

export const redisController = new RedisController();
