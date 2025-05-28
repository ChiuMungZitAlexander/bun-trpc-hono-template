import "dotenv/config";

import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";

import { appRouter, TRPCContext } from "./router";
import { getSession, createSession, destroySession } from "./lib/session";
import { initRedis } from "./lib/redis";

await initRedis();

const app = new Hono();

const createContext = async (
  opts: any,
  c: any
): Promise<Record<string, unknown>> => {
  const sessionId = c.req.header("cookie")?.match(/sessionId=([^;]+)/)?.[1];

  let session = null;
  if (sessionId) {
    const sessionData = await getSession(sessionId);
    if (sessionData) {
      session = {
        id: sessionId,
        userId: sessionData.userId,
        data: sessionData.data,
      };
    }
  }

  return {
    session,
    setSession: async (newSessionId: string, userId: string, data?: any) => {
      await createSession(newSessionId, userId, data);
      c.header(
        "Set-Cookie",
        `sessionId=${newSessionId}; HttpOnly; Path=/; Max-Age=3600; SameSite=Lax${
          process.env.NODE_ENV === "production" ? "; Secure" : ""
        }`
      );
    },
    clearSession: async () => {
      if (sessionId) {
        await destroySession(sessionId);
      }
      c.header(
        "Set-Cookie",
        "sessionId=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax"
      );
    },
  } as TRPCContext;
};

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  })
);

app.get("/", async (c) => {
  return c.text("Welcome to server");
});

export default {
  port: process.env.PORT!,
  fetch: app.fetch,
};
