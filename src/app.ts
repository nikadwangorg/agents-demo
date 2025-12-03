import Fastify from 'fastify';
import cors from '@fastify/cors';
import { objectivesRoutes } from './routes/objectives.routes.js';
import { keyResultsRoutes } from './routes/keyresults.routes.js';

export async function buildApp(options = {}) {
  const app = Fastify({
    logger:
      process.env.NODE_ENV === 'test'
        ? false
        : {
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
            transport:
              process.env.NODE_ENV !== 'production'
                ? {
                    target: 'pino-pretty',
                    options: {
                      colorize: true,
                      translateTime: 'HH:MM:ss Z',
                      ignore: 'pid,hostname',
                    },
                  }
                : undefined,
          },
    ...options,
  });

  // Register CORS only if not in test mode
  if (process.env.NODE_ENV !== 'test') {
    await app.register(cors, {
      origin: true,
    });
  }

  // Health check endpoint
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register routes
  await app.register(objectivesRoutes);
  await app.register(keyResultsRoutes);

  return app;
}
