import { mergeRouters } from "./trpc";

import { authRouter } from "./routes/auth";

export const appRouter = mergeRouters(authRouter);

export type AppRouter = typeof appRouter;
