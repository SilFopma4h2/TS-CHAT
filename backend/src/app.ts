import express, { type Express } from 'express';
import router from './routes/index.js';
import { notFoundHandler } from './middleware/not-found.js';
import { errorHandler } from './middleware/error-handler.js';

/**
 * Creates and configures the Express application.
 *
 * The HTTP server itself is created in server.ts so that tests can
 * import this factory and start the app on an ephemeral port without
 * the WebSocket transport being wired in (test isolation).
 */
export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(router);

  // 404 + central error handler (must be registered last).
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp();