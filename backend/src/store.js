import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { products } from "./catalog.js";

const directory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../data",
);
export async function createStore({
  mongoUri,
  file = path.join(directory, "store.json"),
} = {}) {
  const initial = {
    products: structuredClone(products),
    orders: [],
    subscribers: [],
    messages: [],
  };
  let model, state;
  if (mongoUri) {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    model = mongoose.model(
      "DemoStore",
      new mongoose.Schema(
        { _id: String, data: mongoose.Schema.Types.Mixed },
        { versionKey: false },
      ),
    );
    const saved = await model.findById("store").lean();
    state = saved?.data || initial;
  } else {
    try {
      state = JSON.parse(await fs.readFile(file, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      state = initial;
    }
  }
  let queue = Promise.resolve();
  async function persist(next) {
    if (model)
      await model.updateOne(
        { _id: "store" },
        { $set: { data: next } },
        { upsert: true },
      );
    else {
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(`${file}.tmp`, JSON.stringify(next, null, 2));
      await fs.rename(`${file}.tmp`, file);
    }
  }
  return {
    mode: mongoUri ? "mongodb" : "local-demo",
    read: () => structuredClone(state),
    mutate(fn) {
      const operation = queue.then(async () => {
        const next = structuredClone(state);
        const result = await fn(next);
        await persist(next);
        state = next;
        return result;
      });
      queue = operation.catch(() => {});
      return operation;
    },
  };
}
