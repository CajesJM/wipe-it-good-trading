import { createHmac, timingSafeEqual } from "node:crypto";

export type CheckoutRequest = {
  orderId: string;
  orderNumber: string;
  amountCentavos: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    province: string;
    postalCode?: string;
  };
};

export type CheckoutSession = {
  providerReference: string;
  checkoutUrl: string;
  expiresAt: Date | null;
};

export type VerifiedPaymentEvent = {
  eventId: string;
  providerReference?: string;
  orderNumber?: string;
  type: "payment.paid" | "payment.failed" | "payment.expired" | "refund.paid";
  amountCentavos?: number;
  currency?: string;
  raw: unknown;
};

export interface PaymentGateway {
  readonly provider: string;
  createCheckout(request: CheckoutRequest): Promise<CheckoutSession>;
  verifyWebhook(rawBody: Buffer, signature: string | undefined): Promise<VerifiedPaymentEvent>;
  refund(providerReference: string, amountCentavos: number): Promise<void>;
}

const addOrderToUrl = (baseUrl: string, orderNumber: string) => {
  const url = new URL(baseUrl);
  url.searchParams.set("order", orderNumber);
  return url.toString();
};

export class SandboxGateway implements PaymentGateway {
  readonly provider = "sandbox";

  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    const successUrl = process.env.PAYMENT_SUCCESS_URL
      ?? `${process.env.APP_ORIGIN?.split(",")[0] ?? "http://localhost:5173"}/payment/return`;
    return {
      providerReference: `sandbox_${request.orderId}`,
      checkoutUrl: addOrderToUrl(successUrl, request.orderNumber),
      expiresAt: new Date(Date.now() + 15 * 60_000),
    };
  }

  async verifyWebhook(rawBody: Buffer, signature: string | undefined): Promise<VerifiedPaymentEvent> {
    if (!signature || signature !== process.env.PAYMENT_WEBHOOK_SECRET) throw new Error("Invalid sandbox webhook signature");
    return JSON.parse(rawBody.toString("utf8")) as VerifiedPaymentEvent;
  }

  async refund(): Promise<void> {}
}

type PayMongoResource = {
  id?: string;
  attributes?: {
    amount?: number;
    currency?: string;
    reference_number?: string;
    metadata?: Record<string, string>;
    external_reference_number?: string;
    payments?: Array<{ attributes?: { amount?: number; currency?: string; status?: string } }>;
  };
};

type PayMongoEvent = {
  event_type?: string;
  data?: {
    id?: string;
    type?: string;
    livemode?: boolean;
    data?: PayMongoResource;
    attributes?: {
      type?: string;
      livemode?: boolean;
      data?: PayMongoResource;
    };
  };
};

export class PayMongoGateway implements PaymentGateway {
  readonly provider = "paymongo";
  private readonly endpoint = process.env.PAYMONGO_API_URL?.replace(/\/$/, "")
    ?? "https://api.paymongo.com/v2";
  private readonly secretKey = process.env.PAYMONGO_SECRET_KEY?.trim();
  private readonly webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET?.trim();

  private authorization() {
    if (!this.secretKey) throw new Error("PAYMONGO_SECRET_KEY is not configured.");
    return `Basic ${Buffer.from(`${this.secretKey}:`).toString("base64")}`;
  }

  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    const appOrigin = (process.env.APP_ORIGIN?.split(",")[0] ?? "http://localhost:5173").replace(/\/$/, "");
    const successUrl = addOrderToUrl(process.env.PAYMENT_SUCCESS_URL ?? `${appOrigin}/payment/return`, request.orderNumber);
    const cancelUrl = addOrderToUrl(process.env.PAYMENT_CANCEL_URL ?? `${appOrigin}/cart`, request.orderNumber);
    const billingAddress = request.address ? {
      line1: request.address.line1,
      line2: request.address.line2 || undefined,
      city: request.address.city,
      state: request.address.province,
      postal_code: request.address.postalCode || undefined,
      country: "PH",
    } : undefined;

