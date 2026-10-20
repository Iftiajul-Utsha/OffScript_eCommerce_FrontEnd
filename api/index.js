import { createApp } from "../backend/src/app.js";
import { createStore } from "../backend/src/store.js";

let appPromise;
function getApp() {
  if (!appPromise) {
    appPromise = createStore({ mongoUri: process.env.MONGODB_URI }).then(
      (store) =>
        createApp(store, {
          adminToken: process.env.ADMIN_TOKEN,
          production: true,
        }),
    );
  }
  return appPromise;
}

export default async function handler(req, res) {
  const app = await getApp();
  app(req, res);
}
