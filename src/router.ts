import { initTRPC, TRPCError } from "@trpc/server";
import { DatabaseError } from "pg";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { DrizzleQueryError } from "drizzle-orm/errors";

import { usersTable } from "./db/schema";
import { db } from "./lib/database";
import { loggerMiddleware } from "./middlewares/logger";

const t = initTRPC.create({});

const publicProcedure = t.procedure.use(loggerMiddleware);
const router = t.router;

export const appRouter = router({
  getUser: publicProcedure
    .input(
      z.object({
        email: z.email(),
      })
    )
    .output(
      z
        .object({
          name: z.string(),
          email: z.string(),
        })
        .nullable()
    )
    .query(async ({ input }) => {
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, input.email))
        .limit(1);

      return user || null;
    }),
  createUser: publicProcedure
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
});

export type AppRouter = typeof appRouter;
