
import { Router } from 'express';
import { getPlayerAnalytics } from '../services/monetdbService.js';

const router = Router();

router.get('/monetdb/analytics', async (_req, res) => {
  try {
    const analytics = await getPlayerAnalytics();
    res.json({
      success: true,
      count: Array.isArray(analytics) ? analytics.length : undefined,
      analytics,
    });
  
} catch (error) {
  console.error('MonetDB error:', error);

  res.status(500).json({
    success: false,
    error: error instanceof Error ? error.message : String(error),
  });
}
});

export default router;