import { useEffect, useState } from "react";

const WHATSAPP_NUMBER = "919058964964";

type Props = {
  name: string;
  orderId: string;
  orderNumber: number | null;
  amount: number;
  paymentMethod: "cod" | "razorpay";
  remainingOnDelivery?: number;
  onGoHome: () => void;
};

export function OrderSuccess({ name, orderId, orderNumber, amount, paymentMethod, remainingOnDelivery = 0, onGoHome }: Props) {
  const [visible, setVisible] = useState(false);
  const isCod = paymentMethod === "cod";

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Use sequential orderNumber if available, fall back to last 8 chars of MongoDB _id
  const displayId = orderNumber != null
    ? String(orderNumber).padStart(4, "0")
    : orderId.slice(-8).toUpperCase();

  const trackMessage = encodeURIComponent(
    `Hi, I want to check my order status.\nOrder ID: #${displayId}\nName: ${name}`
  );
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${trackMessage}`;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center px-4 py-12"
    >
      <div
        className={`w-full max-w-md transition-all duration-500 ${
          visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        {/* Card */}
        <div className="rounded-3xl bg-white shadow-xl shadow-emerald-100 border border-emerald-100 overflow-hidden">

          {/* Top accent */}
          <div className="h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />

          <div className="px-6 py-8 sm:px-8">
            {/* Success icon */}
            <div className="flex justify-center mb-5">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                <svg className="h-10 w-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {/* Pulse ring */}
                <span className="absolute inset-0 rounded-full bg-emerald-200 animate-ping opacity-30" />
              </div>
            </div>

            {/* Heading */}
            <h1 className="text-center text-2xl font-extrabold text-slate-900 leading-tight">
              🎉 Order Placed Successfully!
            </h1>

            {/* Brand message */}
            <p className="mt-3 text-center text-sm text-slate-600 leading-relaxed">
              Thank you, <span className="font-semibold text-emerald-700">{name}</span>! 💚
              <br />
              Your order has been placed. We're preparing your VedaGlow kit with care and love.
            </p>

            {/* Divider */}
            <div className="my-5 border-t border-dashed border-slate-200" />

            {/* Order details */}
            <div className="space-y-3">
              <DetailRow label="Order ID" value={`#${displayId}`} mono />
              <DetailRow label="Amount" value={`₹${amount}`} highlight />
              <DetailRow
                label="Payment"
                value={isCod ? "Pay on Delivery 🚚" : "Payment Successful ✅"}
                highlight={!isCod}
              />
              {isCod && remainingOnDelivery > 0 && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-center">
                  <p className="text-sm font-bold text-amber-800">
                    Collect ₹{remainingOnDelivery} on delivery
                  </p>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="my-5 border-t border-dashed border-slate-200" />

            {/* Info pills */}
            <div className="space-y-2">
              <InfoPill icon="📦" text="You will receive order updates soon" />
              <InfoPill icon="📞" text="Our team will contact you if needed" />
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-3">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-200 transition-all hover:bg-emerald-700 hover:-translate-y-0.5 active:translate-y-0"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Track Order on WhatsApp
              </a>

              <button
                type="button"
                onClick={onGoHome}
                className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:-translate-y-0.5 active:translate-y-0"
              >
                ← Go to Home
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 text-center">
            <p className="text-xs text-slate-500">
              Thank you for choosing <span className="font-bold text-emerald-700">VedaGlow</span> 🌿
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, highlight = false, mono = false }: {
  label: string; value: string; highlight?: boolean; mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? "text-emerald-700" : "text-slate-800"} ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function InfoPill({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
      <span className="text-base">{icon}</span>
      <span className="text-xs text-slate-600">{text}</span>
    </div>
  );
}
