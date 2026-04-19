// ── Admin Search & Filter Bar ──
// Fully controlled by parent — no local debounce state, zero race conditions.
// Search fires on every keystroke via onSearchChange directly.

import { useEffect, useRef, useState } from "react";
import type { OrderStatus, PaymentFilter } from "../data/types";
import { STATUS_OPTIONS, formatStatus } from "../data/types";

type Props = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: OrderStatus | "all";
  onStatusFilterChange: (value: OrderStatus | "all") => void;
  paymentFilter: PaymentFilter;
  onPaymentFilterChange: (value: PaymentFilter) => void;
  resultCount: number;
  totalCount?: number;
};

const STATUS_META: Record<
  OrderStatus | "all",
  { dot: string; active: string; inactive: string }
> = {
  all:       { dot: "bg-slate-700",   active: "bg-slate-900 text-white border-slate-900 shadow-sm",              inactive: "border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700" },
  pending:   { dot: "bg-amber-400",   active: "bg-amber-50 text-amber-700 border-amber-300 shadow-sm",           inactive: "border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-600" },
  confirmed: { dot: "bg-blue-400",    active: "bg-blue-50 text-blue-700 border-blue-300 shadow-sm",              inactive: "border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600" },
  shipped:   { dot: "bg-violet-400",  active: "bg-violet-50 text-violet-700 border-violet-300 shadow-sm",        inactive: "border-slate-200 text-slate-500 hover:border-violet-300 hover:text-violet-600" },
  delivered: { dot: "bg-emerald-400", active: "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm",     inactive: "border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600" },
};

export function SearchAndFilter({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  paymentFilter,
  onPaymentFilterChange,
  resultCount,
  totalCount,
}: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" or Ctrl+K to focus search bar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (
        (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") ||
        (e.key === "k" && (e.ctrlKey || e.metaKey))
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && isFocused) {
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFocused]);

  const handleReset = () => {
    onSearchChange("");
    onStatusFilterChange("all");
    onPaymentFilterChange("all");
    inputRef.current?.focus();
  };

  const hasFilters =
    searchQuery.trim().length > 0 ||
    statusFilter !== "all" ||
    paymentFilter !== "all";

  const isFiltered =
    totalCount !== undefined && resultCount !== totalCount;

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm">

      {/* ── Search Input Row ── */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-3">

          {/* Search input */}
          <div className="relative flex-1">

            {/* Focus glow */}
            {isFocused && (
              <div className="pointer-events-none absolute -inset-px rounded-xl bg-gradient-to-r from-emerald-400/25 via-teal-300/20 to-emerald-400/25 blur-sm" />
            )}

            {/* Left icon */}
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none z-10">
              <svg
                className={`h-4 w-4 transition-all duration-200 ${isFocused ? "text-emerald-500 scale-110" : "text-slate-400"}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Input — fully controlled by parent searchQuery */}
            <input
              ref={inputRef}
              id="admin-search"
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Search name, phone, email, city, order #…"
              autoComplete="off"
              spellCheck={false}
              className={`relative z-10 w-full rounded-xl border py-2.5 pl-10 pr-10 text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400
                ${isFocused
                  ? "border-emerald-400 bg-white shadow-[0_0_0_3px_rgb(52_211_153_/_0.15)]"
                  : "border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300"
                }`}
            />

            {/* Clear button */}
            {searchQuery && (
              <button
                type="button"
                onClick={() => { onSearchChange(""); inputRef.current?.focus(); }}
                className="absolute inset-y-0 right-3 z-10 flex items-center justify-center"
                aria-label="Clear search"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-500 transition-all hover:bg-slate-300 hover:text-slate-700 hover:scale-110">
                  <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
              </button>
            )}

            {/* "/" hint */}
            {!searchQuery && !isFocused && (
              <div className="absolute inset-y-0 right-3 z-10 hidden sm:flex items-center">
                <kbd className="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400">
                  /
                </kbd>
              </div>
            )}
          </div>

          {/* Reset all button */}
          {hasFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="shrink-0 flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-600 transition-all hover:bg-rose-100 hover:border-rose-300 hover:shadow-sm"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reset
            </button>
          )}
        </div>

        {/* Active filter chips + count */}
        <div className="mt-2.5 flex flex-wrap items-center gap-2 min-h-[22px]">

          {/* Search chip */}
          {searchQuery.trim().length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              "{searchQuery.trim()}"
            </span>
          )}

          {/* Status chip */}
          {statusFilter !== "all" && (
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_META[statusFilter].active}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[statusFilter].dot}`} />
              {formatStatus(statusFilter)}
            </span>
          )}

          {/* Payment chip */}
          {paymentFilter !== "all" && (
            <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
              {paymentFilter.toUpperCase()}
            </span>
          )}

          {/* Result count */}
          <span className={`ml-auto text-xs font-medium tabular-nums ${isFiltered ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
            {isFiltered
              ? `${resultCount} of ${totalCount} orders`
              : `${resultCount} order${resultCount !== 1 ? "s" : ""}`}
          </span>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="mx-4 border-t border-slate-100 sm:mx-5" />

      {/* ── Status + Payment Filters ── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 px-4 py-3 sm:px-5">

        {/* Status pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Status
          </span>
          {(["all", ...STATUS_OPTIONS] as (OrderStatus | "all")[]).map(s => {
            const m = STATUS_META[s];
            const active = statusFilter === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => onStatusFilterChange(s)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-150 ${active ? m.active : m.inactive}`}
              >
                {s !== "all" && (
                  <span className={`h-1.5 w-1.5 rounded-full ${m.dot} ${active ? "" : "opacity-50"}`} />
                )}
                {s === "all" ? "All" : formatStatus(s)}
              </button>
            );
          })}
        </div>

        {/* Vertical divider */}
        <div className="hidden sm:block h-5 w-px bg-slate-200 shrink-0" />

        {/* Payment toggle */}
        <div className="flex items-center gap-1.5">
          <span className="mr-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Payment
          </span>
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 gap-px">
            {(["all", "cod", "paid"] as PaymentFilter[]).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => onPaymentFilterChange(f)}
                className={`rounded-[10px] px-3.5 py-1.5 text-[11px] font-bold transition-all duration-150 ${
                  paymentFilter === f
                    ? "bg-white text-slate-900 shadow border border-slate-200/80"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {f === "all" ? "All" : f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
