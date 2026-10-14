
import { Router } from 'express';
import { createHash } from 'crypto';
import { redisClient } from '../utils/redisClient.js';

const router = Router();

const VISITOR_PREFIX = 'visitor_id:';
const VISITOR_COUNT_KEY = 'visitor_count';

router.post('/visitor', async (req, res) => {
  try {
    const visitorId = req.body?.visitorId;

    if (
      typeof visitorId !== 'string' ||
      visitorId.length < 10 ||
      visitorId.length > 100
    ) {
      return res.status(400).json({ error: 'Invalid visitor ID' });
    }

    // Hash the browser ID so raw IDs aren't stored as Redis keys.
    const visitorKey = createHash('sha256')
      .update(visitorId)
      .digest('hex');

    const key = `${VISITOR_PREFIX}${visitorKey}`;
    const existing = await redisClient.get(key);

    if (!existing) {
      await redisClient.set(key, '1');

      // Recount unique visitor keys; exclude the count key itself.
      const visitorKeys = await redisClient.keys(`${VISITOR_PREFIX}*`);
      await redisClient.set(VISITOR_COUNT_KEY, String(visitorKeys.length));
    }

    const count = Number(
      (await redisClient.get(VISITOR_COUNT_KEY)) ?? '0'
    );

    return res.json({ count });
  } catch (error) {
    console.error('Visitor counter error:', error);
    return res.status(500).json({ error: 'Unable to retrieve visitor count' });
  }
});

export default router;
