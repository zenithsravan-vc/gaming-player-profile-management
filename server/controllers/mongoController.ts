import { Request, Response } from 'express';
import { mongoService } from '../services/mongoService.js';

export const mongoController = {
  async getLogs(req: Request, res: Response) {
    try {
      const logs = await mongoService.getOperationLogs();
      res.json({ logs });
    } catch (error) {
      console.error('MongoDB logs error:', error);
      res.status(500).json({ error: 'Failed to fetch MongoDB logs' });
    }
  },

  async getPlayers(req: Request, res: Response) {
    try {
      const players = await mongoService.getAllPlayers();
      res.json({ players });
    } catch (error) {
      console.error('MongoDB players error:', error);
      res.status(500).json({ error: 'Failed to fetch MongoDB players' });
    }
  },

  async getPlayer(req: Request, res: Response) {
    try {
      const player = await mongoService.getPlayerById(req.params.id);

      if (!player) {
        return res.status(404).json({ error: 'Player not found in MongoDB' });
      }

      res.json({ player });
    } catch (error) {
      console.error('MongoDB player error:', error);
      res.status(500).json({ error: 'Failed to fetch MongoDB player' });
    }
  },
};
