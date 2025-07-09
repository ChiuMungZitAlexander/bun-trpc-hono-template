import { trpcServer } from '@hono/trpc-server';
import { Hono } from 'hono';
import { Env, pinoLogger } from 'hono-pino';
import { cors } from 'hono/cors';
import { pino } from 'pino';

import { initRedis } from './lib/redis';
import { appRouter } from './root';
import { createTRPCContext } from './trpc';

await initRedis();

const app = new Hono<Env>();

app.use(
  pinoLogger({
    pino: pino({
      base: null,
      level: 'trace',
      transport: {
        target: 'hono-pino/debug-log',
        options: {
          colorEnabled: process.env.NODE_ENV === 'development',
        },
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    }),
  }),
);

app.use(
  '/*',
  cors({
    origin: process.env.CORS_ORIGIN!,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext: createTRPCContext,
  }),
);

app.get('/', async (c) => {
  return c.text('Welcome to server');
});

export default {
  port: process.env.PORT!,
  fetch: app.fetch,
};