    const response = await fetch(`${this.endpoint}/checkout_sessions`, {
      method: "POST",
      headers: {
        authorization: this.authorization(),
        "content-type": "application/json",
        "idempotency-key": `gcash-checkout-${request.orderId}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            billing: {
              name: request.customerName,
              email: request.customerEmail,
              phone: request.customerPhone,
              address: billingAddress,
            },
            line_items: [{
              name: `Wipe It Good order ${request.orderNumber}`,
              description: "Tools and equipment purchase",
              amount: request.amountCentavos,
              currency: "PHP",
              quantity: 1,
            }],
            payment_method_types: ["gcash"],
            description: `Order ${request.orderNumber}`,
            reference_number: request.orderNumber,
            metadata: { order_id: request.orderId, order_number: request.orderNumber },
            success_url: successUrl,
            cancel_url: cancelUrl,
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
          },
        },
      }),
    });

    const body = await response.json().catch(() => null) as any;
    if (!response.ok) {
      const detail = body?.errors?.[0]?.detail ?? body?.errors?.[0]?.code ?? `HTTP ${response.status}`;
      throw new Error(`PayMongo rejected the checkout request: ${detail}`);
    }
    const providerReference = body?.data?.id;
    const checkoutUrl = body?.data?.attributes?.checkout_url;
    if (!providerReference || !checkoutUrl) throw new Error("PayMongo returned an incomplete checkout session.");
    return { providerReference, checkoutUrl, expiresAt: null };
  }

  async verifyWebhook(rawBody: Buffer, signatureHeader: string | undefined): Promise<VerifiedPaymentEvent> {
    if (!signatureHeader || !this.webhookSecret) throw new Error("PayMongo webhook signature is missing or not configured.");
    const parts = Object.fromEntries(signatureHeader.split(",").map((part) => {
      const [key, ...value] = part.trim().split("=");
      return [key, value.join("=")];
    }));
    const timestamp = parts.t;
    if (!timestamp) throw new Error("PayMongo webhook timestamp is missing.");

    const toleranceSeconds = Number(process.env.PAYMONGO_WEBHOOK_TOLERANCE_SECONDS ?? 300);
    if (toleranceSeconds > 0 && Math.abs(Date.now() / 1000 - Number(timestamp)) > toleranceSeconds) {
      throw new Error("PayMongo webhook timestamp is outside the allowed window.");
    }
    const expected = createHmac("sha256", this.webhookSecret)
      .update(`${timestamp}.${rawBody.toString("utf8")}`)
      .digest("hex");
    const supplied = this.secretKey?.startsWith("sk_live_") ? parts.li : parts.te;
    if (!supplied || supplied.length !== expected.length
      || !timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))) {
      throw new Error("Invalid PayMongo webhook signature.");
    }

    const event = JSON.parse(rawBody.toString("utf8")) as PayMongoEvent;
    const providerType = event.data?.attributes?.type ?? event.data?.type;
    const resource = event.data?.attributes?.data ?? event.data?.data;
    const eventId = event.data?.id
      ?? `evt_body_${createHmac("sha256", this.webhookSecret).update(rawBody).digest("hex")}`;
    if (!providerType || !resource) throw new Error("Invalid PayMongo webhook payload.");

    const eventTypes: Record<string, VerifiedPaymentEvent["type"]> = {
      "checkout_session.payment.paid": "payment.paid",
      "payment.paid": "payment.paid",
      "payment.failed": "payment.failed",
      "payment.refunded": "refund.paid",
      "refund.succeeded": "refund.paid",
      "qrph.expired": "payment.expired",
      "qr.expired": "payment.expired",
    };
    const type = eventTypes[providerType];
    if (!type) throw new Error(`Unsupported PayMongo event: ${providerType}`);
    const payments = resource.attributes?.payments ?? [];
    const payment = (payments.find((candidate) => candidate.attributes?.status === "paid")
      ?? payments.at(-1))?.attributes;
    return {
      eventId,
      providerReference: resource.id,
      orderNumber: resource.attributes?.reference_number
        ?? resource.attributes?.metadata?.order_number
        ?? resource.attributes?.external_reference_number,
      type,
      amountCentavos: payment?.amount ?? resource.attributes?.amount,
      currency: payment?.currency ?? resource.attributes?.currency,
      raw: event,
    };
  }

  async refund(): Promise<void> {
    throw new Error("Refund creation is not enabled in this checkout integration.");
  }
}

export const createPaymentGateway = (): PaymentGateway => {
  const provider = (process.env.PAYMENT_PROVIDER ?? "sandbox").toLowerCase();
  if (provider === "paymongo") return new PayMongoGateway();
  if (provider === "sandbox") return new SandboxGateway();
  throw new Error(`Unsupported PAYMENT_PROVIDER: ${provider}`);
};
