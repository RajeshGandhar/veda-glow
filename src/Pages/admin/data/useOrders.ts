// ── Data Agent: Orders Hook ──
// Fetches real orders from API. Shows error if API fails (no silent dummy fallback).

import { useCallback, useEffect, useState } from "react";
import type { Order, OrderStatus } from "./types";
import { normalizeStatus } from "./types";

type ApiOrder = Record<string, unknown>;

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizeApiOrder(apiOrder: ApiOrder): Order {
  const rawOrderNum = apiOrder.orderNumber;
  return {
    id: String(apiOrder.id ?? apiOrder._id ?? ""),
    orderNumber: typeof rawOrderNum === "number" ? rawOrderNum : null,
    name: String(apiOrder.name ?? "-"),
    email: apiOrder.email ? String(apiOrder.email) : undefined,
    phone: String(apiOrder.phone ?? "-"),
    city: String(apiOrder.city ?? "-"),
    address: String(apiOrder.address ?? "-"),
    quantity: toNumber(apiOrder.quantity ?? apiOrder.qty),
    totalPrice: toNumber(apiOrder.totalPrice ?? apiOrder.amount),
    paymentMethod: String(apiOrder.paymentMethod ?? apiOrder.paymentType ?? "-"),
    paymentStatus: String(apiOrder.paymentStatus ?? ""),
    status: normalizeStatus(String(apiOrder.status ?? apiOrder.orderStatus ?? "pending")),
    date: String(apiOrder.createdAt ?? apiOrder.date ?? new Date().toISOString().slice(0, 10)),
    couponCode: (apiOrder.couponCode as string | null) ?? null,
    discountAmount: toNumber(apiOrder.discountAmount),
    couponCreatedBy: String(apiOrder.couponCreatedBy ?? ""),
  };
}

async function fetchJson(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  const payload = await response
    .json()
    .catch(() => ({ message: `HTTP ${response.status}` }));

  if (!response.ok) {
    throw new Error(payload?.message || `HTTP ${response.status}`);
  }

  return payload as Record<string, unknown>;
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  // Auto-clear success messages
  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(""), 2500);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await fetchJson("/api/admin/orders");
      const rawOrders = Array.isArray(payload.orders) ? (payload.orders as ApiOrder[]) : [];
      const normalized = rawOrders
        .map((item) => normalizeApiOrder(item))
        .filter((item) => Boolean(item.id));
      setOrders(normalized);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load orders.";
      setError(msg);
      // If unauthorized, don't keep stale data
      if (msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("401")) {
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    setError("");
    setSuccessMessage("");
    setUpdatingId(orderId);

    try {
      const payload = await fetchJson(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      // Use the server-returned order if available to stay in sync
      if (payload.order) {
        const updated = normalizeApiOrder(payload.order as ApiOrder);
        setOrders((prev) =>
          prev.map((order) => (order.id === updated.id ? updated : order)),
        );
      } else {
        // Fallback: update locally
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order,
          ),
        );
      }

      setSuccessMessage(`Order ${orderId.slice(-6)} → ${newStatus}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setUpdatingId("");
    }
  }, []);

  const markShipped = useCallback(
    (orderId: string) => updateStatus(orderId, "shipped"),
    [updateStatus],
  );

  return {
    orders,
    loading,
    error,
    successMessage,
    updatingId,
    fetchOrders,
    updateStatus,
    markShipped,
  };
}

// Auth hooks
export function useAdminAuth() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        await fetchJson("/api/admin/me", { method: "GET" });
        setIsUnlocked(true);
      } catch {
        setIsUnlocked(false);
      } finally {
        setAuthLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    setAuthError("");
    try {
      await fetchJson("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setIsUnlocked(true);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const logout = async () => {
    try {
      await fetchJson("/api/admin/logout", { method: "POST" });
    } catch {
      // Ignore
    } finally {
      setIsUnlocked(false);
    }
  };

  return { isUnlocked, authLoading, authError, login, logout };
}
