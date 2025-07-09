import { authRouter } from './routes/auth';
import { mergeRouters } from './trpc';

export const appRouter = mergeRouters(authRouter);

export type AppRouter = typeof appRouter;
