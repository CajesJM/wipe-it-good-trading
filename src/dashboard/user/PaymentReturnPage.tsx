import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock3, LoaderCircle, RotateCw, ShieldCheck, XCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import * as api from "../../api";
import "@/styles/user_css/paymentReturn.css";

type PaymentResult = {
  order: { orderNumber: string; total: number; status: string };
  payment: {
    status: "PENDING" | "AUTHORIZED" | "PAID" | "FAILED" | "CANCELLED" | "REFUND_PENDING" | "REFUNDED";
    amount: number;
    checkoutUrl?: string | null;
    paidAt?: string | null;
  } | null;
};

const PaymentReturnPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get("order") ?? "";
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const checkPayment = useCallback(async () => {
    if (!orderNumber) {
      setError("The payment return link is missing an order number.");
      setLoading(false);
      return;
    }
    try {
      setError("");
      const response = await api.fetchOrderPayment(orderNumber);
      setResult(response.data);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error ?? "We could not check this payment yet.");
    } finally {
      setLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    void checkPayment();
    const timer = window.setInterval(() => {
      if (result?.payment?.status !== "PAID") void checkPayment();
    }, 2500);
    return () => window.clearInterval(timer);
  }, [checkPayment, result?.payment?.status]);

  const status = result?.payment?.status;
  const paid = status === "PAID";
  const failed = status === "FAILED" || status === "CANCELLED";

  return (
    <main className="payment-return-page">
      <section className={`payment-result-card ${paid ? "is-paid" : failed ? "is-failed" : "is-pending"}`}>
        <div className="payment-result-icon" aria-hidden="true">
          {loading ? <LoaderCircle className="spin" /> : paid ? <CheckCircle2 /> : failed ? <XCircle /> : <Clock3 />}
        </div>
        <span className="payment-result-eyebrow"><ShieldCheck /> Secure GCash checkout</span>
        <h1>{loading ? "Confirming your payment" : paid ? "Payment confirmed" : failed ? "Payment was not completed" : "Payment confirmation pending"}</h1>
        <p>
          {loading
            ? "Please keep this page open while we check PayMongo."
            : paid
              ? "Your GCash payment was verified. The seller can now prepare your order."
              : failed
                ? "No successful charge was recorded. You can return to your cart and try again."
                : "GCash may still be sending the confirmation. This page checks again automatically."}
        </p>

        {result && (
          <dl className="payment-result-details">
            <div><dt>Order</dt><dd>{result.order.orderNumber}</dd></div>
            <div><dt>Amount</dt><dd>₱{(result.payment?.amount ?? result.order.total).toFixed(2)}</dd></div>
            <div><dt>Payment</dt><dd>{status?.replace(/_/g, " ") ?? "Pending"}</dd></div>
          </dl>
        )}
        {error && <div className="payment-result-error" role="alert">{error}</div>}

        <div className="payment-result-actions">
          {!paid && !failed && !loading && (
            <button type="button" onClick={() => { setLoading(true); void checkPayment(); }}>
              <RotateCw /> Check again
            </button>
          )}
          {failed && result?.payment?.checkoutUrl && <a href={result.payment.checkoutUrl}>Try GCash again</a>}
          <Link to="/orders">{paid ? "View my order" : "Go to my orders"}</Link>
          {failed && <Link to="/cart" className="secondary">Return to cart</Link>}
        </div>
        <small>Order status changes only after the signed payment notification is verified by the server.</small>
      </section>
    </main>
  );
};

export default PaymentReturnPage;
