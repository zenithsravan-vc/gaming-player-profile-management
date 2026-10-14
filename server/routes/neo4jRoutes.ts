
import { Router } from 'express';
import { getPlayerConnections } from '../services/neo4jService.js';

const router = Router();

router.get('/player-connections', async (_req, res) => {
  try {
    const connections = await getPlayerConnections();
    res.json({ count: connections.length, connections });
  } catch (error) {
    console.error('Neo4j error:', error);
    res.status(500).json({ error: 'Failed to fetch player connections' });
  }
});

export default router;