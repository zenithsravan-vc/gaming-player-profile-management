import { Router } from 'express';
import { playerController } from '../controllers/playerController.js';

const router = Router();

// Store Multiple Players (Preload default 3 players using MSET)
router.post('/players/preload', playerController.preloadPlayers.bind(playerController));

// List All Players
router.get('/players', playerController.getAllPlayers.bind(playerController));

// Store a Player Profile (using SET)
router.post('/player', playerController.createPlayer.bind(playerController));

// Retrieve a Player Profile (using GET)
router.get('/player/:id', playerController.getPlayerById.bind(playerController));

// Temporary Boost for Player (using SETEX for 60s)
router.post('/player/:id/boost', playerController.boostPlayer.bind(playerController));

// Append Achievement to Player Profile (using APPEND)
router.post('/player/:id/achievement', playerController.appendAchievement.bind(playerController));

// Delete Player Profile (using DEL)
router.delete('/player/:id', playerController.deletePlayer.bind(playerController));

export default router;
