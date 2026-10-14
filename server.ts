import cors from 'cors';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import playerRoutes from './server/routes/playerRoutes.js';
import redisRoutes from './server/routes/redisRoutes.js';
import mongoRoutes from './server/routes/mongoRoutes.js';
import monetdbRoutes from './server/routes/monetdbRoutes.js';

import neo4jRoutes from './server/routes/neo4jRoutes.js';
import errorReportRoutes from './server/routes/errorReportRoutes.js';
async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Healthcheck Endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Mount Player REST API routes (Direct matching user specs)
  app.use('/', playerRoutes);
  app.use('/api', playerRoutes);

  // Mount Redis Inspector routes
  app.use('/api', redisRoutes);
  app.use('/api', mongoRoutes);
  app.use('/api', errorReportRoutes);
  app.use('/api', monetdbRoutes);
  
  app.use('/api', neo4jRoutes);

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎮 Gaming Player Profile Management server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
