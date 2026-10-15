
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
      return res.status(400).json({
        error: 'Invalid visitor ID',
      });
    }

    // Hash the browser ID before storing it.
    const hashedVisitorId = createHash('sha256')
      .update(visitorId)
      .digest('hex');

    const visitorKey = `${VISITOR_PREFIX}${hashedVisitorId}`;

    // Check whether this browser has already been counted.
    const existing = await redisClient.get(visitorKey);

    if (!existing) {
      // Register the new browser.
      await redisClient.set(visitorKey, '1');

      // Recalculate the total unique browser IDs.
      const visitorKeys = await redisClient.keys(
        `${VISITOR_PREFIX}*`
      );

      await redisClient.set(
        VISITOR_COUNT_KEY,
        String(visitorKeys.length)
      );
    }

    // Return the stored total.
    const storedCount = await redisClient.get(
      VISITOR_COUNT_KEY
    );

    const count = Number(storedCount ?? '0');

    return res.json({ count });
  } catch (error) {
    console.error('Visitor counter error:', error);

    return res.status(500).json({
      error: 'Unable to retrieve visitor count',
    });
  }
});

export default router;
