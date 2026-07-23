import cors from "cors";
import express from "express";
import helmet from "helmet";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { PrismaClient, Prisma } from "@prisma/client";
import { z } from "zod";
import { createPaymentGateway } from "./payments/gateway.js";

// Node 22 can load .env without an additional runtime dependency. Keep this
// optional so production hosts that inject environment variables continue to
// work normally.
try { process.loadEnvFile?.(".env"); } catch { /* environment may be injected by the host */ }

const prisma = new PrismaClient();
const gateway = createPaymentGateway();
const app = express();
app.set("trust proxy", 1);
const JWT_SECRET = process.env.JWT_SECRET ?? "development-only-change-me";
const appOrigin = (process.env.APP_ORIGIN?.split(",")[0] ?? "http://localhost:5173").replace(/\/$/, "");
const gcashEnabled = process.env.GCASH_ENABLED === "true";
type AuthRequest = express.Request & { user?: { id: string; role: string } };

app.use(helmet());
app.use((req, res, next) => {
  const enforceHttps = process.env.NODE_ENV === "production" && process.env.ENFORCE_HTTPS !== "false";
  if (enforceHttps && !req.secure) return res.status(426).json({ error: "HTTPS is required." });
  next();
});
const allowedOrigins = new Set(["http://localhost:5173", ...(process.env.APP_ORIGIN ?? "").split(",").map((origin) => origin.trim().replace(/\/$/, "")).filter(Boolean)]);
app.use(cors({ origin: (origin, callback) => { if (!origin || allowedOrigins.has(origin.replace(/\/$/, ""))) return callback(null, true); return callback(new Error("Origin is not allowed by CORS.")); }, credentials: true }));

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
const releaseReservedStock = async (
  tx: Prisma.TransactionClient,
  order: { id: string; items: Array<{ productId: string; quantity: number }> },
  reference: string,
) => {
  for (const item of order.items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stockReserved: { decrement: item.quantity } },
    });
    await tx.inventoryMovement.create({
      data: { productId: item.productId, orderId: order.id, quantity: item.quantity, reason: "RELEASE", reference },
    });
  }
};

