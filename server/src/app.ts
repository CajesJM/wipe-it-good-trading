import cors from "cors";
import express from "express";
import helmet from "helmet";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient, Prisma } from "@prisma/client";
import { z } from "zod";
import { ConfiguredGateway } from "./payments/gateway.js";

const prisma = new PrismaClient();
const gateway = new ConfiguredGateway();
const app = express();
const JWT_SECRET = process.env.JWT_SECRET ?? "development-only-change-me";
type AuthRequest = express.Request & { user?: { id: string; role: string } };

app.use(helmet());
app.use(cors({ origin: process.env.APP_ORIGIN?.split(",") ?? "http://localhost:5173", credentials: true }));

const publicUser = (user: any) => ({ id: user.id, email: user.email, fullName: user.fullName, phone: user.phone, role: user.role, verifiedAt: user.verifiedAt, createdAt: user.createdAt, profileImage: imageSrc({ data: user.profileImageData, mimeType: user.profileImageMimeType }), addresses: user.addresses ?? [] });
const imageRecord = (imageUrl: string | undefined, altText: string): any => {
  if (!imageUrl) return undefined;
  const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (match) return { data: Buffer.from(match[2], "base64"), mimeType: match[1], altText };
  return { url: imageUrl, altText };
};
const imageSrc = (image: any) => image?.data && image?.mimeType ? `data:${image.mimeType};base64,${Buffer.from(image.data).toString("base64")}` : image?.url ?? "";
const publicProduct = (product: any) => {
  const { images, ...rest } = product;
  return { ...rest, images: images?.map((image: any) => ({ id: image.id, url: image.url, mimeType: image.mimeType, altText: image.altText, sortOrder: image.sortOrder })), price: product.priceCentavos / 100, availableStock: Math.max(0, product.stockOnHand - product.stockReserved), image: imageSrc(images?.[0]) };
};
const publicOrder = (order: any) => ({ ...order, total: order.totalCentavos / 100, subtotal: order.subtotalCentavos / 100, shipping: order.shippingCentavos / 100 });

const auth = async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Sign in is required." });
  try { req.user = jwt.verify(header.slice(7), JWT_SECRET) as { id: string; role: string }; next(); } catch { return res.status(401).json({ error: "Your session has expired. Please sign in again." }); }
};
const admin = (req: AuthRequest, res: express.Response, next: express.NextFunction) => req.user?.role === "ADMIN" || req.user?.role === "STAFF" ? next() : res.status(403).json({ error: "Admin access is required." });
const customerOnly = (req: AuthRequest, res: express.Response, next: express.NextFunction) => req.user?.role === "CUSTOMER" ? next() : res.status(403).json({ error: "Admin accounts cannot shop or place orders." });
const issueToken = (user: any) => jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "2h" });

// Payment webhooks must use the raw body for signature verification.
app.post("/api/webhooks/payments/:provider", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const event = await gateway.verifyWebhook(req.body, req.header("x-webhook-signature"));
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (await tx.paymentEvent.findUnique({ where: { providerEventId: event.eventId } })) return;
      const payment = await tx.payment.findUnique({ where: { providerReference: event.providerReference } });
      await tx.paymentEvent.create({ data: { paymentId: payment?.id, provider: String(req.params.provider), providerEventId: event.eventId, eventType: event.type, payload: event.raw as any, processedAt: new Date() } });
      if (!payment) return;
      const paid = event.type === "payment.paid";
      const nextPaymentStatus = paid ? "PAID" : event.type === "refund.paid" ? "REFUNDED" : event.type === "payment.failed" ? "FAILED" : "CANCELLED";
      await tx.payment.update({ where: { id: payment.id }, data: { status: nextPaymentStatus, paidAt: paid ? new Date() : undefined } });
      if (paid) {
        await tx.order.update({ where: { id: payment.orderId }, data: { status: "CONFIRMED" } });
        await tx.orderStatusEvent.create({ data: { orderId: payment.orderId, status: "CONFIRMED", note: "GCash payment confirmed by provider webhook" } });
      }
    });
    return res.sendStatus(204);
  } catch (error) { console.error("payment_webhook_failed", error); return res.status(400).json({ error: "Invalid payment webhook." }); }
});
app.use(express.json({ limit: "8mb" }));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const input = z.object({ fullName: z.string().min(2), email: z.string().email(), password: z.string().min(8), phone: z.string().min(7), address: z.string().min(10) }).parse(req.body);
    const email = input.email.trim().toLowerCase();
    if (await prisma.user.findUnique({ where: { email } })) return res.status(409).json({ error: "An account already exists for this email." });
    const user = await prisma.user.create({ data: { fullName: input.fullName.trim(), email, passwordHash: await bcrypt.hash(input.password, 12), phone: input.phone, addresses: { create: { recipientName: input.fullName, phone: input.phone, line1: input.address, isDefault: true } } }, include: { addresses: true } });
    return res.status(201).json({ accessToken: issueToken(user), user: publicUser(user), addresses: user.addresses });
  } catch (error) { return next(error); }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const input = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() }, include: { addresses: { orderBy: { isDefault: "desc" } } } });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) return res.status(401).json({ error: "Invalid email or password." });
    return res.json({ accessToken: issueToken(user), user: publicUser(user), addresses: user.addresses });
  } catch (error) { return next(error); }
});

