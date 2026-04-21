import { useState } from "react";
import { useRazorpay } from "../hooks/useRazorpay";

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
        setOpening(false);
        onResult({
          status: "processing",
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
