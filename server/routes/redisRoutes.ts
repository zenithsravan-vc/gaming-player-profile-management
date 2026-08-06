import { Router } from 'express';
import { redisController } from '../controllers/redisController.js';

const router = Router();

// Get Redis command execution logs
router.get('/redis/logs', redisController.getLogs.bind(redisController));

// Get all active Redis keys and TTLs
router.get('/redis/keys', redisController.getKeys.bind(redisController));

// Inspect raw key
router.get('/redis/raw/:key', redisController.getRawKey.bind(redisController));

export default router;