app.get("/api/auth/me", auth, async (req: AuthRequest, res, next) => { try { const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id }, include: { addresses: { orderBy: { isDefault: "desc" } } } }); res.json({ user: publicUser(user) }); } catch (error) { next(error); } });
app.patch("/api/auth/me", auth, async (req: AuthRequest, res, next) => {
  try {
    const input = z.object({ fullName: z.string().min(2), email: z.string().email(), phone: z.string().min(7), address: z.string().min(3), profileImage: z.string().nullable().optional() }).parse(req.body);
    const duplicate = await prisma.user.findFirst({ where: { email: input.email.toLowerCase(), NOT: { id: req.user!.id } } });
    if (duplicate) return res.status(409).json({ error: "That email is already in use." });
    const image = input.profileImage === undefined ? undefined : imageRecord(input.profileImage ?? undefined, "Profile photo");
    await prisma.user.update({ where: { id: req.user!.id }, data: { fullName: input.fullName.trim(), email: input.email.toLowerCase(), phone: input.phone, ...(input.profileImage === undefined ? {} : image ? { profileImageData: image.data, profileImageMimeType: image.mimeType } : { profileImageData: null, profileImageMimeType: null }) } });
    const address = await prisma.address.findFirst({ where: { userId: req.user!.id, isDefault: true } });
    if (address) await prisma.address.update({ where: { id: address.id }, data: { recipientName: input.fullName, phone: input.phone, line1: input.address } });
    else await prisma.address.create({ data: { userId: req.user!.id, recipientName: input.fullName, phone: input.phone, line1: input.address, isDefault: true } });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id }, include: { addresses: { orderBy: { isDefault: "desc" } } } });
    return res.json({ user: publicUser(user), addresses: user.addresses });
  } catch (error) { next(error); }
});
app.post("/api/auth/change-password", auth, async (req: AuthRequest, res, next) => {
  try {
    const input = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8) }).parse(req.body);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
    if (!(await bcrypt.compare(input.currentPassword, user.passwordHash))) return res.status(400).json({ error: "Current password is incorrect." });
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(input.newPassword, 12) } });
    return res.sendStatus(204);
  } catch (error) { next(error); }
});

app.get("/api/products", async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({ where: { status: "ACTIVE", category: req.query.category ? { slug: String(req.query.category) } : undefined, name: req.query.q ? { contains: String(req.query.q), mode: "insensitive" } : undefined }, include: { category: true, images: { orderBy: { sortOrder: "asc" } } }, orderBy: { createdAt: "desc" }, take: 60 });
    res.json({ data: products.map(publicProduct) });
  } catch (error) { next(error); }
});

