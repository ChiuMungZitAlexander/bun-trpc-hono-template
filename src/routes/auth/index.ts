import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { router, publicProcedure } from "@/trpc";
import { db } from "@/lib/database";
import { createSession } from "@/lib/session";
import { usersTable } from "@/db/schema";

export const authRouter = router({
  signInByEmailAndPassword: publicProcedure
    .input(
      z.object({
        email: z.email().max(255),
        password: z.string().min(6).max(32),
      })
    )
    .output(
      z.object({
        email: z.email().max(255),
        name: z.string().min(3).max(255),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { email, password } = input;

        const [user] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.email, email));

        if (!user) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Password is incorrect",
          });
        }

        const isPasswordValid = await Bun.password.verify(
          password,
          user.hashedPassword
        );

        if (!isPasswordValid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Password is incorrect",
          });
        }

        const sessionId = Bun.randomUUIDv7();

        await createSession(sessionId, { userId: user.id });

        ctx.resHeaders.set(
          "Set-Cookie",
          `sessionId=${sessionId}; Path=/; HttpOnly; SameSite=Strict`
        );

        return {
          email: user.email,
          name: user.name,
        };
      } catch (error) {
        ctx.resHeaders.set(
          "Set-Cookie",
          `sessionId=; Path=/; HttpOnly; SameSite=Strict`
        );

        ctx.logger.error(error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Internal server error",
        });
      }
    }),
});
