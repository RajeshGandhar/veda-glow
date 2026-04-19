// ── UI Agent: Orders Table — Premium Redesign ──

import type { Order, OrderStatus } from "../data/types";
import {
  formatCurrency,
  formatDateTime,
  formatOrderId,
  formatStatus,
  STATUS_OPTIONS,
  STATUS_COLORS,
} from "../data/types";
import { OrderActions } from "./OrderActions";

type Props = {
  orders: Order[];
  onOrderClick: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onMarkShipped: (orderId: string) => void;
  isLoading?: boolean;
  updatingId?: string;
};

const STATUS_LEFT_BAR: Record<string, string> = {
  pending:   "bg-amber-400",
  confirmed: "bg-blue-400",
  shipped:   "bg-violet-400",
  delivered: "bg-emerald-400",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function AvatarInitials({ name }: { name: string }) {
  const colors = [
    "from-emerald-400 to-teal-500",
    "from-blue-400 to-indigo-500",
    "from-violet-400 to-purple-500",
    "from-amber-400 to-orange-500",
    "from-rose-400 to-pink-500",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${color} text-[11px] font-bold text-white shadow-sm`}>
      {getInitials(name)}
    </div>
  );
}

function SkeletonRows() {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-5 py-4">
            <div className="space-y-2">
              <div className="h-4 w-16 rounded-md bg-slate-200" />
              <div className="h-3 w-24 rounded-md bg-slate-100" />
            </div>
          </td>
          <td className="px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-slate-200" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-28 rounded-md bg-slate-200" />
                <div className="h-3 w-20 rounded-md bg-slate-100" />
              </div>
            </div>
          </td>
          <td className="px-5 py-4">
            <div className="h-5 w-16 rounded-lg bg-slate-200" />
          </td>
          <td className="px-5 py-4">
            <div className="h-7 w-24 rounded-lg bg-slate-100" />
          </td>
          <td className="px-5 py-4">
            <div className="flex justify-end gap-1.5">
              <div className="h-8 w-8 rounded-lg bg-slate-100" />
              <div className="h-8 w-8 rounded-lg bg-slate-100" />
              <div className="h-8 w-14 rounded-lg bg-slate-100" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

function EmptyState() {
  return (
    <tr>
      <td colSpan={5} className="px-6 py-16 text-center">
        <div className="mx-auto flex max-w-xs flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
            📭
          </div>
          <h3 className="mt-4 font-bold text-slate-800">No orders found</h3>
          <p className="mt-1 text-sm text-slate-500">
            Try adjusting your search or filters.
          </p>
        </div>
      </td>
    </tr>
  );
}

export function OrdersTable({
  orders,
  onOrderClick,
  onUpdateStatus,
  onMarkShipped,
  isLoading,
  updatingId,
}: Props) {
  return (
    <>
      {/* ── Desktop Table ── */}
      <div className="hidden lg:block rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">

            {/* Header */}
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Order
                </th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Customer
                </th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Amount
                </th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Status
                </th>
                <th className="px-5 py-3.5 w-[160px] text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <SkeletonRows />
              ) : orders.length === 0 ? (
                <EmptyState />
              ) : (
                orders.map((order) => {
                  const isUpdating = updatingId === order.id;
                  const isCod = order.paymentMethod?.toLowerCase() === "cod";
                  const { date, time } = formatDateTime(order.date);

                  return (
                    <tr
                      key={order.id}
                      className={`group relative transition-all duration-150 hover:bg-slate-50/80 ${
                        isUpdating ? "opacity-50 pointer-events-none" : ""
                      }`}
                    >
                      {/* ── Order Info ── */}
                      <td
                        className="px-5 py-4 align-middle cursor-pointer"
                        onClick={() => onOrderClick(order)}
                      >
                        <div className="flex items-center gap-3">
                          {/* Status color bar */}
                          <div className={`h-10 w-1 rounded-full shrink-0 ${STATUS_LEFT_BAR[order.status] ?? "bg-slate-300"}`} />
                          <div>
                            <p className="font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors font-mono text-[13px]">
                              {formatOrderId(order)}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">{date}</p>
                            <p className="text-[11px] text-slate-400">{time}</p>
                            <span className="mt-1 inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                              {order.quantity} kit{order.quantity > 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* ── Customer ── */}
                      <td
                        className="px-5 py-4 align-middle cursor-pointer"
                        onClick={() => onOrderClick(order)}
                      >
                        <div className="flex items-center gap-2.5">
                          <AvatarInitials name={order.name} />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 capitalize truncate max-w-[160px]">
                              {order.name.toLowerCase()}
                            </p>
                            <p className="mt-0.5 text-xs font-medium text-slate-500">
                              {order.phone}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-400 truncate max-w-[160px]">
                              {order.city}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* ── Financials ── */}
                      <td
                        className="px-5 py-4 align-middle cursor-pointer"
                        onClick={() => onOrderClick(order)}
                      >
                        <p className="text-base font-extrabold text-slate-900">
                          {formatCurrency(order.totalPrice)}
                        </p>
                        <div className="mt-1">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            isCod
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${isCod ? "bg-amber-400" : "bg-emerald-400"}`} />
                            {isCod ? "COD" : "Prepaid"}
                          </span>
                        </div>
                        {order.couponCode && (
                          <div className="mt-1">
                            <span className="inline-flex items-center rounded-md bg-violet-50 border border-violet-200 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">
                              🏷️ {order.couponCode}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* ── Status dropdown ── */}
                      <td className="px-5 py-4 align-middle">
                        <select
                          value={order.status}
                          onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                          disabled={isUpdating}
                          className={`appearance-none cursor-pointer rounded-xl border-0 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider outline-none shadow-sm transition-all focus:ring-2 focus:ring-offset-1 ${
                            STATUS_COLORS[order.status].bg
                          } ${STATUS_COLORS[order.status].text}`}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{formatStatus(s)}</option>
                          ))}
                        </select>
                      </td>

                      {/* ── Actions ── */}
                      <td className="px-5 py-4 align-middle">
                        <div className="flex justify-end">
                          {isUpdating ? (
                            <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
                          ) : (
                            <OrderActions order={order} onMarkShipped={onMarkShipped} compact />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer: order count */}
        {!isLoading && orders.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-2.5">
            <p className="text-[11px] font-medium text-slate-400">
              Showing <span className="font-bold text-slate-600">{orders.length}</span> order{orders.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>

      {/* ── Mobile Cards ── */}
      <div className="grid gap-3 lg:hidden">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-1/3 rounded-md bg-slate-200" />
                    <div className="h-3 w-1/2 rounded-md bg-slate-100" />
                  </div>
                  <div className="h-5 w-16 rounded-lg bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex max-w-xs flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">📭</div>
              <h3 className="mt-4 font-bold text-slate-800">No orders found</h3>
              <p className="mt-1 text-sm text-slate-500">Try adjusting your search or filters.</p>
            </div>
          </div>
        ) : (
          orders.map((order) => {
            const isUpdating = updatingId === order.id;
            const isCod = order.paymentMethod?.toLowerCase() === "cod";
            const { date, time } = formatDateTime(order.date);

            return (
              <div
                key={order.id}
                className={`relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:shadow-md ${
                  isUpdating ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {/* Status left bar */}
                <div className={`absolute left-0 inset-y-0 w-1.5 ${STATUS_LEFT_BAR[order.status] ?? "bg-slate-300"}`} />

                <div className="pl-4 pr-4 pt-4 pb-3 ml-1.5">
                  {/* Top row */}
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => onOrderClick(order)}
                  >
                    <div className="flex items-center gap-2.5">
                      <AvatarInitials name={order.name} />
                      <div>
                        <p className="font-bold text-slate-800 capitalize text-sm">{order.name.toLowerCase()}</p>
                        <p className="text-xs font-medium text-slate-500">{order.phone}</p>
                        <p className="text-[11px] text-slate-400">{order.city}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-base font-extrabold text-slate-900">{formatCurrency(order.totalPrice)}</p>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        isCod
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${isCod ? "bg-amber-400" : "bg-emerald-400"}`} />
                        {isCod ? "COD" : "Prepaid"}
                      </span>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div
                    className="mt-2 flex items-center gap-2 cursor-pointer"
                    onClick={() => onOrderClick(order)}
                  >
                    <span className="font-mono text-[11px] font-bold text-slate-500">{formatOrderId(order)}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-[11px] text-slate-400">{date}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-[11px] text-slate-400">{time}</span>
                    <span className="ml-auto inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                      {order.quantity} kit{order.quantity > 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Bottom row: status + actions */}
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <select
                      value={order.status}
                      onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                      disabled={isUpdating}
                      className={`appearance-none cursor-pointer rounded-xl border-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider outline-none shadow-sm ${
                        STATUS_COLORS[order.status].bg
                      } ${STATUS_COLORS[order.status].text}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{formatStatus(s)}</option>
                      ))}
                    </select>

                    {isUpdating ? (
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
                    ) : (
                      <OrderActions order={order} onMarkShipped={onMarkShipped} compact />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
