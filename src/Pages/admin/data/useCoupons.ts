import { useCallback, useState } from "react";

export type Coupon = {
  id: string;
  code: string;
  createdBy: string;
  commission: number | null;
  discountType: "percent" | "fixed";
  discountValue: number;
  isActive: boolean;
  usedCount: number;
  maxUses: number | null;
  maxUsesPerUser: number | null;
  minOrderAmount: number;
  maxDiscount: number | null;
  remainingUses: number | null;
  validFrom: string | null;
  validUntil: string | null;
  createdAt: string;
};

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

export function useCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchJson("/api/admin/coupons");
      setCoupons(data.coupons as Coupon[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }, []);

  const createCoupon = async (payload: Partial<Coupon>) => {
    setActionLoading(true);
    try {
      const data = await fetchJson("/api/admin/coupons", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setCoupons((prev) => [data.coupon as Coupon, ...prev]);
      return data.coupon as Coupon;
    } finally {
      setActionLoading(false);
    }
  };

  const updateCoupon = async (id: string, payload: Partial<Coupon>) => {
    setActionLoading(true);
    try {
      const data = await fetchJson(`/api/admin/coupons/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setCoupons((prev) => prev.map((c) => (c.id === id ? (data.coupon as Coupon) : c)));
      return data.coupon as Coupon;
    } finally {
      setActionLoading(false);
    }
  };

  const toggleStatus = async (id: string, isActive: boolean) => {
    return updateCoupon(id, { isActive });
  };

  const deleteCoupon = async (id: string) => {
    setActionLoading(true);
    try {
      await fetchJson(`/api/admin/coupons/${id}`, { method: "DELETE" });
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setActionLoading(false);
    }
  };

  return {
    coupons,
    loading,
    error,
    actionLoading,
    fetchCoupons,
    createCoupon,
    updateCoupon,
    toggleStatus,
    deleteCoupon,
  };
}
