import { useEffect, useRef, useState } from "react";
import type { Order, OrderStatus } from "../data/types";
import { useOrders } from "../data/useOrders";
import { useOrderFilters } from "../data/useOrderFilters";
import { StatsCards } from "./StatsCards";
import { SearchAndFilter } from "./SearchAndFilter";
import { OrdersTable } from "./OrdersTable";
import { OrderDrawer } from "./OrderDrawer";

export function OrdersPanel({ refreshTrigger }: { refreshTrigger: number }) {
  const {
    orders,
    loading: ordersLoading,
    error,
    successMessage,
    updatingId,
    fetchOrders,
    updateStatus,
    markShipped,
  } = useOrders();

  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    paymentFilter,
    setPaymentFilter,
    filteredOrders,
    stats,
  } = useOrderFilters(orders);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Fetch orders on mount or when refreshTrigger changes
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, refreshTrigger]);

  // Auto-scroll to results whenever search or filters are active
  useEffect(() => {
    const hasActiveFilter =
      searchQuery.trim().length > 0 ||
      statusFilter !== "all" ||
      paymentFilter !== "all";
    if (!hasActiveFilter) return;
    const timer = setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, paymentFilter]);

  const handleUpdateStatus = (orderId: string, status: OrderStatus) => {
    updateStatus(orderId, status);
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status } : null));
    }
  };

  return (
    <>
      {/* Toast Notifications */}
      {successMessage && (
        <div className="animate-[slideDown_0.3s_ease-out] mb-6 rounded-xl border border-emerald-200/50 bg-emerald-50 p-4 text-emerald-800 shadow-sm flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-200/50 text-emerald-700">✓</span>
          <p className="text-sm font-semibold">{successMessage}</p>
        </div>
      )}
      {error && (
        <div className="animate-[slideDown_0.3s_ease-out] mb-6 rounded-xl border border-rose-200/50 bg-rose-50 p-4 text-rose-800 shadow-sm flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-200/50 text-rose-700">!</span>
          <p className="text-sm font-semibold">{error}</p>
          <button
            type="button"
            onClick={fetchOrders}
            className="ml-auto rounded-lg bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content Stack */}
      <div className="space-y-6">
        <StatsCards {...stats} isLoading={ordersLoading} />

        <SearchAndFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          paymentFilter={paymentFilter}
          onPaymentFilterChange={setPaymentFilter}
          resultCount={filteredOrders.length}
          totalCount={orders.length}
        />

        <div ref={resultsRef} className="scroll-mt-4">
          <OrdersTable
            orders={filteredOrders}
            onOrderClick={setSelectedOrder}
            onUpdateStatus={handleUpdateStatus}
            onMarkShipped={markShipped}
            isLoading={ordersLoading}
            updatingId={updatingId}
          />
        </div>
      </div>

      {/* Order Detail Drawer */}
      <OrderDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onMarkShipped={markShipped}
      />
    </>
  );
}
