import { Router } from 'express';
import { mongoController } from '../controllers/mongoController.js';

const router = Router();

router.get('/mongo/logs', mongoController.getLogs.bind(mongoController));
router.get('/mongo/players', mongoController.getPlayers.bind(mongoController));
router.get('/mongo/player/:id', mongoController.getPlayer.bind(mongoController));

export default router;
