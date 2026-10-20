import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { existsSync } from "node:fs";
import { createStore } from "./store.js";
import { createApp } from "./app.js";
const production = process.env.NODE_ENV === "production";
if ((production || process.env.MONGODB_URI) && !process.env.ADMIN_TOKEN)
  throw new Error("Set ADMIN_TOKEN before using production mode or MongoDB.");
const store = await createStore({ mongoUri: process.env.MONGODB_URI });
const app = createApp(store, {
  adminToken: process.env.ADMIN_TOKEN,
  production,
});
const dist = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../frontend/dist",
);
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get("/{*path}", (_req, res) =>
    res.sendFile(path.join(dist, "index.html")),
  );
}
const host = process.env.HOST || "127.0.0.1";
if (host !== "127.0.0.1" && host !== "localhost" && !process.env.ADMIN_TOKEN)
  throw new Error("Set ADMIN_TOKEN before binding to a non-loopback host.");
app.listen(process.env.PORT || 4000, host, () =>
  console.log(
    `OFFSCRIPT API http://${host}:${process.env.PORT || 4000} (${store.mode})`,
  ),
);
