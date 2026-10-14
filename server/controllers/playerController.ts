import { Request, Response } from 'express';
import { redisService } from '../services/redisService.js';
import { mongoService } from '../services/mongoService.js';

export class PlayerController {
  /**
   * POST /player
   * Store a Player Profile using Redis SET command.
   * Body: { id, username, level, highScore, achievements }
   */
  public async createPlayer(req: Request, res: Response): Promise<void> {
    try {
      const { id, username, level, highScore, achievements } = req.body;

      if (!id || !username) {
        res.status(400).json({
          error: 'Player ID and Username are required.',
          received: req.body,
        });
        return;
      }

      // Format ID to clean uppercase e.g. P001
      const cleanId = String(id).trim();
      const achList = Array.isArray(achievements)
        ? achievements
        : typeof achievements === 'string'
        ? achievements.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

     const playerData = {
  id: cleanId,
  username: String(username).trim(),
  level: Number(level) || 1,
  highScore: Number(highScore) || 0,
  achievements: achList,
};

// Store player in Redis
const player = await redisService.setPlayer(playerData);

// Store the same player in MongoDB
await mongoService.createPlayer(playerData);

      res.status(201).json({
        message: 'Player profile successfully stored in Redis using SET command.',
        redisCommandUsed: 'SET',
        redisKey: `player_data:${cleanId}`,
        redisValue: player.rawString,
        player,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to create player' });
    }
  }

  /**
   * GET /player/:id
   * Retrieve a Player Profile using Redis GET command.
   */
  public async getPlayerById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const cleanId = String(id).trim();

      const player = await redisService.getPlayer(cleanId);

      if (!player) {
        res.status(404).json({
          error: `Player profile with ID ${cleanId} not found in Redis.`,
          redisCommandUsed: 'GET',
          redisKey: `player_data:${cleanId}`,
        });
        return;
      }

      res.status(200).json({
        message: 'Player profile retrieved successfully from Redis using GET command.',
        redisCommandUsed: 'GET',
        redisKey: `player_data:${cleanId}`,
        redisValue: player.rawString,
        player,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch player' });
    }
  }

  /**
   * GET /players
   * List all player profiles in Redis.
   */
  public async getAllPlayers(req: Request, res: Response): Promise<void> {
    try {
      const players = await redisService.getAllPlayers();
      res.status(200).json({
        count: players.length,
        redisCommandUsed: 'KEYS player_data:* + GET',
        players,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to list players' });
    }
  }

  /**
   * POST /players/preload
   * Store multiple player profiles at once using Redis MSET command.
   */
  public async preloadPlayers(req: Request, res: Response): Promise<void> {
    try {
      const result = await redisService.preloadPlayers();
      res.status(200).json({
        message: 'Preloaded 3 default players into Redis using MSET command.',
        redisCommandUsed: 'MSET',
        count: result.count,
        players: result.players,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to preload players' });
    }
  }

  /**
   * POST /player/:id/boost
   * Create a temporary boost key with 60s TTL using Redis SETEX command.
   */
  public async boostPlayer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { boostType } = req.body;
      const cleanId = String(id).trim();

      // Check if player exists first
      const existing = await redisService.getPlayer(cleanId);
      if (!existing) {
        res.status(404).json({
          error: `Cannot apply boost. Player ID ${cleanId} does not exist.`,
        });
        return;
      }

      const boostResult = await redisService.setPlayerBoost(
        cleanId,
        boostType || 'XP_MULTIPLIER_2X'
      );

      // Re-fetch player with active boost info
      const updatedPlayer = await redisService.getPlayer(cleanId);

      res.status(200).json({
        message: `Temporary 60-second boost activated for player ${cleanId} using SETEX command.`,
        redisCommandUsed: 'SETEX',
        boostKey: boostResult.key,
        ttlSeconds: boostResult.ttl,
        boostValue: boostResult.value,
        player: updatedPlayer,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to activate boost' });
    }
  }

  /**
   * POST /player/:id/achievement
   * Append a new achievement to the player string using Redis APPEND command.
   * Body: { achievement: "Champion" }
   */
  public async appendAchievement(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { achievement } = req.body;
      const cleanId = String(id).trim();

      if (!achievement || typeof achievement !== 'string' || !achievement.trim()) {
        res.status(400).json({ error: 'Achievement string is required.' });
        return;
      }

      const result = await redisService.appendAchievement(cleanId, achievement.trim());

      res.status(200).json({
        message: `Achievement "${achievement}" appended to profile using APPEND command.`,
        redisCommandUsed: 'APPEND',
        appendedString: result.appendedValue,
        newStringLength: result.newLength,
        redisValueAfterAppend: result.updatedPlayer.rawString,
        player: result.updatedPlayer,
      });
    } catch (error: any) {
      res.status(error.message?.includes('not found') ? 404 : 500).json({
        error: error.message || 'Failed to append achievement',
      });
    }
  }

  /**
   * DELETE /player/:id
   * Delete player profile from Redis using DEL command.
   */
  public async deletePlayer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const cleanId = String(id).trim();

      const success = await redisService.deletePlayer(cleanId);

      if (!success) {
        res.status(404).json({
          error: `Player ID ${cleanId} was not found or already deleted.`,
          redisCommandUsed: 'DEL',
          redisKey: `player_data:${cleanId}`,
        });
        return;
      }

      res.status(200).json({
        message: `Player profile ${cleanId} deleted from Redis using DEL command.`,
        redisCommandUsed: 'DEL',
        redisKey: `player_data:${cleanId}`,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to delete player' });
    }
  }
}

export const playerController = new PlayerController();
