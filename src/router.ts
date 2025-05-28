import { initTRPC, TRPCError } from "@trpc/server";
import { DatabaseError } from "pg";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { DrizzleQueryError } from "drizzle-orm/errors";

import { usersTable } from "./db/schema";
import { db } from "./lib/database";
import { loggerMiddleware } from "./middlewares/logger";

// Context type for tRPC
export interface TRPCContext {
  session: {
    id: string | null;
    userId: string | null;
    data: any;
  } | null;
  setSession: (sessionId: string, userId: string, data?: any) => Promise<void>;
  clearSession: () => Promise<void>;
  [key: string]: unknown;
}

const t = initTRPC.context<TRPCContext>().create({
  errorFormatter: ({ shape, error }) => {
    return {
      ...shape,
      data: {
        ...shape.data,
        stack:
          process.env.NODE_ENV === "development" ? shape.data.stack : undefined,
      },
    };
  },
});

const publicProcedure = t.procedure.use(loggerMiddleware);

const protectedProcedure = t.procedure
  .use(loggerMiddleware)
  .use(async ({ ctx, next }) => {
    if (!ctx.session?.userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to access this resource",
      });
    }
    return next();
  });

const router = t.router;

export const appRouter = router({
  signInByEmailAndPassword: publicProcedure
    .input(
      z.object({
        email: z.email(),
        password: z.string().min(6).max(32),
      })
    )
    .output(
      z
        .object({
          name: z.string(),
          email: z.string(),
          sessionId: z.string(),
        })
        .nullable()
    )
    .mutation(async ({ input, ctx }) => {
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, input.email))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found or password is incorrect",
        });
      }

      const isPasswordValid = await Bun.password.verify(
        input.password,
        user.hashedPassword
      );

      if (!isPasswordValid) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found or password is incorrect",
        });
      }

      const sessionId = Bun.randomUUIDv7();
      await ctx.setSession(sessionId, user.id, {
        name: user.name,
        email: user.email,
      });

      return {
        name: user.name,
        email: user.email,
        sessionId,
      };
    }),
  signUp: publicProcedure
    .input(
      z.object({
        name: z.string().min(3).max(255),
        email: z.string().max(255),
        password: z.string().min(6).max(32),
      })
    )
    .output(
      z.object({
        name: z.string(),
        email: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const hashedPassword = await Bun.password.hash(input.password);

        const [user] = await db
          .insert(usersTable)
          .values({ ...input, hashedPassword })
          .returning({ name: usersTable.name, email: usersTable.email });

        return user;
      } catch (error) {
        if (
          error instanceof DrizzleQueryError &&
          error.cause instanceof DatabaseError &&
          error.cause.code === "23505"
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email already exists",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to create user",
        });
      }
    }),
  getSession: publicProcedure
    .output(
      z.object({
        userId: z.string().nullable(),
        data: z.any().nullable(),
      })
    )
    .query(async ({ ctx }) => {
      if (!ctx.session) {
        return {
          userId: null,
          data: null,
        };
      }

      return {
        userId: ctx.session.userId,
        data: ctx.session.data,
      };
    }),
  signOut: publicProcedure.mutation(async ({ ctx }) => {
    await ctx.clearSession();
    return { success: true };
  }),
  getProfile: protectedProcedure
    .output(
      z.object({
        userId: z.string(),
        name: z.string(),
        email: z.string(),
      })
    )
    .query(async ({ ctx }) => {
      if (!ctx.session?.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to access this resource",
        });
      }

      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, ctx.session.userId))
        .limit(1);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return {
        userId: user.id,
        name: user.name,
        email: user.email,
      };
    }),
});

export type AppRouter = typeof appRouter;