const auth = async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Sign in is required." });
  try { req.user = jwt.verify(header.slice(7), JWT_SECRET) as { id: string; role: string }; next(); } catch { return res.status(401).json({ error: "Your session has expired. Please sign in again." }); }
};
const admin = (req: AuthRequest, res: express.Response, next: express.NextFunction) => req.user?.role === "ADMIN" || req.user?.role === "STAFF" ? next() : res.status(403).json({ error: "Admin access is required." });
const customerOnly = (req: AuthRequest, res: express.Response, next: express.NextFunction) => req.user?.role === "CUSTOMER" ? next() : res.status(403).json({ error: "Admin accounts cannot shop or place orders." });
const issueToken = (user: any) => jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "2h" });
const verificationRequired = process.env.REQUIRE_ACCOUNT_VERIFICATION !== "false";
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:5000/api/auth/google/callback";
const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
// Load and normalize the key once at startup. A trailing newline/space copied
// from the Resend dashboard would otherwise produce a misleading 403.
const resendApiKey = process.env.RESEND_API_KEY?.trim();
const resendConfigured = Boolean(resendApiKey);
const mailTransport = smtpConfigured ? nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT ?? 587), secure: String(process.env.SMTP_SECURE ?? "false") === "true", requireTLS: String(process.env.SMTP_SECURE ?? "false") !== "true", connectionTimeout: 30000, greetingTimeout: 30000, socketTimeout: 30000, tls: { minVersion: "TLSv1.2" }, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD?.replace(/\s/g, "") } }) : null;
const hashPin = (pin: string) => crypto.createHash("sha256").update(`${pin}:${JWT_SECRET}`).digest("hex");
const createVerificationChallenge = async (userId: string, channel: "EMAIL" | "PHONE", destination: string) => {
  const pin = String(crypto.randomInt(100000, 1000000));
  const challenge = await (prisma as any).verificationChallenge.create({ data: { userId, channel, destination, codeHash: hashPin(pin), expiresAt: new Date(Date.now() + 10 * 60 * 1000) } });
  // Never persist the raw PIN. Email delivery uses the configured SMTP sender.
  if (channel === "EMAIL" && resendConfigured) {
    const html = `<div style="font-family:Arial,sans-serif;max-width:520px"><h2>Verify your Wipe It Good Trading account</h2><p>Use this PIN to verify your Gmail address:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#4f46e5">${pin}</p><p>This PIN expires in 10 minutes. If you did not request this, you can ignore this email.</p></div>`;
    const from = process.env.EMAIL_FROM?.trim() || "Wipe It Good Trading <onboarding@resend.dev>";
    const resendResponse = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [destination], subject: "Your Wipe It Good Trading verification PIN", html }) });
    if (!resendResponse.ok) {
      const providerBody = (await resendResponse.text()).slice(0, 500);
      console.error("resend_email_failed", { status: resendResponse.status, body: providerBody, from });
      throw new Error(`Email API failed (${resendResponse.status}): ${providerBody || "Resend rejected the request."}`);
    }
  } else if (channel === "EMAIL" && mailTransport) {
    const message = { from: process.env.SMTP_FROM ?? process.env.SMTP_USER, to: destination, subject: "Your Wipe It Good Trading verification PIN", text: `Your verification PIN is ${pin}. It expires in 10 minutes.`, html: `<div style="font-family:Arial,sans-serif;max-width:520px"><h2>Verify your Wipe It Good Trading account</h2><p>Use this PIN to verify your Gmail address:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#4f46e5">${pin}</p><p>This PIN expires in 10 minutes. If you did not request this, you can ignore this email.</p></div>` };
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) { try { await mailTransport.sendMail(message); lastError = undefined; break; } catch (error) { lastError = error; if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 800)); } }
    if (lastError) throw lastError;
  } else {
    console.info(`[verification:${channel}] ${destination} PIN (SMTP not configured): ${pin}`);
  }
  return challenge;
};
const contactAttempts = new Map<string, number[]>();
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]!);
const deliverExpertInquiry = async (input: { name: string; email: string; phone?: string; subject: string; message: string }) => {
  const recipient = process.env.CONTACT_EMAIL?.trim() || "wipeitgoodtrading@gmail.com";
  const resendSender = process.env.EMAIL_FROM?.trim();
  const smtpSender = process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim();
  const safe = {
    name: escapeHtml(input.name),
    email: escapeHtml(input.email),
    phone: escapeHtml(input.phone || "Not provided"),
    subject: escapeHtml(input.subject),
    message: escapeHtml(input.message).replace(/\n/g, "<br />"),
  };
  const subject = `[Website inquiry] ${input.subject}`;
  const text = `New expert inquiry\n\nName: ${input.name}\nReply email: ${input.email}\nPhone: ${input.phone || "Not provided"}\nSubject: ${input.subject}\n\n${input.message}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;color:#17213b"><div style="padding:20px 24px;background:#1167dc;color:#fff"><h2 style="margin:0">New Ask an Expert inquiry</h2></div><div style="padding:24px;border:1px solid #dfe7f2;border-top:0"><p><strong>Name:</strong> ${safe.name}</p><p><strong>Reply email:</strong> <a href="mailto:${safe.email}">${safe.email}</a></p><p><strong>Phone:</strong> ${safe.phone}</p><p><strong>Subject:</strong> ${safe.subject}</p><div style="margin-top:20px;padding:16px;background:#f5f8fd;border-radius:8px;line-height:1.6">${safe.message}</div><p style="margin-top:20px;color:#6b7280;font-size:12px">Sent from the Wipe It Good Trading website.</p></div></div>`;
  let resendError: unknown;
  if (resendConfigured && resendSender) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: resendSender, to: [recipient], reply_to: input.email, subject, text, html }),
      });
      if (!response.ok) {
        const providerBody = (await response.text()).slice(0, 500);
        console.error("resend_contact_email_failed", { status: response.status, body: providerBody, from: resendSender });
        throw new Error(`Resend rejected the contact email (${response.status}).`);
      }
      return;
    } catch (error) {
      resendError = error;
      console.error("resend_contact_delivery_failed", error);
    }
  }
  if (mailTransport && smtpSender) {
    try {
      await mailTransport.sendMail({ from: smtpSender, to: recipient, replyTo: input.email, subject, text, html });
      return;
    } catch (smtpError) {
      console.error("smtp_contact_email_failed", smtpError);
      throw new Error(resendError ? "Both Resend and Gmail SMTP failed to deliver the message." : "Gmail SMTP failed to deliver the message.");
    }
  }
  if (resendConfigured && !resendSender) throw new Error("RESEND_API_KEY is configured but EMAIL_FROM is missing.");
  if (resendError) throw resendError;
  throw new Error("No contact email provider is configured.");
};