app.get("/api/addresses", auth, async (req: AuthRequest, res, next) => { try { res.json({ data: await prisma.address.findMany({ where: { userId: req.user!.id }, orderBy: { isDefault: "desc" } }) }); } catch (error) { next(error); } });
app.post("/api/addresses", auth, async (req: AuthRequest, res, next) => { try { const input = z.object({ recipientName: z.string().min(2), phone: z.string().min(7), line1: z.string().min(3), barangay: z.string().default(""), city: z.string().default(""), province: z.string().default(""), postalCode: z.string().default(""), isDefault: z.boolean().optional() }).parse(req.body); const address = await prisma.address.create({ data: { ...input, userId: req.user!.id } }); res.status(201).json(address); } catch (error) { next(error); } });

app.get("/api/cart", auth, customerOnly, async (req: AuthRequest, res, next) => { try { const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id }, include: { items: { include: { product: { include: { category: true, images: { orderBy: { sortOrder: "asc" } } } } } } } }); res.json({ items: cart?.items ?? [] }); } catch (error) { next(error); } });
app.post("/api/cart/items", auth, customerOnly, async (req: AuthRequest, res, next) => { try { const input = z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(99) }).parse(req.body); const product = await prisma.product.findFirst({ where: { id: input.productId, status: "ACTIVE" } }); if (!product) return res.status(404).json({ error: "Product unavailable." }); const cart = await prisma.cart.upsert({ where: { userId: req.user!.id }, create: { userId: req.user!.id }, update: {} }); const item = await prisma.cartItem.upsert({ where: { cartId_productId: { cartId: cart.id, productId: product.id } }, create: { cartId: cart.id, productId: product.id, quantity: input.quantity }, update: { quantity: { increment: input.quantity } } }); res.status(201).json(item); } catch (error) { next(error); } });
app.patch("/api/cart/items/:id", auth, customerOnly, async (req: AuthRequest, res, next) => { try { const input = z.object({ quantity: z.number().int().min(1).max(99) }).parse(req.body); const item = await prisma.cartItem.findFirst({ where: { id: String(req.params.id), cart: { userId: req.user!.id } } }); if (!item) return res.status(404).json({ error: "Cart item not found." }); res.json(await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: input.quantity } })); } catch (error) { next(error); } });
app.delete("/api/cart/items/:id", auth, customerOnly, async (req: AuthRequest, res, next) => { try { await prisma.cartItem.deleteMany({ where: { id: String(req.params.id), cart: { userId: req.user!.id } } }); res.sendStatus(204); } catch (error) { next(error); } });
app.delete("/api/cart/items", auth, customerOnly, async (req: AuthRequest, res, next) => { try { await prisma.cartItem.deleteMany({ where: { cart: { userId: req.user!.id } } }); res.sendStatus(204); } catch (error) { next(error); } });

