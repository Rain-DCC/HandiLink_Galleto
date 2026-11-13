import 'dotenv/config';
import express from 'express';
import http from 'http';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { initializeDatabase } from './server/db.ts';
import { apiGateway } from './server/gateway.ts';

const PORT = Number(process.env.PORT || 3000);

export async function createAppServer(httpServer?: http.Server) {
  const isProd = process.env.NODE_ENV === 'production';
  initializeDatabase();

  const app = express();
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      frameguard: false, // Required so AI Studio preview iframe embeds smoothly
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Mount API Gateway
  app.use('/api/gateway', apiGateway);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr:
          process.env.DISABLE_HMR === 'true'
            ? false
            : httpServer
            ? { server: httpServer }
            : false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  return app;
}

// Start HTTP server when run directly
const isDirectExecution = process.argv[1] && process.argv[1].endsWith('server.ts');
if (isDirectExecution) {
  const httpServer = http.createServer();
  createAppServer(httpServer).then(app => {
    httpServer.on('request', app);
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`HandiLink Full-Stack Server & API Gateway running on http://0.0.0.0:${PORT}`);
    });
  });
}
