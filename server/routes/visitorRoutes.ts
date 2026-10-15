
import { Router } from 'express';
import { createHash } from 'crypto';
import { redisClient } from '../utils/redisClient.js';

const router = Router();

const VISITOR_PREFIX = 'visitor_id:';
const VISITOR_COUNT_KEY = 'visitor_count';

const ACTIVE_PREFIX = 'active_visitor:';
const ACTIVE_COUNT_KEY = 'active_visitor_count';
const ACTIVE_TIMEOUT_SECONDS = 60;

router.post('/visitor', async (req, res) => {
  try {
    const visitorId = req.body?.visitorId;
    const sessionId = req.body?.sessionId;

    if (
      typeof visitorId !== 'string' ||
      visitorId.length < 10 ||
      visitorId.length > 100 ||
      typeof sessionId !== 'string' ||
      sessionId.length < 10 ||
      sessionId.length > 100
    ) {
      return res.status(400).json({
        error: 'Invalid visitor or session ID',
      });
    }

    const hashedVisitorId = createHash('sha256')
      .update(visitorId)
      .digest('hex');

    const hashedSessionId = createHash('sha256')
      .update(sessionId)
      .digest('hex');

    // Count each browser ID only once.
    const visitorKey = `${VISITOR_PREFIX}${hashedVisitorId}`;
    const existingVisitor = await redisClient.get(visitorKey);

    if (!existingVisitor) {
      await redisClient.set(visitorKey, '1');

      const visitorKeys = await redisClient.keys(
        `${VISITOR_PREFIX}*`
      );

      await redisClient.set(
        VISITOR_COUNT_KEY,
        String(visitorKeys.length)
      );
    }

    const uniqueCount = Number(
      (await redisClient.get(VISITOR_COUNT_KEY)) ?? '0'
    );

    // Refresh this session's active marker.
    const activeKey = `${ACTIVE_PREFIX}${hashedSessionId}`;
    await redisClient.setex(
      activeKey,
      ACTIVE_TIMEOUT_SECONDS,
      String(Date.now())
    );

    // Count only active markers that have not expired.
    const activeKeys = await redisClient.keys(
      `${ACTIVE_PREFIX}*`
    );

    const activeCount = activeKeys.length;

    await redisClient.set(
      ACTIVE_COUNT_KEY,
      String(activeCount)
    );

    return res.json({
      uniqueVisitors: uniqueCount,
      activeVisitors: activeCount,
    });
  } catch (error) {
    console.error('Visitor counter error:', error);

    return res.status(500).json({
      error: 'Unable to retrieve visitor counts',
    });
  }
});

// Called when a browser tab is closing.
router.post('/visitor/leave', async (req, res) => {
  try {
    const sessionId = req.body?.sessionId;

    if (
      typeof sessionId !== 'string' ||
      sessionId.length < 10 ||
      sessionId.length > 100
    ) {
      return res.status(400).json({
        error: 'Invalid session ID',
      });
    }

    const hashedSessionId = createHash('sha256')
      .update(sessionId)
      .digest('hex');

    await redisClient.del(
      `${ACTIVE_PREFIX}${hashedSessionId}`
    );

    const activeKeys = await redisClient.keys(
      `${ACTIVE_PREFIX}*`
    );

    await redisClient.set(
      ACTIVE_COUNT_KEY,
      String(activeKeys.length)
    );

    return res.json({
      activeVisitors: activeKeys.length,
    });
  } catch (error) {
    console.error('Visitor leave error:', error);

    return res.status(500).json({
      error: 'Unable to update active visitors',
    });
  }
});

export default router;
