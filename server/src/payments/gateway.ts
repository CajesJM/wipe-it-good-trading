import { createHmac, timingSafeEqual } from "node:crypto";

export type CheckoutRequest = {
  orderId: string;
  orderNumber: string;
  amountCentavos: number;
  customerName: string;
  customerEmail: string;
};

export type CheckoutSession = {
  providerReference: string;
  checkoutUrl: string;
  expiresAt: Date;
};

export type VerifiedPaymentEvent = {
  eventId: string;
  providerReference: string;
  type: "payment.paid" | "payment.failed" | "payment.expired" | "refund.paid";
  raw: unknown;
};

export interface PaymentGateway {
  createCheckout(request: CheckoutRequest): Promise<CheckoutSession>;
  verifyWebhook(rawBody: Buffer, signature: string | undefined): Promise<VerifiedPaymentEvent>;
  refund(providerReference: string, amountCentavos: number): Promise<void>;
}

/**
 * Development-only adapter. Replace with the merchant payment provider chosen
 * for GCash. Production adapters must verify the signature over the raw body.
 */
export class SandboxGateway implements PaymentGateway {
  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    return {
      providerReference: `sandbox_${request.orderId}`,
      checkoutUrl: `${process.env.PAYMENT_SUCCESS_URL}?order=${request.orderNumber}&sandbox=1`,
      expiresAt: new Date(Date.now() + 15 * 60_000),
    };
  }

  async verifyWebhook(rawBody: Buffer, signature: string | undefined): Promise<VerifiedPaymentEvent> {
    if (!signature || signature !== process.env.PAYMENT_WEBHOOK_SECRET) throw new Error("Invalid webhook signature");
    return JSON.parse(rawBody.toString("utf8")) as VerifiedPaymentEvent;
  }

  async refund(): Promise<void> {}
}

/**
 * Provider adapter contract for a live GCash-capable payment service. The
 * provider endpoint must return { providerReference, checkoutUrl, expiresAt }
 * and accept the server-to-server API key. This keeps GCash credentials out of
 * the browser and makes the redirect a provider-hosted payment page/app link.
 */
export class ConfiguredGateway implements PaymentGateway {
  private readonly endpoint = process.env.PAYMENT_CREATE_URL;
  private readonly apiKey = process.env.PAYMENT_API_KEY;

  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    if (!this.endpoint || !this.apiKey) return new SandboxGateway().createCheckout(request);
    const response = await fetch(this.endpoint, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` }, body: JSON.stringify({ amount: request.amountCentavos, currency: "PHP", reference: request.orderNumber, customer: { name: request.customerName, email: request.customerEmail }, payment_method_types: ["gcash"], success_url: process.env.PAYMENT_SUCCESS_URL, cancel_url: process.env.PAYMENT_CANCEL_URL }) });
    if (!response.ok) throw new Error(`Payment provider rejected checkout (${response.status})`);
    const data = await response.json() as CheckoutSession;
    return { providerReference: data.providerReference, checkoutUrl: data.checkoutUrl, expiresAt: new Date(data.expiresAt) };
  }

  async verifyWebhook(rawBody: Buffer, signature: string | undefined): Promise<VerifiedPaymentEvent> {
    if (!signature || !process.env.PAYMENT_WEBHOOK_SECRET) throw new Error("Missing webhook signature");
    const expected = createHmac("sha256", process.env.PAYMENT_WEBHOOK_SECRET).update(rawBody).digest("hex");
    if (expected.length !== signature.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) throw new Error("Invalid webhook signature");
    return JSON.parse(rawBody.toString("utf8")) as VerifiedPaymentEvent;
  }

  async refund(providerReference: string, amountCentavos: number): Promise<void> {
    if (!this.endpoint || !this.apiKey) throw new Error("Live payment provider is not configured");
    await fetch(`${this.endpoint}/${providerReference}/refunds`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` }, body: JSON.stringify({ amount: amountCentavos }) });
  }
}
