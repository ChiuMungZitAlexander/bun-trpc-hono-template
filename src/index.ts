import "dotenv/config";

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

app.get("/", async (c) => {
  return c.text("Welcome to server");
});

export default {
  port: process.env.PORT!,
  fetch: app.fetch,
};
