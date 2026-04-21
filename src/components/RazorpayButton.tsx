import { useState } from "react";
import { useRazorpay } from "../hooks/useRazorpay";

const API_URL = (import.meta.env.VITE_API_URL as string) || "/api";

export type RazorpayPaymentResult =
  | { status: "success"; paymentId: string; orderId: string; signature: string }
  | { status: "failed"; reason: string }
  | { status: "dismissed" };

interface Props {
  /** Pre-created backend order (required) */
  backendOrder: {
    orderId: string;
    idempotencyKey: string;
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
    console.log("[RAZORPAY] 🔍 verifyPayment function called", {
      razorpay_order_id,
      razorpay_payment_id,
      hasSignature: !!razorpay_signature,
      idempotencyKey: backendOrder.idempotencyKey,
      hasAccessToken: !!backendOrder.orderAccessToken,
    });

    try {
      const url = `${API_URL}/orders/${backendOrder.idempotencyKey}/verify`;
      console.log("[RAZORPAY] 📡 Making verification request to:", url);
      console.log("[RAZORPAY] 📦 Request payload:", {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature: razorpay_signature.substring(0, 10) + "...",
      });

      const response = await fetch(url, {
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
      });

      console.log("[RAZORPAY] 📨 Response received", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      const data = await response.json();
      console.log("[RAZORPAY] 📄 Response data:", data);

      if (!response.ok) {
        console.error("[RAZORPAY] ❌ Verification failed", {
          status: response.status,
          error: data.message,
        });
        throw new Error(data.message || "Payment verification failed");
      }

      console.log("[RAZORPAY] ✅ Verification successful!");

      return {
        status: "success" as const,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        signature: razorpay_signature,
      };
    } catch (error) {
      console.error("[RAZORPAY] ❌ Verification error:", error);
      console.error("[RAZORPAY] Error details:", {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  };

  const openCheckout = (
    keyId: string,
    rzpOrderId: string,
    amountPaise: number,
  ) => {
    console.log("[RAZORPAY] Creating Razorpay options", {
      keyId,
      rzpOrderId,
      amountPaise,
    });

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
          console.log("[RAZORPAY] Modal dismissed by user");
          setOpening(false);
          onResult({ status: "dismissed" });
        },
      },
      handler: async (response: any) => {
        console.log("[RAZORPAY] ✅ Payment handler called", {
          hasPaymentId: !!response.razorpay_payment_id,
          hasOrderId: !!response.razorpay_order_id,
          hasSignature: !!response.razorpay_signature,
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
        });

        // Verify payment IMMEDIATELY - don't notify parent yet
        try {
          console.log("[RAZORPAY] 🔄 Starting verification...");
          
          const result = await verifyPayment(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature,
          );

          console.log("[RAZORPAY] ✅ Verification complete, notifying parent");
          setOpening(false);
          onResult(result);
        } catch (error) {
          console.error("[RAZORPAY] ❌ Verification failed", error);
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

    console.log("[RAZORPAY] Creating Razorpay instance");
    const rzp = new window.Razorpay(options);

    rzp.on("payment.failed", (response: { error: { description: string } }) => {
      console.error("[RAZORPAY] ❌ Payment failed event", response.error);
      setOpening(false);
      onResult({ status: "failed", reason: response.error.description });
    });

    console.log("[RAZORPAY] Opening Razorpay modal");
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
