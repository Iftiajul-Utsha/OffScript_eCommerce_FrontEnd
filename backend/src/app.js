import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { statuses } from "./catalog.js";

const text = z.string().trim().min(1).max(200);
const customerSchema = z.object({
  name: text,
  email: z
    .string()
    .trim()
    .email()
    .max(200)
    .transform((v) => v.toLowerCase()),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d ()-]{7,20}$/, "Enter a valid phone number"),
  address: z.string().trim().min(8).max(500),
  city: text,
});
const customizationSchema = z
  .object({
    text: z.string().trim().max(35),
    ink: z.enum(["#f6f0dd", "#fa552d", "#20211e", "#a9c576"]),
    placement: z.enum(["Front", "Back"]),
    font: z.enum(["bold", "serif", "mono"]),
    artwork: z.string().max(1500000).nullable().optional(),
  })
  .superRefine((v, ctx) => {
    if (
      v.artwork &&
      !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v.artwork)
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Upload a PNG, JPEG or WebP image",
      });
    if (!v.text && !v.artwork)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add text or artwork to your custom print",
      });
  });
const orderSchema = z.object({
  customer: customerSchema,
  items: z
    .array(
      z.object({
        productId: text,
        size: text,
        colour: text,
        quantity: z.number().int().min(1).max(20),
        customization: customizationSchema.nullable().optional(),
      }),
    )
    .min(1)
    .max(20),
  coupon: z.string().max(30).optional().default(""),
  requestId: z.string().uuid(),
});

export function createApp(store, { adminToken, production = false } = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json({ limit: "12mb" }));
  app.use(
    "/api",
    rateLimit({
      windowMs: 60000,
      limit: 200,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
  const demo = !adminToken && !production && store.mode === "local-demo";
  app.get("/api/health", (_req, res) =>
    res.json({ ok: true, mode: store.mode, demoAdmin: demo, payments: "demo" }),
  );
  app.get("/api/products", (_req, res) => res.json(store.read().products));
  app.get("/api/products/:id", (req, res) => {
    const p = store.read().products.find((p) => p.id === req.params.id);
    res.status(p ? 200 : 404).json(p || { error: "Product not found" });
  });
  app.post(
    "/api/orders",
    rateLimit({ windowMs: 60000, limit: 20 }),
    async (req, res) => {
      const input = orderSchema.parse(req.body);
      const order = await store.mutate((state) => {
        const previous = state.orders.find(
          (o) => o.requestId === input.requestId,
        );
        if (previous) {
          if (previous.customer.email !== input.customer.email)
            throw Object.assign(new Error("Request already used"), {
              status: 409,
            });
          return previous;
        }
        const items = input.items.map((item) => {
          const product = state.products.find((p) => p.id === item.productId);
          if (
            !product ||
            !product.sizes.includes(item.size) ||
            !product.colours.includes(item.colour)
          )
            throw Object.assign(
              new Error(
                "A product option is no longer available. Update your bag.",
              ),
              { status: 400 },
            );
          return {
            ...item,
            name: product.name,
            image: product.image,
            unitPrice: product.price + (item.customization ? 250 : 0),
          };
        });
        const subtotal = items.reduce(
          (s, i) => s + i.unitPrice * i.quantity,
          0,
        );
        if (input.coupon && input.coupon.toUpperCase() !== "FIRST10")
          throw Object.assign(
            new Error("That discount code is not valid. Try FIRST10."),
            { status: 400 },
          );
        const discount = input.coupon ? Math.round(subtotal * 0.1) : 0;
        const shipping = subtotal - discount >= 2500 ? 0 : 80;
        const order = {
          id: `OS-${randomUUID().slice(0, 8).toUpperCase()}`,
          requestId: input.requestId,
          createdAt: new Date().toISOString(),
          customer: input.customer,
          items,
          subtotal,
          discount,
          shipping,
          total: subtotal - discount + shipping,
          status: items.some((i) => i.customization)
            ? "Artwork review"
            : "Confirmed",
          paymentStatus: "Demo — no payment collected",
        };
        state.orders.unshift(order);
        return order;
      });
      res.status(201).json(order);
    },
  );
  app.post("/api/orders/track", (req, res) => {
    const { id, email } = z
      .object({ id: text, email: z.string().trim().email() })
      .parse(req.body);
    const order = store
      .read()
      .orders.find(
        (o) =>
          o.id === id.toUpperCase() && o.customer.email === email.toLowerCase(),
      );
    if (!order)
      return res
        .status(404)
        .json({
          error:
            "No matching order. Check the order number and checkout email.",
        });
    const { customer, requestId, ...safe } = order;
    res.json({
      ...safe,
      items: safe.items.map(({ customization, ...item }) => ({
        ...item,
        customization: customization
          ? { text: customization.text, placement: customization.placement }
          : null,
      })),
    });
  });
  app.post("/api/newsletter", async (req, res) => {
    const { email } = z
      .object({ email: z.string().trim().email().max(200) })
      .parse(req.body);
    await store.mutate((s) => {
      if (!s.subscribers.includes(email.toLowerCase()))
        s.subscribers.push(email.toLowerCase());
    });
    res
      .status(201)
      .json({
        message: "You’re on the demo list. No emails will be sent yet.",
      });
  });
  app.post("/api/contact", async (req, res) => {
    const data = z
      .object({
        name: text,
        email: z.string().trim().email(),
        message: z.string().trim().min(10).max(2000),
      })
      .parse(req.body);
    await store.mutate((s) =>
      s.messages.unshift({
        ...data,
        id: randomUUID(),
        createdAt: new Date().toISOString(),
      }),
    );
    res
      .status(201)
      .json({
        message:
          "Message saved for this demo. You can view it in the studio dashboard.",
      });
  });
  app.use("/api/admin", (req, res, next) => {
    if (demo) return next();
    const actual = Buffer.from(
      req.headers.authorization?.replace(/^Bearer /, "") || "",
    );
    const expected = Buffer.from(adminToken || "");
    if (
      !expected.length ||
      actual.length !== expected.length ||
      !timingSafeEqual(actual, expected)
    )
      return res.status(401).json({ error: "Enter a valid admin token." });
    next();
  });
  app.get("/api/admin/overview", (_req, res) => {
    const s = store.read();
    res.json({
      orders: s.orders,
      products: s.products,
      messages: s.messages,
      subscribers: s.subscribers.length,
      demo,
    });
  });
  app.patch("/api/admin/orders/:id", async (req, res) => {
    const { status } = z.object({ status: z.enum(statuses) }).parse(req.body);
    const order = await store.mutate((s) => {
      const o = s.orders.find((o) => o.id === req.params.id);
      if (!o)
        throw Object.assign(new Error("Order not found"), { status: 404 });
      o.status = status;
      return o;
    });
    res.json(order);
  });
  app.patch("/api/admin/products/:id", async (req, res) => {
    const update = z
      .object({ price: z.number().int().min(1).max(100000), name: text })
      .parse(req.body);
    const product = await store.mutate((s) => {
      const p = s.products.find((p) => p.id === req.params.id);
      if (!p)
        throw Object.assign(new Error("Product not found"), { status: 404 });
      Object.assign(p, update);
      return p;
    });
    res.json(product);
  });
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: "API route not found" }),
  );
  app.use((error, _req, res, _next) => {
    if (error instanceof z.ZodError)
      return res
        .status(400)
        .json({ error: error.issues[0].message, fields: error.flatten() });
    res
      .status(error.status || 500)
      .json({
        error: error.status
          ? error.message
          : "Unable to complete the request. Please try again.",
      });
    if (!error.status) console.error(error.message);
  });
  return app;
}
