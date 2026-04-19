// ── Data Agent: Shared Types ──

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered";

export type PaymentFilter = "all" | "cod" | "paid";

export type Order = {
  id: string;
  orderNumber: number | null;
  name: string;
  phone: string;
  city: string;
  address: string;
  quantity: number;
  totalPrice: number;
  paymentMethod: string;
  paymentStatus: string;
  status: OrderStatus;
  date: string;
  email?: string;
  couponCode: string | null;
  discountAmount: number;
  couponCreatedBy: string;
};

export const STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
];

export const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string; dot: string }> = {
  pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  confirmed: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  shipped: { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-400" },
  delivered: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
};

export function normalizeStatus(value: string): OrderStatus {
  const normalized = value.toLowerCase().trim();
  if (STATUS_OPTIONS.includes(normalized as OrderStatus)) {
    return normalized as OrderStatus;
  }
  if (normalized === "processing") return "confirmed";
  return "pending";
}

export function formatStatus(value: string): string {
  if (!value) return "Pending";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function formatOrderId(order: Order): string {
  if (order.orderNumber != null) {
    return `#${String(order.orderNumber).padStart(4, "0")}`;
  }
  return `#${order.id.slice(-6).toUpperCase()}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatDateTime(value: string): { date: string; time: string; full: string } {
  const d = new Date(value);
  if (isNaN(d.getTime())) return { date: value, time: "", full: value };

  const day = d.getDate();
  const month = d.toLocaleString("en-IN", { month: "short" });
  const year = d.getFullYear();
  const time = d.toLocaleString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const date = `${day} ${month} ${year}`;
  return { date, time, full: `${date}, ${time}` };
}
