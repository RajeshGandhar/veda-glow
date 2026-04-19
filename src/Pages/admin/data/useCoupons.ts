import { useCallback, useState } from "react";
import { apiClient } from "@/services/api";

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

export function useCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiClient.get<Record<string, unknown>>("/admin/coupons");
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
      const data = await apiClient.post<Record<string, unknown>>("/admin/coupons", payload);
      setCoupons((prev) => [data.coupon as Coupon, ...prev]);
      return data.coupon as Coupon;
    } finally {
      setActionLoading(false);
    }
  };

  const updateCoupon = async (id: string, payload: Partial<Coupon>) => {
    setActionLoading(true);
    try {
      const data = await apiClient.patch<Record<string, unknown>>(`/admin/coupons/${id}`, payload);
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
      await apiClient.delete(`/admin/coupons/${id}`);
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