app.post("/api/orders", auth, customerOnly, async (req: AuthRequest, res, next) => {
  try {
    const input = z.object({ addressId: z.string().uuid(), paymentMethod: z.enum(["COD", "GCash"]) }).parse(req.body);
    const address = await prisma.address.findFirst({ where: { id: input.addressId, userId: req.user!.id } });
    const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id }, include: { items: { include: { product: { include: { images: true } } } } } });
    if (!address || !cart?.items.length) return res.status(400).json({ error: "A delivery address and cart items are required." });
    const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let subtotal = 0;
      for (const item of cart.items) { const available = item.product.stockOnHand - item.product.stockReserved; if (available < item.quantity) throw new Error(`${item.product.name} is out of stock.`); subtotal += item.product.priceCentavos * item.quantity; }
      const shipping = subtotal >= 100000 ? 0 : 10000;
      const created = await tx.order.create({ data: { orderNumber: `WIG-${Date.now().toString(36).toUpperCase()}`, userId: req.user!.id, addressId: address.id, status: input.paymentMethod === "GCash" ? "PAYMENT_PENDING" : "PENDING", paymentMethod: input.paymentMethod === "GCash" ? "GCASH" : "COD", subtotalCentavos: subtotal, shippingCentavos: shipping, totalCentavos: subtotal + shipping, recipientName: address.recipientName, recipientPhone: address.phone, deliveryAddress: [address.line1, address.barangay, address.city, address.province, address.postalCode].filter(Boolean).join(", "), items: { create: cart.items.map((item: any) => ({ productId: item.productId, skuSnapshot: item.product.sku, nameSnapshot: item.product.name, unitPriceCentavos: item.product.priceCentavos, quantity: item.quantity, lineTotalCentavos: item.product.priceCentavos * item.quantity })) }, statusEvents: { create: { status: input.paymentMethod === "GCash" ? "PAYMENT_PENDING" : "PENDING", note: "Order placed" } } }, include: { items: true } });
      for (const item of cart.items) { await tx.product.update({ where: { id: item.productId }, data: { stockReserved: { increment: item.quantity } } }); await tx.inventoryMovement.create({ data: { productId: item.productId, orderId: created.id, quantity: item.quantity, reason: "RESERVATION" } }); }
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return created;
    });
    if (input.paymentMethod === "GCash") { const session = await gateway.createCheckout({ orderId: order.id, orderNumber: order.orderNumber, amountCentavos: order.totalCentavos, customerName: address.recipientName, customerEmail: (await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } })).email }); await prisma.payment.create({ data: { orderId: order.id, method: "GCASH", amountCentavos: order.totalCentavos, provider: process.env.PAYMENT_PROVIDER ?? "sandbox", providerReference: session.providerReference, checkoutUrl: session.checkoutUrl, expiresAt: session.expiresAt } }); return res.status(201).json({ order: publicOrder(order), checkoutUrl: session.checkoutUrl }); }
    await prisma.payment.create({ data: { orderId: order.id, method: "COD", amountCentavos: order.totalCentavos } });
    return res.status(201).json({ order: publicOrder(order) });
  } catch (error) { next(error); }
});
app.post("/api/orders/:id/cancel", auth, customerOnly, async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.order.findFirst({ where: { userId: req.user!.id, OR: [{ id: String(req.params.id) }, { orderNumber: String(req.params.id) }] }, include: { items: true } });
    if (!existing) return res.status(404).json({ error: "Order not found." });
    if (!["PAYMENT_PENDING", "PENDING", "CONFIRMED", "PACKED"].includes(existing.status)) return res.status(409).json({ error: "This order can no longer be cancelled." });
    const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.order.update({ where: { id: existing.id }, data: { status: "CANCELLED", statusEvents: { create: { status: "CANCELLED", note: "Cancelled by customer" } } }, include: { items: true } });
      for (const item of (existing as any).items as Array<{ productId: string; quantity: number }>) { await tx.product.update({ where: { id: item.productId }, data: { stockReserved: { decrement: item.quantity } } }); await tx.inventoryMovement.create({ data: { productId: item.productId, orderId: existing.id, quantity: item.quantity, reason: "RELEASE", reference: "customer-cancellation" } }); }
      return updated;
    });
    return res.json({ data: publicOrder(order) });
  } catch (error) { next(error); }
});
app.get("/api/orders", auth, async (req: AuthRequest, res, next) => { try { const orders = await prisma.order.findMany({ where: { userId: req.user!.id }, include: { items: { include: { product: { include: { category: true, images: true } } } }, user: true }, orderBy: { placedAt: "desc" } }); res.json({ data: orders.map(publicOrder) }); } catch (error) { next(error); } });

