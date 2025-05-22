import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";

import { usersTable } from "./db/schema";
import { db } from "./lib/database";

const t = initTRPC.create();

const publicProcedure = t.procedure;
const router = t.router;

export const appRouter = router({
  getUsers: publicProcedure.query(async () => {
    const users = await db.select().from(usersTable);
    return users;
  }),
  createUser: publicProcedure
    .input(
      z.object({
        name: z.string().min(3).max(255),
        email: z.string().max(255),
        password: z.string().min(6).max(32),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const hashedPassword = await Bun.password.hash(input.password);

        const [user] = await db
          .insert(usersTable)
          .values({ ...input, hashedPassword })
          .returning();

        return user;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to create user",
        });
      }
    }),
});

export type AppRouter = typeof appRouter;
