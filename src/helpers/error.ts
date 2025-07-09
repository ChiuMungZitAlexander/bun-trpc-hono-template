import { TRPCError } from '@trpc/server';

import { createTRPCContext } from '@/trpc';

export const handleError = (
  error: unknown,
  ctx: Awaited<ReturnType<typeof createTRPCContext>>,
) => {
  if (error instanceof TRPCError) {
    throw error;
  }

  ctx.logger.error(error);

  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error',
  });
};