app.get("/api/auth/google/start", (_req, res) => {
  if (!googleClientId || !googleClientSecret) return res.status(503).json({ error: "Google OAuth is not configured on the server." });
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", googleClientId);
  url.searchParams.set("redirect_uri", googleRedirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "select_account");
  res.redirect(url.toString());
});

app.get("/api/auth/google/callback", async (req, res) => {
  try {
    if (!googleClientId || !googleClientSecret) return res.redirect(`${appOrigin}/login?google=not-configured`);
    const code = String(req.query.code ?? "");
    if (!code) return res.redirect(`${appOrigin}/login?google=cancelled`);
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: googleClientId, client_secret: googleClientSecret, redirect_uri: googleRedirectUri, grant_type: "authorization_code" }) });
    if (!tokenResponse.ok) throw new Error("Google token exchange failed.");
    const tokens: any = await tokenResponse.json();
    const profileResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokens.id_token)}`);
    if (!profileResponse.ok) throw new Error("Google identity validation failed.");
    const profile: any = await profileResponse.json();
    if (profile.aud !== googleClientId || profile.email_verified !== "true" || !String(profile.email).toLowerCase().endsWith("@gmail.com")) throw new Error("Google account is not verified or is not a Gmail account.");
    const email = String(profile.email).toLowerCase();
    let user: any = await prisma.user.findUnique({ where: { email }, include: { addresses: { orderBy: { isDefault: "desc" } } } });
    if (!user) user = await prisma.user.create({ data: { email, fullName: String(profile.name ?? profile.email.split("@")[0]), passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12), authProvider: "GOOGLE", verifiedAt: new Date(), emailVerifiedAt: new Date() } as any, include: { addresses: true } });
    else if (user.authProvider === "PASSWORD") user = await (prisma.user as any).update({ where: { id: user.id }, data: { authProvider: "GOOGLE", emailVerifiedAt: new Date(), verifiedAt: new Date() }, include: { addresses: true } });
    const token = issueToken(user);
    res.redirect(`${appOrigin}/login?google_token=${encodeURIComponent(token)}&set_password=1`);
  } catch (error) { console.error("google_oauth_failed", error); res.redirect(`${appOrigin}/login?google=failed`); }
});

// Payment webhooks must use the raw body for signature verification.
app.post("/api/webhooks/payments/:provider", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    if (String(req.params.provider).toLowerCase() !== gateway.provider) {
      return res.status(404).json({ error: "Unknown payment provider." });
    }
    const event = await gateway.verifyWebhook(
      req.body,
      req.header("paymongo-signature") ?? req.header("x-webhook-signature"),
    );
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (await tx.paymentEvent.findUnique({ where: { providerEventId: event.eventId } })) return;
      const payment = await tx.payment.findFirst({
        where: {
          provider: gateway.provider,
          OR: [
            ...(event.providerReference ? [{ providerReference: event.providerReference }] : []),
            ...(event.orderNumber ? [{ order: { orderNumber: event.orderNumber } }] : []),
          ],
        },
        include: { order: { include: { items: true } } },
      });
      await tx.paymentEvent.create({ data: { paymentId: payment?.id, provider: String(req.params.provider), providerEventId: event.eventId, eventType: event.type, payload: event.raw as any, processedAt: new Date() } });
      if (!payment) return;
      const paid = event.type === "payment.paid";
      if (paid && (event.amountCentavos !== payment.amountCentavos || event.currency !== "PHP")) {
        throw new Error("PayMongo payment amount or currency does not match the order.");
      }
      const nextPaymentStatus = paid ? "PAID" : event.type === "refund.paid" ? "REFUNDED" : event.type === "payment.failed" ? "FAILED" : "CANCELLED";
      await tx.payment.update({ where: { id: payment.id }, data: { status: nextPaymentStatus, paidAt: paid ? new Date() : undefined } });
      if (paid && payment.order.status === "PAYMENT_PENDING") {
        await tx.order.update({ where: { id: payment.orderId }, data: { status: "CONFIRMED" } });
        await tx.orderStatusEvent.create({ data: { orderId: payment.orderId, status: "CONFIRMED", note: "GCash payment confirmed by provider webhook" } });
      } else if ((event.type === "payment.failed" || event.type === "payment.expired") && payment.order.status === "PAYMENT_PENDING") {
        await tx.order.update({ where: { id: payment.orderId }, data: { status: "CANCELLED" } });
        await tx.orderStatusEvent.create({ data: { orderId: payment.orderId, status: "CANCELLED", note: event.type === "payment.expired" ? "GCash checkout expired" : "GCash payment failed" } });
        await releaseReservedStock(tx, payment.order, `gcash-${event.type}`);
      }
    });
    return res.sendStatus(204);
  } catch (error) { console.error("payment_webhook_failed", error); return res.status(400).json({ error: "Invalid payment webhook." }); }
});
app.use(express.json({ limit: "8mb" }));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.post("/api/contact/expert", auth, async (req: AuthRequest, res) => {
  try {
    const input = z.object({
      name: z.string().trim().min(2).max(80),
      email: z.string().trim().email().max(160),
      phone: z.string().trim().max(30).optional().or(z.literal("")),
      subject: z.string().trim().min(3).max(120),
      message: z.string().trim().min(10).max(2000),
      website: z.string().max(0).optional().default(""),
    }).parse(req.body);
    if (input.website) return res.sendStatus(204);
    const account = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { email: true } });
    if (!account) return res.status(401).json({ error: "Please sign in before asking an expert." });
    const key = req.user!.id;
    const now = Date.now();
    const recent = (contactAttempts.get(key) ?? []).filter((timestamp) => now - timestamp < 10 * 60 * 1000);
    if (recent.length >= 5) return res.status(429).json({ error: "Too many messages were sent. Please wait a few minutes and try again." });
    await deliverExpertInquiry({ ...input, email: account.email });
    recent.push(now);
    contactAttempts.set(key, recent);
    return res.status(202).json({ message: "Your message was sent to Wipe It Good Trading." });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(422).json({ error: "Please check the contact details and message.", details: error.issues });
    console.error("expert_inquiry_failed", error);
    const detail = error instanceof Error ? error.message : "";
    if (detail.includes("EMAIL_FROM is missing")) return res.status(503).json({ error: "Business email is not fully configured. Add EMAIL_FROM for your verified Resend domain, then restart the server.", code: "EMAIL_FROM_MISSING" });
    return res.status(503).json({ error: "The email provider could not deliver your message. Check the backend terminal for the Resend or SMTP error.", code: "CONTACT_DELIVERY_FAILED" });
  }
});

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const input = z.object({ fullName: z.string().min(2).optional().default("Customer"), email: z.string().email(), password: z.string().min(8), phone: z.string().min(7).optional().or(z.literal("")), address: z.string().min(10).optional().or(z.literal("")) }).parse(req.body);
    const email = input.email.trim().toLowerCase();
    if (!email.endsWith("@gmail.com")) return res.status(422).json({ error: "Please register with a Gmail address." });
    const existing: any = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (verificationRequired && existing.role === "CUSTOMER" && !existing.emailVerifiedAt) {
        await createVerificationChallenge(existing.id, "EMAIL", email);
        return res.status(200).json({ verificationRequired: true, userId: existing.id, channel: "EMAIL", message: "This Gmail has a pending verification. We sent a new PIN." });
      }
      return res.status(409).json({ error: "This Gmail account is already registered. Please sign in." });
    }
    const user = await prisma.user.create({ data: { fullName: input.fullName.trim(), email, passwordHash: await bcrypt.hash(input.password, 12), phone: input.phone || null, addresses: input.address ? { create: { recipientName: input.fullName, phone: input.phone || "", line1: input.address, isDefault: true } } : undefined }, include: { addresses: true } });
    if (verificationRequired) {
      try {
        await createVerificationChallenge(user.id, "EMAIL", email);
      } catch (deliveryError) {
        // Do not leave an unusable account behind when the provider rejects
        // the message. The user can correct their mail settings and retry.
        await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
        throw deliveryError;
      }
      return res.status(201).json({ verificationRequired: true, userId: user.id, channel: "EMAIL", message: "A verification PIN was sent to your Gmail." });
    }
    return res.status(201).json({ accessToken: issueToken(user), user: publicUser(user), addresses: user.addresses });
  } catch (error) { return next(error); }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const input = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
    const user: any = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() }, include: { addresses: { orderBy: { isDefault: "desc" } } } });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) return res.status(401).json({ error: "Invalid email or password." });
    if (verificationRequired && user.role === "CUSTOMER" && !user.emailVerifiedAt) return res.status(403).json({ error: "Verify your Gmail before signing in. Return to Sign Up with this Gmail to receive a new PIN.", verificationRequired: true, userId: user.id, channel: "EMAIL" });
    return res.json({ accessToken: issueToken(user), user: publicUser(user), addresses: user.addresses });
  } catch (error) { return next(error); }
});
app.post("/api/auth/verification/send", async (req, res, next) => { try { const input = z.object({ userId: z.string().uuid(), channel: z.enum(["EMAIL", "PHONE"]) }).parse(req.body); const user = await prisma.user.findUnique({ where: { id: input.userId } }); if (!user) return res.status(404).json({ error: "Account not found." }); const destination = input.channel === "EMAIL" ? user.email : user.phone ?? ""; if (!destination) return res.status(422).json({ error: "No destination is available for this verification." }); await createVerificationChallenge(user.id, input.channel, destination); res.json({ message: "A verification PIN was sent." }); } catch (error) { next(error); } });
app.post("/api/auth/verify", async (req, res, next) => { try { const input = z.object({ userId: z.string().uuid(), channel: z.enum(["EMAIL", "PHONE"]), code: z.string().regex(/^\d{6}$/) }).parse(req.body); const client = (prisma as any).verificationChallenge; const challenge = await client.findFirst({ where: { userId: input.userId, channel: input.channel, consumedAt: null }, orderBy: { createdAt: "desc" } }); if (!challenge || challenge.expiresAt < new Date()) return res.status(400).json({ error: "This PIN has expired. Request a new one." }); if (challenge.attempts >= 5) return res.status(429).json({ error: "Too many attempts. Request a new PIN." }); if (challenge.codeHash !== hashPin(input.code)) { await client.update({ where: { id: challenge.id }, data: { attempts: { increment: 1 } } }); return res.status(400).json({ error: "Incorrect verification PIN." }); } await client.update({ where: { id: challenge.id }, data: { consumedAt: new Date() } }); const user: any = await (prisma.user as any).update({ where: { id: input.userId }, data: input.channel === "EMAIL" ? { emailVerifiedAt: new Date(), verifiedAt: new Date() } : { phoneVerifiedAt: new Date() }, include: { addresses: true } }); res.json({ accessToken: issueToken(user), user: publicUser(user), addresses: user.addresses }); } catch (error) { next(error); } });

app.get("/api/auth/me", auth, async (req: AuthRequest, res, next) => { try { const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id }, include: { addresses: { orderBy: { isDefault: "desc" } } } }); res.json({ user: publicUser(user) }); } catch (error) { next(error); } });
app.patch("/api/auth/me", auth, async (req: AuthRequest, res, next) => {
  try {
    const input = z.object({ fullName: z.string().min(2), email: z.string().email(), phone: z.string().min(7), address: z.string().min(3), region: z.string().min(1).optional(), province: z.string().min(1).optional(), city: z.string().min(1).optional(), barangay: z.string().min(1).optional(), postalCode: z.string().optional(), profileImage: z.string().nullable().optional() }).parse(req.body);
    if (req.user!.role === "CUSTOMER" && !/^\+639\d{9}$/.test(input.phone)) return res.status(422).json({ error: "Enter a valid Philippine mobile number in +639XXXXXXXXX format." });
    if (req.user!.role === "CUSTOMER" && (!input.region || !input.province || !input.city || !input.barangay)) return res.status(422).json({ error: "Select a complete Philippine delivery address." });
    const duplicate = await prisma.user.findFirst({ where: { email: input.email.toLowerCase(), NOT: { id: req.user!.id } } });
    if (duplicate) return res.status(409).json({ error: "That email is already in use." });
    const image = input.profileImage === undefined ? undefined : imageRecord(input.profileImage ?? undefined, "Profile photo");
    await prisma.user.update({ where: { id: req.user!.id }, data: { fullName: input.fullName.trim(), email: input.email.toLowerCase(), phone: input.phone, ...(input.profileImage === undefined ? {} : image ? { profileImageData: image.data, profileImageMimeType: image.mimeType } : { profileImageData: null, profileImageMimeType: null }) } });
    const address = await prisma.address.findFirst({ where: { userId: req.user!.id, isDefault: true } });
    const location = { ...(input.region ? { region: input.region } : {}), ...(input.province ? { province: input.province } : {}), ...(input.city ? { city: input.city } : {}), ...(input.barangay ? { barangay: input.barangay } : {}), ...(input.postalCode ? { postalCode: input.postalCode } : {}) };
    if (address) await prisma.address.update({ where: { id: address.id }, data: { recipientName: input.fullName, phone: input.phone, line1: input.address, ...location } });
    else await prisma.address.create({ data: { userId: req.user!.id, recipientName: input.fullName, phone: input.phone, line1: input.address, ...location, isDefault: true } });
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
app.post("/api/auth/set-password", auth, async (req: AuthRequest, res, next) => { try { const input = z.object({ newPassword: z.string().min(8) }).parse(req.body); const user: any = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } }); if (user.authProvider !== "GOOGLE") return res.status(400).json({ error: "Use Change Password with your current password." }); await (prisma.user as any).update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(input.newPassword, 12), authProvider: "PASSWORD" } }); res.sendStatus(204); } catch (error) { next(error); } });

app.get("/api/products", async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({ where: { status: "ACTIVE", category: req.query.category ? { slug: String(req.query.category) } : undefined, name: req.query.q ? { contains: String(req.query.q), mode: "insensitive" } : undefined }, include: { category: true, images: { orderBy: { sortOrder: "asc" } } }, orderBy: { createdAt: "desc" }, take: 60 });
    res.json({ data: products.map(publicProduct) });
  } catch (error) { next(error); }
});

app.get("/api/addresses", auth, async (req: AuthRequest, res, next) => { try { res.json({ data: await prisma.address.findMany({ where: { userId: req.user!.id }, orderBy: { isDefault: "desc" } }) }); } catch (error) { next(error); } });
app.post("/api/addresses", auth, async (req: AuthRequest, res, next) => { try { const input = z.object({ label: z.string().min(1).optional(), recipientName: z.string().min(2), phone: z.string().min(7), line1: z.string().min(3), line2: z.string().optional(), region: z.string().default(""), barangay: z.string().default(""), city: z.string().default(""), province: z.string().default(""), postalCode: z.string().default(""), isDefault: z.boolean().optional() }).parse(req.body); const address = await prisma.address.create({ data: { ...input, userId: req.user!.id } }); res.status(201).json(address); } catch (error) { next(error); } });

app.get("/api/cart", auth, customerOnly, async (req: AuthRequest, res, next) => { try { const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id }, include: { items: { orderBy: { createdAt: "asc" }, include: { product: { include: { category: true, images: { orderBy: { sortOrder: "asc" } } } } } } } }); res.json({ items: cart?.items ?? [] }); } catch (error) { next(error); } });
app.post("/api/cart/items", auth, customerOnly, async (req: AuthRequest, res, next) => { try { const input = z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(99) }).parse(req.body); const product = await prisma.product.findFirst({ where: { id: input.productId, status: "ACTIVE" } }); if (!product) return res.status(404).json({ error: "Product unavailable." }); const cart = await prisma.cart.upsert({ where: { userId: req.user!.id }, create: { userId: req.user!.id }, update: {} }); const existing = await prisma.cartItem.findUnique({ where: { cartId_productId: { cartId: cart.id, productId: product.id } } }); const requestedQuantity = (existing?.quantity ?? 0) + input.quantity; const availableStock = Math.max(0, product.stockOnHand - product.stockReserved); if (requestedQuantity > availableStock) return res.status(409).json({ error: `Only ${availableStock} item${availableStock === 1 ? "" : "s"} currently available.` }); const item = await prisma.cartItem.upsert({ where: { cartId_productId: { cartId: cart.id, productId: product.id } }, create: { cartId: cart.id, productId: product.id, quantity: input.quantity }, update: { quantity: { increment: input.quantity } } }); res.status(201).json(item); } catch (error) { next(error); } });
app.patch("/api/cart/items/:id", auth, customerOnly, async (req: AuthRequest, res, next) => { try { const input = z.object({ quantity: z.number().int().min(1).max(99) }).parse(req.body); const item = await prisma.cartItem.findFirst({ where: { id: String(req.params.id), cart: { userId: req.user!.id } }, include: { product: true } }); if (!item) return res.status(404).json({ error: "Cart item not found." }); const availableStock = Math.max(0, item.product.stockOnHand - item.product.stockReserved); if (input.quantity > availableStock) return res.status(409).json({ error: `Only ${availableStock} item${availableStock === 1 ? "" : "s"} currently available.` }); res.json(await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: input.quantity } })); } catch (error) { next(error); } });
app.delete("/api/cart/items/:id", auth, customerOnly, async (req: AuthRequest, res, next) => { try { await prisma.cartItem.deleteMany({ where: { id: String(req.params.id), cart: { userId: req.user!.id } } }); res.sendStatus(204); } catch (error) { next(error); } });
app.delete("/api/cart/items", auth, customerOnly, async (req: AuthRequest, res, next) => { try { await prisma.cartItem.deleteMany({ where: { cart: { userId: req.user!.id } } }); res.sendStatus(204); } catch (error) { next(error); } });

app.post("/api/orders", auth, customerOnly, async (req: AuthRequest, res, next) => {
  try {
    const input = z.object({ addressId: z.string().uuid(), paymentMethod: z.enum(["COD", "GCash"]), itemIds: z.array(z.string().uuid()).min(1).optional() }).parse(req.body);
    if (input.paymentMethod === "GCash" && !gcashEnabled) {
      return res.status(409).json({ error: "GCash payment is temporarily unavailable. Please choose Cash on Delivery." });
    }
    const address = await prisma.address.findFirst({ where: { id: input.addressId, userId: req.user!.id } });
    const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id }, include: { items: { where: input.itemIds ? { id: { in: input.itemIds } } : undefined, include: { product: { include: { images: true } } } } } });
    if (!address || !cart?.items.length) return res.status(400).json({ error: "A delivery address and cart items are required." });
    const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let subtotal = 0;
      for (const item of cart.items) { const available = item.product.stockOnHand - item.product.stockReserved; if (available < item.quantity) throw new Error(`${item.product.name} is out of stock.`); subtotal += item.product.priceCentavos * item.quantity; }
      const shipping = subtotal >= 100000 ? 0 : 10000;
      const created = await tx.order.create({ data: { orderNumber: `WIG-${Date.now().toString(36).toUpperCase()}`, userId: req.user!.id, addressId: address.id, status: input.paymentMethod === "GCash" ? "PAYMENT_PENDING" : "PENDING", paymentMethod: input.paymentMethod === "GCash" ? "GCASH" : "COD", subtotalCentavos: subtotal, shippingCentavos: shipping, totalCentavos: subtotal + shipping, recipientName: address.recipientName, recipientPhone: address.phone, deliveryAddress: [address.line1, address.barangay, address.city, address.province, address.postalCode].filter(Boolean).join(", "), items: { create: cart.items.map((item: any) => ({ productId: item.productId, skuSnapshot: item.product.sku, nameSnapshot: item.product.name, unitPriceCentavos: item.product.priceCentavos, quantity: item.quantity, lineTotalCentavos: item.product.priceCentavos * item.quantity })) }, statusEvents: { create: { status: input.paymentMethod === "GCash" ? "PAYMENT_PENDING" : "PENDING", note: "Order placed" } } }, include: { items: true } });
      for (const item of cart.items) { await tx.product.update({ where: { id: item.productId }, data: { stockReserved: { increment: item.quantity } } }); await tx.inventoryMovement.create({ data: { productId: item.productId, orderId: created.id, quantity: item.quantity, reason: "RESERVATION" } }); }
      await tx.cartItem.deleteMany({ where: { cartId: cart.id, ...(input.itemIds ? { id: { in: input.itemIds } } : {}) } });
      return created;
    });
    if (input.paymentMethod === "GCash") {
      try {
        const customer = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
        const session = await gateway.createCheckout({
          orderId: order.id,
          orderNumber: order.orderNumber,
          amountCentavos: order.totalCentavos,
          customerName: address.recipientName,
          customerEmail: customer.email,
          customerPhone: address.phone,
          address: {
            line1: address.line1,
            line2: address.line2 ?? undefined,
            city: address.city,
            province: address.province,
            postalCode: address.postalCode,
          },
        });
        await prisma.payment.create({
          data: {
            orderId: order.id,
            method: "GCASH",
            amountCentavos: order.totalCentavos,
            provider: gateway.provider,
            providerReference: session.providerReference,
            checkoutUrl: session.checkoutUrl,
            expiresAt: session.expiresAt,
          },
        });
        return res.status(201).json({ order: publicOrder(order), checkoutUrl: session.checkoutUrl });
      } catch (checkoutError) {
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          const failedOrder = await tx.order.findUniqueOrThrow({ where: { id: order.id }, include: { items: true } });
          if (failedOrder.status === "PAYMENT_PENDING") {
            await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
            await tx.orderStatusEvent.create({ data: { orderId: order.id, status: "CANCELLED", note: "GCash checkout could not be created" } });
            await releaseReservedStock(tx, failedOrder, "gcash-checkout-creation-failed");
            for (const item of failedOrder.items) {
              await tx.cartItem.upsert({
                where: { cartId_productId: { cartId: cart.id, productId: item.productId } },
                create: { cartId: cart.id, productId: item.productId, quantity: item.quantity },
                update: { quantity: { increment: item.quantity } },
              });
            }
          }
        });
        throw checkoutError;
      }
    }
    await prisma.payment.create({ data: { orderId: order.id, method: "COD", amountCentavos: order.totalCentavos } });
    return res.status(201).json({ order: publicOrder(order) });
  } catch (error) { next(error); }
});
app.post("/api/orders/:id/cancel", auth, customerOnly, async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.order.findFirst({ where: { userId: req.user!.id, OR: [{ id: String(req.params.id) }, { orderNumber: String(req.params.id) }] }, include: { items: true, payments: true } });
    if (!existing) return res.status(404).json({ error: "Order not found." });
    if (existing.payments.some((payment) => payment.status === "PAID")) {
      return res.status(409).json({ error: "A paid GCash order cannot be cancelled automatically. Please contact the store for a verified refund." });
    }
    if (!["PAYMENT_PENDING", "PENDING", "CONFIRMED", "PACKED"].includes(existing.status)) return res.status(409).json({ error: "This order can no longer be cancelled." });
    const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.order.update({ where: { id: existing.id }, data: { status: "CANCELLED", statusEvents: { create: { status: "CANCELLED", note: "Cancelled by customer" } } }, include: { items: true } });
      await releaseReservedStock(tx, existing, "customer-cancellation");
      return updated;
    });
    return res.json({ data: publicOrder(order) });
  } catch (error) { next(error); }
});
app.get("/api/orders/:id/payment", auth, async (req: AuthRequest, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where: {
        userId: req.user!.id,
        OR: [{ id: String(req.params.id) }, { orderNumber: String(req.params.id) }],
      },
      include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    if (!order) return res.status(404).json({ error: "Order not found." });
    const payment = order.payments[0];
    return res.json({
      order: publicOrder(order),
      payment: payment ? {
        status: payment.status,
        method: payment.method,
        amount: payment.amountCentavos / 100,
        provider: payment.provider,
        checkoutUrl: payment.status === "PENDING" ? payment.checkoutUrl : null,
        expiresAt: payment.expiresAt,
        paidAt: payment.paidAt,
      } : null,
    });
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

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof z.ZodError) return res.status(422).json({ error: "Validation failed", details: error.issues });
  console.error(error);
  if (error instanceof Error && error.message.startsWith("Email API failed")) {
    return res.status(503).json({ error: "We could not send the verification PIN. Please try again after the email service is configured.", code: "EMAIL_DELIVERY_FAILED" });
  }
  return res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
});
const port = Number(process.env.PORT ?? 5000);
app.listen(port, () => console.log(`Wipe It Good API listening on :${port}`));
