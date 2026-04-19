// ── UI Agent: Admin Layout Wrapper ──

import { type ReactNode } from "react";

export type AdminTab = "orders" | "coupons";

type Props = {
  children: ReactNode;
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onLogout: () => void;
  onRefresh: () => void;
};

export function AdminLayout({ children, activeTab, onTabChange, onLogout, onRefresh }: Props) {
  return (
    <div className="min-h-svh bg-slate-50/50 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Premium Admin Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 pr-safe pl-safe backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 border-slate-200">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              VedaGlow <span className="font-light text-slate-400">|</span> Admin
            </h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onRefresh}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-white px-3 font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 transition-all hover:bg-slate-50 hover:-translate-y-0.5 active:translate-y-0"
              title="Refresh Data"
            >
              <svg className="h-4 w-4 sm:mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline text-xs mt-px">Refresh</span>
            </button>
            <button
              onClick={onLogout}
              className="inline-flex h-9 items-center justify-center rounded-xl border border-transparent bg-slate-900 px-3 font-semibold text-white shadow-sm transition-all hover:bg-slate-800 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
            >
              <span className="text-xs">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1600px] gap-6 px-4 sm:px-6 lg:px-8">
          {(
            [
              { id: "orders", label: "Orders" },
              { id: "coupons", label: "Coupons" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-veda-green text-veda-green"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
