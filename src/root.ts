import { router } from "./trpc";

import { authRouter } from "./routes/auth";

export const appRouter = router({
  authRouter,
});

export type AppRouter = typeof appRouter;
