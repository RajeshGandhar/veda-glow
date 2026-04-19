// ── Admin Page: Connects UI to real API ──

import { useState } from "react";
import type { FormEvent } from "react";
import { useAdminAuth } from "./admin/data/useOrders";
import { AdminLayout, type AdminTab } from "./admin/components/AdminLayout";
import { OrdersPanel } from "./admin/components/OrdersPanel";
import { CouponsPanel } from "./admin/components/CouponsPanel";

export function AdminPage() {
  const { isUnlocked, authLoading, authError, login, logout } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("orders");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Login form state
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(emailInput, passwordInput);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Auth Loading
  if (authLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-slate-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
      </div>
    );
  }

  // Locked State (Login) — styled as a generic login page for security
  if (!isUnlocked) {
    return (
      <div className="min-h-svh bg-[radial-gradient(circle_at_10%_10%,#d9f5ea_0%,#eff7f4_45%,#f8faf9_100%)] px-4 py-12 flex flex-col items-center justify-center">
        <div className="w-full max-w-md rounded-[2rem] border border-white/40 bg-white/60 p-8 shadow-[0_24px_50px_-35px_rgba(16,58,47,0.3)] backdrop-blur-2xl">
          <div className="text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg">
              <svg
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </span>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
              Welcome Back
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Sign in to your account to continue.
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Email
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none ring-emerald-200/50 transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none ring-emerald-200/50 transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4"
                required
              />
            </div>

            {authError && (
              <p className="rounded-lg border border-rose-200/50 bg-rose-50/50 px-3 py-2 text-center text-xs font-medium text-rose-600 backdrop-blur-sm">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-900/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Protected area · VedaGlow © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    );
  }

  // Admin Dashboard — connected to real API
  return (
    <AdminLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={logout}
      onRefresh={handleRefresh}
    >
      {activeTab === "orders" && (
        <OrdersPanel refreshTrigger={refreshTrigger} />
      )}
      {activeTab === "coupons" && (
        <CouponsPanel refreshTrigger={refreshTrigger} />
      )}
    </AdminLayout>
  );
}

export default AdminPage;
