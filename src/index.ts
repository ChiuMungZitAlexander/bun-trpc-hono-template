import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";

import { appRouter } from "./router";

const app = new Hono();

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
  })
);

app.get("/", (c) => c.text("Hello from Bun tRPC Hono!"));

export default {
  port: 8080,
  fetch: app.fetch,
};
