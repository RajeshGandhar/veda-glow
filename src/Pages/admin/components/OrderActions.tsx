// ── UI Agent + UX Agent: Order Action Buttons ──
// One-click actions: Call, WhatsApp, Mark Shipped, Print Slip

import type { Order } from "../data/types";
import { formatCurrency, formatDateTime, formatOrderId } from "../data/types";

type Props = {
  order: Order;
  onMarkShipped: (orderId: string) => void;
  compact?: boolean;
};

function handlePrint(order: Order) {
  const isCod = order.paymentMethod?.toLowerCase() === "cod";
  const { date, time } = formatDateTime(order.date);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Delivery Slip – ${formatOrderId(order)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #000; background: #fff; padding: 20px; max-width: 400px; margin: auto; }
    .brand { text-align: center; font-size: 22px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 2px; }
    .tagline { text-align: center; font-size: 10px; color: #555; margin-bottom: 12px; }
    hr { border: none; border-top: 1px dashed #000; margin: 10px 0; }
    hr.thick { border-top: 2px solid #000; }
    .order-id { text-align: center; font-size: 15px; font-weight: 700; margin: 8px 0 4px; }
    .datetime { text-align: center; font-size: 11px; color: #444; margin-bottom: 10px; }
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #555; margin: 10px 0 6px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
    .row .label { color: #555; font-size: 12px; }
    .row .value { font-weight: 600; font-size: 12px; text-align: right; max-width: 60%; }
    .phone { font-size: 16px; font-weight: 900; text-align: center; margin: 8px 0; letter-spacing: 1px; }
    .address-block { font-size: 12px; line-height: 1.6; margin: 4px 0 8px; }
    .payment-cod { background: #000; color: #fff; text-align: center; font-size: 16px; font-weight: 900; padding: 10px; margin: 12px 0; letter-spacing: 1px; }
    .payment-paid { text-align: center; font-size: 16px; font-weight: 900; padding: 10px; margin: 12px 0; border: 2px solid #000; }
    .footer { text-align: center; font-size: 10px; color: #666; margin-top: 14px; }
    @media print {
      body { padding: 10px; }
      @page { margin: 8mm; size: A4; }
    }
  </style>
</head>
<body>
  <div class="brand">VedaGlow</div>
  <div class="tagline">28-Day Ayurvedic Skincare Kit</div>
  <hr class="thick" />

  <div class="order-id">${formatOrderId(order)}</div>
  <div class="datetime">${date} &nbsp;|&nbsp; ${time}</div>

  <hr />

  <div class="section-title">Customer</div>
  <div class="row"><span class="label">Name</span><span class="value">${order.name}</span></div>
  <div class="phone">📞 ${order.phone}</div>

  <hr />

  <div class="section-title">Delivery Address</div>
  <div class="address-block">${order.address}, ${order.city}</div>

  <hr />

  <div class="section-title">Order Summary</div>
  <div class="row"><span class="label">Product</span><span class="value">VedaGlow 28-Day Kit</span></div>
  <div class="row"><span class="label">Quantity</span><span class="value">${order.quantity}</span></div>
  <div class="row"><span class="label">Total</span><span class="value">${formatCurrency(order.totalPrice)}</span></div>

  <hr />

  ${isCod
    ? `<div class="payment-cod">💰 COLLECT ₹${order.totalPrice}</div>`
    : `<div class="payment-paid">✅ PAID</div>`
  }

  <hr class="thick" />
  <div class="footer">Thank you for choosing VedaGlow 🌿<br/>vedaglows.com</div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=480,height=700");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
  win.close();
}

export function OrderActions({ order, onMarkShipped, compact = false }: Props) {
  const phoneClean = order.phone.replace(/\D/g, "");
  const phoneWithCountry = phoneClean.startsWith("91") ? phoneClean : `91${phoneClean}`;

  const handleCall = () => {
    window.open(`tel:+${phoneWithCountry}`, "_self");
  };

  const handleWhatsApp = () => {
    let message = "";

    switch (order.status) {
      case "pending":
        message =
          `Hi ${order.name},\n\n` +
          `Thank you for your VedaGlow order! 🌿\n\n` +
          `📦 Order ID: ${formatOrderId(order)}\n` +
          `💰 Amount: ₹${order.totalPrice}\n` +
          `📍 City: ${order.city}\n\n` +
          `We've received your order and it is being reviewed. We'll update you once it's confirmed.\n\n` +
          `— Team VedaGlow`;
        break;

      case "confirmed":
        message =
          `Hi ${order.name},\n\n` +
          `Great news! ✅ Your VedaGlow order has been *confirmed*.\n\n` +
          `📦 Order ID: ${formatOrderId(order)}\n` +
          `💰 Amount: ₹${order.totalPrice}\n\n` +
          `We're preparing your order for shipping. You'll receive tracking details soon!\n\n` +
          `— Team VedaGlow`;
        break;

      case "shipped":
        message =
          `Hi ${order.name},\n\n` +
          `Your VedaGlow order has been *shipped*! 🚚\n\n` +
          `📦 Order ID: ${formatOrderId(order)}\n` +
          `💰 Amount: ₹${order.totalPrice}\n` +
          `📍 Delivering to: ${order.city}\n\n` +
          `Your order is on its way. You can expect delivery within 5-7 business days.\n\n` +
          `— Team VedaGlow`;
        break;

      case "delivered":
        message =
          `Hi ${order.name},\n\n` +
          `Your VedaGlow order has been *delivered*! 🎉\n\n` +
          `📦 Order ID: ${formatOrderId(order)}\n\n` +
          `We hope you love your 28-Day Ayurvedic Kit! ✨\n` +
          `If you have any questions about using the kit, feel free to ask.\n\n` +
          `We'd love to hear your feedback! 💚\n\n` +
          `— Team VedaGlow`;
        break;

      default:
        message = `Hi ${order.name}, this is regarding your VedaGlow order (${formatOrderId(order)}). `;
    }

    window.open(
      `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const isShippable = order.status === "pending" || order.status === "confirmed";

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleCall}
          title="Call customer"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-all hover:bg-blue-100 hover:scale-110 active:scale-95"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={handleWhatsApp}
          title="WhatsApp customer"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600 transition-all hover:bg-green-100 hover:scale-110 active:scale-95"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </button>

        {isShippable && (
          <button
            type="button"
            onClick={() => onMarkShipped(order.id)}
            title="Mark as shipped"
            className="inline-flex h-8 items-center gap-1 rounded-lg bg-violet-50 px-2.5 text-xs font-semibold text-violet-600 transition-all hover:bg-violet-100 hover:scale-105 active:scale-95"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Ship
          </button>
        )}
        <button
          type="button"
          onClick={() => handlePrint(order)}
          title="Print delivery slip"
          className="inline-flex h-8 items-center gap-1 rounded-lg bg-slate-100 px-2.5 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-200 hover:scale-105 active:scale-95"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Slip
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={handleCall}
        className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition-all hover:bg-blue-100 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        Call
      </button>

      <button
        type="button"
        onClick={handleWhatsApp}
        className="inline-flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 transition-all hover:bg-green-100 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        WhatsApp
      </button>

      {isShippable && (
        <button
          type="button"
          onClick={() => onMarkShipped(order.id)}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 transition-all hover:bg-violet-100 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Mark Shipped
        </button>
      )}
      <button
        type="button"
        onClick={() => handlePrint(order)}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Print Slip
      </button>
    </div>
  );
}