const categoryFor = async (name: string) => { const cleanName = name.trim(); const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-"); return prisma.category.upsert({ where: { slug }, create: { name: cleanName, slug }, update: { name: cleanName } }); };
app.get("/api/admin/orders", auth, admin, async (_req, res, next) => { try { res.json({ data: (await prisma.order.findMany({ include: { user: true, statusEvents: { orderBy: { createdAt: "desc" } }, items: { include: { product: { include: { category: true, images: true } } } } }, orderBy: { placedAt: "desc" } })).map(publicOrder) }); } catch (error) { next(error); } });
app.patch("/api/admin/orders/:id/status", auth, admin, async (req: AuthRequest, res, next) => {
  try {
    const status = z.enum(["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"]).parse(req.body.status);
    const orderId = String(req.params.id);
    const existing = await prisma.order.findFirst({ where: { OR: [{ id: orderId }, { orderNumber: orderId }] }, include: { items: true } });
    if (!existing) return res.status(404).json({ error: "Order not found." });
    const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.order.update({ where: { id: existing.id }, data: { status, statusEvents: { create: { status } } } });
      if (status === "DELIVERED" && existing.status !== "DELIVERED") {
        for (const item of (existing as any).items as Array<{ productId: string; quantity: number }>) {
          await tx.product.update({ where: { id: item.productId }, data: ({ stockOnHand: { decrement: item.quantity }, stockReserved: { decrement: item.quantity }, soldCount: { increment: item.quantity } } as any) });
          await tx.inventoryMovement.create({ data: { productId: item.productId, orderId: existing.id, quantity: item.quantity, reason: "SALE", reference: "order-delivered" } });
        }
      }
      return updated;
    });
    res.json({ data: publicOrder(order) });
  } catch (error) { next(error); }
});
app.get("/api/admin/customers", auth, admin, async (_req, res, next) => { try { res.json({ data: await prisma.user.findMany({ where: { role: "CUSTOMER" }, include: { addresses: true, _count: { select: { orders: true } } }, orderBy: { createdAt: "desc" } }) }); } catch (error) { next(error); } });
app.post("/api/admin/products", auth, admin, async (req, res, next) => { try { const input = z.object({ name: z.string().min(2), description: z.string().min(5), category: z.string().min(2), priceCentavos: z.number().int().nonnegative(), stock: z.number().int().nonnegative(), imageUrl: z.string().min(1).optional(), rating: z.number().min(0).max(5).optional(), soldCount: z.number().int().nonnegative().optional(), featured: z.boolean().optional(), topSelling: z.boolean().optional() }).parse(req.body); const category = await categoryFor(input.category); const product = await prisma.product.create({ data: ({ categoryId: category.id, sku: `WIG-${Date.now()}`, slug: `${input.name}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name: input.name, description: input.description, priceCentavos: input.priceCentavos, stockOnHand: input.stock, rating: input.rating ?? 0, soldCount: input.soldCount ?? 0, status: "ACTIVE", featured: input.featured ?? false, topSelling: input.topSelling ?? false, images: imageRecord(input.imageUrl, input.name) ? { create: imageRecord(input.imageUrl, input.name) } : undefined } as any), include: { category: true, images: true } }); res.status(201).json({ data: publicProduct(product) }); } catch (error) { next(error); } });
app.patch("/api/admin/products/:id", auth, admin, async (req, res, next) => { try { const input = z.object({ name: z.string().min(2).optional(), description: z.string().min(5).optional(), category: z.string().min(2).optional(), priceCentavos: z.number().int().nonnegative().optional(), stock: z.number().int().nonnegative().optional(), imageUrl: z.string().min(1).optional(), rating: z.number().min(0).max(5).optional(), soldCount: z.number().int().nonnegative().optional(), featured: z.boolean().optional(), topSelling: z.boolean().optional() }).parse(req.body); const category = input.category ? await categoryFor(input.category) : undefined; const image = imageRecord(input.imageUrl, input.name ?? "Product"); const product = await prisma.product.update({ where: { id: String(req.params.id) }, data: ({ name: input.name, description: input.description, categoryId: category?.id, priceCentavos: input.priceCentavos, stockOnHand: input.stock, rating: input.rating, soldCount: input.soldCount, featured: input.featured, topSelling: input.topSelling, images: image ? { deleteMany: {}, create: image } : undefined } as any), include: { category: true, images: true } }); res.json({ data: publicProduct(product) }); } catch (error) { next(error); } });
app.delete("/api/admin/products/:id", auth, admin, async (req, res, next) => { try { const productId = String(req.params.id); await prisma.$transaction([prisma.productImage.deleteMany({ where: { productId } }), prisma.product.update({ where: { id: productId }, data: { status: "ARCHIVED" } })]); res.sendStatus(204); } catch (error) { next(error); } });

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => { if (error instanceof z.ZodError) return res.status(422).json({ error: "Validation failed", details: error.issues }); console.error(error); return res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" }); });
const port = Number(process.env.PORT ?? 5000);
app.listen(port, () => console.log(`Wipe It Good API listening on :${port}`));
