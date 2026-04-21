import { useState } from "react";
import { useRazorpay } from "../hooks/useRazorpay";

const API_URL = (import.meta.env.VITE_API_URL as string) || "/api";

export type RazorpayPaymentResult =
  | { status: "success"; paymentId: string; orderId: string; signature: string }
  | { status: "failed"; reason: string }
  | { status: "dismissed" }
  | {
      status: "processing";
      paymentId: string;
      orderId: string;
      signature: string;
    };

interface Props {
  /** Pre-created backend order (required) */
  backendOrder: {
    orderId: string;
    orderAccessToken: string;
    razorpayKeyId: string;
    razorpayOrderId: string;
    amount: number;
    currency: string;
  };
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  description?: string;
  onResult: (result: RazorpayPaymentResult) => void;
  className?: string;
  children?: React.ReactNode;
}

export function RazorpayButton({
  customerName,
  customerPhone,
  customerEmail,
  description = "VedaGlow 28-Day Kit",
  backendOrder,
  onResult,
  className,
  children,
}: Props) {
  const scriptStatus = useRazorpay();
  const [opening, setOpening] = useState(false);

  const verifyPayment = async (
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string,
  ) => {
    try {
      console.log("[RAZORPAY] Verifying payment", {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });

      // Extract idempotencyKey from backendOrder.orderId
      // The orderId is the MongoDB _id, but we need the idempotencyKey
      // We'll use the razorpay_order_id to find the order
      const response = await fetch(
        `${API_URL}/orders/${backendOrder.orderId}/verify`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Order-Access-Token": backendOrder.orderAccessToken,
          },
          body: JSON.stringify({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("[RAZORPAY] Verification failed", {
          status: response.status,
          error: data.message,
        });
        throw new Error(data.message || "Payment verification failed");
      }

      console.log("[RAZORPAY] Verification successful", data);

      return {
        status: "success" as const,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        signature: razorpay_signature,
      };
    } catch (error) {
      console.error("[RAZORPAY] Verification error", error);
      throw error;
    }
  };

  const openCheckout = (
    keyId: string,
    rzpOrderId: string,
    amountPaise: number,
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
        console.log("[RAZORPAY] Payment handler called", {
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
        });

        // First, notify parent that payment is processing
        onResult({
          status: "processing",
          paymentId: response.razorpay_payment_id as string,
          orderId: response.razorpay_order_id as string,
          signature: response.razorpay_signature as string,
        });

        // Then verify payment with backend
        try {
          const result = await verifyPayment(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature,
          );

          setOpening(false);
          onResult(result);
        } catch (error) {
          setOpening(false);
          onResult({
            status: "failed",
            reason:
              error instanceof Error
                ? error.message
                : "Payment verification failed",
          });
        }
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on("payment.failed", (response: { error: { description: string } }) => {
      console.error("[RAZORPAY] Payment failed", response.error);
      setOpening(false);
      onResult({ status: "failed", reason: response.error.description });
    });

    rzp.open();
  };

  const handlePayment = async () => {
    if (scriptStatus !== "ready" || opening) return;
    
    console.log("[RAZORPAY] Opening checkout", {
      keyId: backendOrder.razorpayKeyId,
      orderId: backendOrder.razorpayOrderId,
      amount: backendOrder.amount,
    });

    setOpening(true);

    openCheckout(
      backendOrder.razorpayKeyId,
      backendOrder.razorpayOrderId,
      backendOrder.amount * 100, // Convert rupees to paise
    );
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
          : children}
    </button>
  );
}
