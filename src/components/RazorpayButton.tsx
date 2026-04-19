import { useState } from "react";
import { useRazorpay } from "../hooks/useRazorpay";

const API_URL = (import.meta.env.VITE_API_URL as string) || "/api";

export type RazorpayPaymentResult =
  | { status: "success"; paymentId: string; orderId: string; signature: string }
  | { status: "failed"; reason: string }
  | { status: "dismissed" };

interface Props {
  /** Amount in ₹ (used for display only — actual amount comes from backend) */
  amount: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  description?: string;
  /**
   * If provided, the button uses this pre-created backend order
   * (orderId, razorpayKeyId, razorpayOrderId, amount, currency).
   * If not provided, the button creates the order via POST /api/orders.
   */
  backendOrder?: {
    orderId: string;
    razorpayKeyId: string;
    razorpayOrderId: string;
    amount: number;
    currency: string;
  };
  /** Used when backendOrder is NOT provided — creates order on the fly */
  orderPayload?: Record<string, unknown>;
  onResult: (result: RazorpayPaymentResult) => void;
  className?: string;
  children?: React.ReactNode;
}

export function RazorpayButton({
  amount,
  customerName,
  customerPhone,
  customerEmail,
  description = "VedaGlow 28-Day Kit",
  backendOrder,
  orderPayload,
  onResult,
  className,
  children,
}: Props) {
  const scriptStatus = useRazorpay();
  const [opening, setOpening] = useState(false);

  const openCheckout = (
    keyId: string,
    rzpOrderId: string,
    amountPaise: number,
    orderId: string,
  ) => {
    const options: RazorpayOptions = {
      key: keyId,
      amount: amountPaise,
      currency: "INR",
      name: "VedaGlow",
      description,
      order_id: rzpOrderId,
      prefill: {
        name: customerName,
        contact: customerPhone,
        ...(customerEmail ? { email: customerEmail } : {}),
      },
      theme: { color: "#0f766e" },
      modal: {
        escape: false,
        ondismiss: () => {
          setOpening(false);
          onResult({ status: "dismissed" });
        },
      },
      handler: async (response: any) => {
        // Verify payment on backend
        try {
          const verifyRes = await fetch(`${API_URL}/orders/${orderId}/verify-payment`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          
          await verifyRes.json();
        } catch (err) {
          console.error("[RazorpayButton] Payment verification failed:", err);
          // Webhook will handle it if verify-payment fails
        }

        setOpening(false);
        onResult({
          status: "success",
          paymentId: response.razorpay_payment_id as string,
          orderId: response.razorpay_order_id as string,
          signature: response.razorpay_signature as string,
        });
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on("payment.failed", (response: { error: { description: string } }) => {
      setOpening(false);
      onResult({ status: "failed", reason: response.error.description });
    });

    rzp.open();
  };

  const handlePayment = async () => {
    if (scriptStatus !== "ready" || opening) return;
    setOpening(true);

    // ============================================================================
    // FIX: Always use backendOrder (never create order on the fly)
    // ============================================================================
    // PROBLEM: Creating order on the fly can cause race conditions
    // SOLUTION: Always create order in parent component first, then pass backendOrder
    if (backendOrder) {
      openCheckout(
        backendOrder.razorpayKeyId,
        backendOrder.razorpayOrderId,
        backendOrder.amount * 100, // Convert rupees to paise
        backendOrder.orderId,
      );
      return;
    }

    // Fallback: create order on the fly (not recommended)
    if (!orderPayload) {
      setOpening(false);
      onResult({ status: "failed", reason: "No order data provided." });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        setOpening(false);
        onResult({
          status: "failed",
          reason: data?.message || "Failed to create order.",
        });
        return;
      }

      const rzp = data.razorpay;
      if (!rzp?.orderId || !rzp?.keyId) {
        setOpening(false);
        onResult({
          status: "failed",
          reason: "Backend did not return Razorpay order.",
        });
        return;
      }

      openCheckout(rzp.keyId, rzp.orderId, rzp.amount * 100, data.order.id);
    } catch (err) {
      setOpening(false);
      onResult({
        status: "failed",
        reason: err instanceof Error ? err.message : "Network error.",
      });
    }
  };

  const isLoading = scriptStatus === "loading" || opening;
  const isDisabled = scriptStatus === "error" || isLoading;

  return (
    <button
      type="button"
      onClick={handlePayment}
      disabled={isDisabled}
      className={className}
    >
      {scriptStatus === "error"
        ? "Payment unavailable"
        : isLoading
          ? "Opening payment..."
          : (children ?? `Pay ₹${amount}`)}
    </button>
  );
}
