import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { createSession, destroySession } from '@/lib/session';

import { getUserByEmail } from '@/routes/user/user.repository';

import { handleError } from '@/helpers/error';
import { publicProcedure, router } from '@/trpc';

export const authRouter = router({
  /**
   * Sign in by email and password
   */
  signInByEmailAndPassword: publicProcedure
    .input(
      z.object({
        email: z.email().max(255),
        password: z.string().min(6).max(32),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { email, password } = input;

        const user = await getUserByEmail(email);

        if (!user) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Password is incorrect',
          });
        }

        const isPasswordValid = await Bun.password.verify(
          password,
          user.hashedPassword,
        );

        if (!isPasswordValid) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Password is incorrect',
          });
        }

        const sessionId = Bun.randomUUIDv7();

        await createSession(sessionId, { sessionId, userId: user.id });

        ctx.resHeaders.set(
          'Set-Cookie',
          `sessionId=${sessionId}; Path=/; HttpOnly; SameSite=Strict`,
        );

        return {
          email: user.email,
          name: user.name,
        };
      } catch (error) {
        handleError(error, ctx);
      }
    }),

  /**
   *
   */
  signOut: publicProcedure.mutation(async ({ ctx }) => {
    try {
      const sessionId = ctx.session?.sessionId;

      if (!sessionId) {
        return null;
      }

      await destroySession(sessionId);

      ctx.resHeaders.set(
        'Set-Cookie',
        `sessionId=; Path=/; HttpOnly; SameSite=Strict`,
      );

      return null;
    } catch (error) {
      handleError(error, ctx);
    }
  }),
});
