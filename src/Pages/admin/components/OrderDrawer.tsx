// ── UI Agent: Order Detail Drawer — Premium Redesign ──

import { useEffect, useState } from "react";
import type { Order } from "../data/types";
import {
  formatCurrency,
  formatDateTime,
  formatOrderId,
  formatStatus,
  STATUS_COLORS,
} from "../data/types";
import { OrderActions } from "./OrderActions";

type Props = {
  order: Order | null;
  onClose: () => void;
  onMarkShipped: (orderId: string) => void;
};

const STATUS_STEPS = ["pending", "confirmed", "shipped", "delivered"] as const;

const STEP_COLORS: Record<string, { ring: string; fill: string; line: string }> = {
  pending:   { ring: "ring-amber-400",   fill: "bg-amber-400",   line: "bg-amber-300" },
  confirmed: { ring: "ring-blue-400",    fill: "bg-blue-400",    line: "bg-blue-300" },
  shipped:   { ring: "ring-violet-400",  fill: "bg-violet-400",  line: "bg-violet-300" },
  delivered: { ring: "ring-emerald-400", fill: "bg-emerald-400", line: "bg-emerald-300" },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function OrderDrawer({ order, onClose, onMarkShipped }: Props) {
  useEffect(() => {
    if (!order) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [order, onClose]);

  useEffect(() => {
    document.body.style.overflow = order ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [order]);

  if (!order) return null;

  const statusStyle = STATUS_COLORS[order.status];
  const isCod = order.paymentMethod?.toLowerCase() === "cod";
  const stepIndex = STATUS_STEPS.indexOf(order.status as typeof STATUS_STEPS[number]);
  const { date, time } = formatDateTime(order.date);
  const stepColor = STEP_COLORS[order.status] ?? STEP_COLORS.pending;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[3px] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className="relative flex flex-col w-full max-w-md bg-white shadow-2xl animate-[drawerIn_280ms_cubic-bezier(0.32,0.72,0,1)]"
        style={{ animationFillMode: "forwards" }}
      >

        {/* ── Header ── */}
        <div className="shrink-0 border-b border-slate-100">
          {/* Gradient accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />

          <div className="flex items-start justify-between px-5 py-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Order Details
              </p>
              <h2 className="mt-0.5 text-xl font-extrabold tracking-tight text-slate-900">
                {formatOrderId(order)}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">{date} · {time}</p>
            </div>

            <div className="flex items-center gap-2">
              {/* Status badge */}
              <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${statusStyle.bg} ${statusStyle.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                {formatStatus(order.status)}
              </div>

              {/* Close */}
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Status timeline */}
          <div className="flex items-center px-5 pb-4">
            {STATUS_STEPS.map((step, i) => {
              const done = i <= stepIndex;
              const current = i === stepIndex;
              const color = done ? STEP_COLORS[step] : null;
              return (
                <div key={step} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300 ${
                      done
                        ? `${color!.fill} ring-2 ${color!.ring} ring-offset-1`
                        : "bg-slate-200 ring-2 ring-slate-200 ring-offset-1"
                    } ${current ? "scale-110 shadow-sm" : ""}`}>
                      {done && (
                        <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`mt-1 text-[9px] font-bold uppercase tracking-wide ${done ? "text-slate-700" : "text-slate-400"}`}>
                      {step}
                    </span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-1 rounded-full transition-all duration-500 ${i < stepIndex ? stepColor.line : "bg-slate-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-5 px-5 py-5">

            {/* Customer card */}
            <section>
              <SectionLabel>Customer</SectionLabel>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex items-center gap-3 mb-3">
                  {/* Avatar */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-bold text-white shadow-sm">
                    {getInitials(order.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{order.name}</p>
                    <a
                      href={`tel:${order.phone}`}
                      className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                    >
                      {order.phone}
                    </a>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-3">
                  {order.email && (
                    <InfoRow icon="✉️" label="Email" value={order.email} />
                  )}
                  <InfoRow icon="📍" label="City" value={order.city} />
                  <InfoRow icon="🏠" label="Address" value={order.address} />
                </div>
              </div>

              <CopyAddressButton order={order} />
            </section>

            {/* Order summary */}
            <section>
              <SectionLabel>Order Summary</SectionLabel>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 space-y-2.5">
                <InfoRow icon="📦" label="Quantity" value={`${order.quantity} kit${order.quantity > 1 ? "s" : ""}`} />

                {/* Payment method badge */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <span>💳</span> Payment
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                    isCod
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}>
                    {isCod ? "Cash on Delivery" : "Prepaid Online"}
                  </span>
                </div>

                {/* Payment status */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <span>✅</span> Pay Status
                  </span>
                  <span className="text-xs font-semibold text-slate-700">
                    {formatStatus(order.paymentStatus || "Pending")}
                  </span>
                </div>

                {/* Coupon */}
                {order.couponCode && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <span>🏷️</span> Coupon
                    </span>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 border border-violet-200 px-2 py-0.5 text-[11px] font-bold text-violet-700">
                        {order.couponCode}
                      </span>
                      {order.couponCreatedBy && (
                        <p className="mt-0.5 text-[10px] text-slate-400">by {order.couponCreatedBy}</p>
                      )}
                    </div>
                  </div>
                )}

                {order.discountAmount > 0 && (
                  <InfoRow icon="💸" label="Discount" value={`-${formatCurrency(order.discountAmount)}`} />
                )}

                {/* Total — highlighted */}
                <div className="mt-1 flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5">
                  <span className="text-sm font-bold text-emerald-800">Total Amount</span>
                  <span className="text-lg font-extrabold text-emerald-700">
                    {formatCurrency(order.totalPrice)}
                  </span>
                </div>
              </div>
            </section>

            {/* Quick actions */}
            <section>
              <SectionLabel>Quick Actions</SectionLabel>
              <OrderActions order={order} onMarkShipped={onMarkShipped} />
            </section>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes drawerIn {
          from { transform: translateX(100%); opacity: 0.5; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Sub-components ──

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
      {children}
    </p>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 shrink-0">
        <span className="text-sm leading-none">{icon}</span> {label}
      </span>
      <span className="text-right text-xs font-semibold text-slate-800 leading-snug">{value}</span>
    </div>
  );
}

function CopyAddressButton({ order }: { order: Order }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = [
      `Order: ${formatOrderId(order)}`,
      `Name: ${order.name}`,
      `Phone: ${order.phone}`,
      `Address: ${order.address}`,
      `City: ${order.city}`,
      `Payment: ${order.paymentMethod?.toLowerCase() === "cod" ? "Cash on Delivery" : "Prepaid"}`,
      `Amount: ${formatCurrency(order.totalPrice)}`,
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`mt-2.5 w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 ${
        copied
          ? "bg-emerald-500 text-white shadow-sm"
          : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
      }`}
    >
      {copied ? (
        <>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Copied to clipboard!
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy Delivery Details
        </>
      )}
    </button>
  );
}
