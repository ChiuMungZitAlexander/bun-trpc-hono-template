import { initTRPC, TRPCError } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

import { Env } from "hono-pino";
import { Context } from "hono";
import { getCookie } from "hono/cookie";

import { getSession } from "./lib/session";

export const createTRPCContext = async (
  opts: FetchCreateContextFnOptions,
  c: Context<Env>
) => {
  const { logger } = c.var;

  const cookieSessionId = getCookie(c, "sessionId");
  const session = cookieSessionId ? await getSession(cookieSessionId) : null;

  return {
    ...opts,
    session,
    logger,
  };
};

const t = initTRPC
  .context<Awaited<ReturnType<typeof createTRPCContext>>>()
  .create({
    errorFormatter: ({ shape, error }) => {
      return {
        ...shape,
        data: {
          ...shape.data,
          stack:
            process.env.NODE_ENV === "development"
              ? shape.data.stack
              : undefined,
        },
      };
    },
  });

export const router = t.router;
export const mergeRouters = t.mergeRouters;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  return next();
});
