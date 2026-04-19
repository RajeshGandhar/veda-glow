import { formatCurrency } from "../data/types";

type StatsProps = {
  total: number;
  pending: number;
  confirmed: number;
  shipped: number;
  delivered: number;
  revenue: number;
  isLoading?: boolean;
};

const cards = [
  { key: "total", label: "Total Orders", icon: "📦", gradient: "from-slate-600 to-slate-800" },
  { key: "pending", label: "Pending", icon: "⏳", gradient: "from-amber-500 to-orange-600" },
  { key: "confirmed", label: "Confirmed", icon: "✅", gradient: "from-blue-500 to-blue-700" },
  { key: "shipped", label: "Shipped", icon: "🚚", gradient: "from-violet-500 to-purple-700" },
  { key: "delivered", label: "Delivered", icon: "🎉", gradient: "from-emerald-500 to-emerald-700" },
  { key: "revenue", label: "Revenue", icon: "💰", gradient: "from-teal-500 to-cyan-700" },
] as const;

export function StatsCards({ total, pending, confirmed, shipped, delivered, revenue, isLoading }: StatsProps) {
  const values: Record<string, number | string> = {
    total,
    pending,
    confirmed,
    shipped,
    delivered,
    revenue: formatCurrency(revenue),
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <div
          key={card.key}
          className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-4 text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl`}
        >
          {/* Decorative glow */}
          <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-white/10 blur-xl transition-transform duration-500 group-hover:scale-150" />

          <div className="relative">
            <span className="text-lg">{card.icon}</span>
            <p className="mt-1 text-[0.65rem] font-medium uppercase tracking-wider text-white/70">
              {card.label}
            </p>
            
            {isLoading ? (
              <div className="mt-2 h-7 w-16 animate-pulse rounded bg-white/20" />
            ) : (
              <p className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                {values[card.key]}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
