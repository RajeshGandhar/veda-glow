import { useEffect, useState } from "react";
import { useCoupons, type Coupon } from "../data/useCoupons";
import { formatCurrency } from "../data/types";

type FormData = {
  code: string;
  createdBy: string;
  commission: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: string;
  maxUses: string;
  maxUsesPerUser: number;
  validFrom: string;
  validUntil: string;
};

const defaultFormData: FormData = {
  code: "",
  createdBy: "",
  commission: "",
  discountType: "percent",
  discountValue: 10,
  minOrderAmount: 0,
  maxDiscount: "",
  maxUses: "",
  maxUsesPerUser: 1,
  validFrom: "",
  validUntil: "",
};

export function CouponsPanel({ refreshTrigger }: { refreshTrigger: number }) {
  const { coupons, loading, error, actionLoading, fetchCoupons, createCoupon, updateCoupon, toggleStatus, deleteCoupon } = useCoupons();
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons, refreshTrigger]);

  const openCreateModal = () => {
    setFormData(defaultFormData);
    setEditingCoupon(null);
    setShowModal(true);
    setDeleteError("");
  };

  const openEditModal = (coupon: Coupon) => {
    setFormData({
      code: coupon.code,
      createdBy: coupon.createdBy,
      commission: coupon.commission != null ? String(coupon.commission) : "",
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscount: coupon.maxDiscount != null ? String(coupon.maxDiscount) : "",
      maxUses: coupon.maxUses != null ? String(coupon.maxUses) : "",
      maxUsesPerUser: coupon.maxUsesPerUser ?? 1,
      validFrom: coupon.validFrom ? coupon.validFrom.slice(0, 10) : "",
      validUntil: coupon.validUntil ? coupon.validUntil.slice(0, 10) : "",
    });
    setEditingCoupon(coupon);
    setShowModal(true);
    setDeleteError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code: formData.code,
      createdBy: formData.createdBy,
      commission: formData.commission !== "" ? Number(formData.commission) : null,
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      minOrderAmount: Number(formData.minOrderAmount),
      maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
      maxUses: formData.maxUses ? Number(formData.maxUses) : null,
      maxUsesPerUser: formData.maxUsesPerUser ? Number(formData.maxUsesPerUser) : 1,
      validFrom: formData.validFrom || null,
      validUntil: formData.validUntil || null,
    };
    try {
      if (editingCoupon) {
        await updateCoupon(editingCoupon.id, payload);
      } else {
        await createCoupon(payload);
      }
      setShowModal(false);
      setEditingCoupon(null);
      setFormData(defaultFormData);
    } catch (err) {
      alert(err instanceof Error ? err.message : `Failed to ${editingCoupon ? "update" : "create"} coupon`);
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    setDeleteError("");
    try {
      await deleteCoupon(coupon.id);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete coupon");
    }
  };

  if (loading) return <div className="py-12 text-center text-slate-500">Loading coupons...</div>;
  if (error) return <div className="py-12 text-center text-rose-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Coupons ({coupons.length})</h2>
        <button
          onClick={openCreateModal}
          className="rounded-xl bg-veda-green px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
        >
          + Create Coupon
        </button>
      </div>

      {deleteError && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          {deleteError}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Discount</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Usage</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Created By</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-slate-50 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="font-bold text-slate-900 font-mono bg-slate-100 px-2 py-1 rounded">{coupon.code}</span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                    <span className="font-medium">
                      {coupon.discountType === "percent" ? `${coupon.discountValue}%` : formatCurrency(coupon.discountValue)}
                    </span>
                    {coupon.maxDiscount ? <p className="text-xs text-slate-500">Up to {formatCurrency(coupon.maxDiscount)}</p> : null}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center text-sm font-medium text-slate-700">
                    {coupon.usedCount}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                    {coupon.createdBy || <span className="text-slate-400">—</span>}
                    {coupon.commission != null && (
                      <p className="text-xs text-slate-500">{coupon.commission}% commission</p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    <button
                      onClick={() => { setDeleteError(""); toggleStatus(coupon.id, !coupon.isActive); }}
                      disabled={actionLoading}
                      className={`relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${coupon.isActive ? "bg-emerald-500" : "bg-slate-300"}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${coupon.isActive ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(coupon)}
                        disabled={actionLoading}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(coupon)}
                        disabled={actionLoading}
                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-sm text-slate-500">No coupons found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold">{editingCoupon ? "Edit Coupon" : "Create Coupon"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Coupon Code</label>
                <input
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 uppercase"
                  placeholder="SUMMER20"
                  disabled={!!editingCoupon}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Created By</label>
                <input
                  required
                  value={formData.createdBy}
                  onChange={(e) => setFormData({ ...formData, createdBy: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Influencer or team name"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Commission % (Opt)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="None"
                  value={formData.commission}
                  onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as "percent" | "fixed" })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="percent">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Value</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Min Order ₹</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Max Discount ₹ (Opt)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="None"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Total Uses (Opt)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Per User</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={formData.maxUsesPerUser}
                    onChange={(e) => setFormData({ ...formData, maxUsesPerUser: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Valid From (Opt)</label>
                  <input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Valid Until (Opt)</label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingCoupon(null); }}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-lg bg-veda-green px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {editingCoupon ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
