import { initTRPC } from "@trpc/server";
import { TRPCError } from "@trpc/server";

export const logger = {
  info: (message: string, meta?: Record<string, any>) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta || "");
  },
  error: (message: string, meta?: Record<string, any>) => {
    console.error(
      `[ERROR] ${new Date().toISOString()} - ${message}`,
      meta || ""
    );
  },
  warn: (message: string, meta?: Record<string, any>) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta || "");
  },
};

// Create tRPC instance for middleware
const t = initTRPC.create();

// Logger middleware
export const loggerMiddleware = t.middleware(
  async ({ path, type, next, ctx, input }) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);

    // Log request start
    logger.info(`tRPC Request Started`, {
      requestId,
      path,
      type,
      input,
      timestamp: new Date().toISOString(),
    });

    try {
      // Execute the procedure
      const result = await next();

      const duration = Date.now() - startTime;

      // Log successful completion
      logger.info(`tRPC Request Completed`, {
        requestId,
        path,
        type,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error
      logger.error(`tRPC Request Failed`, {
        requestId,
        path,
        type,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : String(error),
        errorCode: error instanceof TRPCError ? error.code : "UNKNOWN",
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }
);
