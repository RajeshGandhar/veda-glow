// ── Data Agent: Filter/Search Logic ──

import { useMemo, useState } from "react";
import type { Order, OrderStatus, PaymentFilter } from "./types";

export function useOrderFilters(orders: Order[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchQuery.toLowerCase().trim();

    if (!normalizedSearch && statusFilter === "all" && paymentFilter === "all") {
      return orders; // fast path — no filtering needed
    }

    return orders.filter((order) => {
      // Search — matches name, phone, city, order#, address, email, coupon
      const digitsOnly = normalizedSearch.replace(/\D/g, "");
      const matchesSearch = !normalizedSearch
        || order.name.toLowerCase().includes(normalizedSearch)
        || (digitsOnly.length > 0 && order.phone.replace(/\D/g, "").includes(digitsOnly))
        || order.city.toLowerCase().includes(normalizedSearch)
        || (order.orderNumber != null && String(order.orderNumber).includes(normalizedSearch))
        || order.address.toLowerCase().includes(normalizedSearch)
        || (order.email?.toLowerCase().includes(normalizedSearch) ?? false)
        || (order.couponCode?.toLowerCase().includes(normalizedSearch) ?? false)
        || (order.couponCreatedBy?.toLowerCase().includes(normalizedSearch) ?? false);

      // Status filter
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;

      // Payment filter
      const paymentMethod = order.paymentMethod.toLowerCase();
      const paymentStatus = order.paymentStatus.toLowerCase();
      const isCod = paymentMethod === "cod";
      const isPaid = paymentStatus === "paid" || paymentMethod === "online" || paymentMethod === "razorpay";
      const matchesPayment =
        paymentFilter === "all" ||
        (paymentFilter === "cod" && isCod) ||
        (paymentFilter === "paid" && isPaid);

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, searchQuery, statusFilter, paymentFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === "pending").length;
    const confirmed = orders.filter((o) => o.status === "confirmed").length;
    const shipped = orders.filter((o) => o.status === "shipped").length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const revenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);
    return { total, pending, confirmed, shipped, delivered, revenue };
  }, [orders]);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    paymentFilter,
    setPaymentFilter,
    filteredOrders,
    stats,
  };
}
