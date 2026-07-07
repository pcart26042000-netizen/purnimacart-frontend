import React from 'react';
import {
  IndianRupee, ShoppingBag, Clock, CheckCircle2, AlertTriangle, Star,
  Package, Users, Ticket,
} from 'lucide-react';
import { useAdminDashboard } from './hooks/useAdminDashboard';
import { LoadingBlock, ErrorBlock } from './components/LoadingState';
import type { SalesDay } from '../lib/services/adminDashboard';

function KpiCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone: 'primary' | 'amber' | 'blue' | 'emerald' | 'violet';
}) {
  const toneStyles: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-primary/10 text-primary',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e8bcb7]/20 p-5 flex flex-col gap-4 shadow-sm">
      <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${toneStyles[tone]}`}>
        <Icon size={19} />
      </span>
      <div>
        <p className="text-2xl font-display font-bold text-[#291715] truncate">{value}</p>
        <p className="text-xs font-semibold text-[#5e3f3b]/60 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// Combined revenue (line) + order count (bars) chart, each normalized to its
// own max so both series stay readable on one axis-free SVG.
function SalesChart({ data, totalRevenue }: { data: SalesDay[]; totalRevenue: number }) {
  const maxRevenue = Math.max(1, ...data.map((d) => d.revenue));
  const maxOrders = Math.max(1, ...data.map((d) => d.orders));
  const width = 600;
  const height = 220;
  const padding = 28;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;
  const stepX = chartW / (data.length - 1 || 1);

  const points = data.map((d, i) => {
    const x = padding + i * stepX;
    const y = padding + chartH - (d.revenue / maxRevenue) * chartH;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = points.length > 1
    ? `${linePath} L${points[points.length - 1].x},${padding + chartH} L${points[0].x},${padding + chartH} Z`
    : '';
  const barWidth = Math.min(28, stepX * 0.4);

  return (
    <div className="bg-white rounded-2xl border border-[#e8bcb7]/20 p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h3 className="font-display font-bold text-base text-[#291715]">Sales &amp; Orders, Last 7 Days</h3>
          <p className="text-xs text-[#5e3f3b]/60 mt-0.5">Revenue (line) and order volume (bars)</p>
        </div>
        <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
          ₹{totalRevenue.toLocaleString('en-IN')} total
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bb0012" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#bb0012" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={padding}
            x2={width - padding}
            y1={padding + chartH * (1 - f)}
            y2={padding + chartH * (1 - f)}
            stroke="#e8bcb7"
            strokeOpacity="0.25"
            strokeDasharray="4 4"
          />
        ))}
        {points.map((p, i) => {
          const barH = (p.orders / maxOrders) * chartH * 0.85;
          return (
            <rect
              key={`bar-${i}`}
              x={p.x - barWidth / 2}
              y={padding + chartH - barH}
              width={barWidth}
              height={barH}
              rx={4}
              fill="#5e3f3b"
              fillOpacity="0.12"
            />
          );
        })}
        {areaPath && <path d={areaPath} fill="url(#salesFill)" />}
        {points.length > 1 && (
          <path d={linePath} fill="none" stroke="#bb0012" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#bb0012" stroke="white" strokeWidth="2" />
            <text x={p.x} y={height - 6} textAnchor="middle" fontSize="11" fill="#5e3f3b" fontWeight="600">
              {p.day}
            </text>
          </g>
        ))}
      </svg>
      <div className="flex items-center gap-5 mt-2">
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#5e3f3b]/60">
          <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Revenue
        </span>
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#5e3f3b]/60">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#5e3f3b]/30" /> Orders
        </span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { stats, loading, error } = useAdminDashboard();

  if (loading) return <LoadingBlock label="Crunching the numbersâ€¦" />;
  if (error) return <ErrorBlock message={error} />;

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={IndianRupee} label="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`} tone="primary" />
        <KpiCard icon={ShoppingBag} label="Total Orders" value={String(stats.totalOrders)} tone="blue" />
        <KpiCard icon={Package} label="Total Products" value={String(stats.totalProducts)} tone="violet" />
        <KpiCard icon={Users} label="Total Customers" value={String(stats.totalCustomers)} tone="emerald" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Clock} label="Pending Orders" value={String(stats.pendingOrders)} tone="amber" />
        <KpiCard icon={CheckCircle2} label="Delivered Orders" value={String(stats.deliveredOrders)} tone="emerald" />
        <KpiCard icon={Ticket} label="Active Coupons" value={String(stats.activeCoupons)} tone="primary" />
        <KpiCard icon={AlertTriangle} label="Low Stock Items" value={String(stats.lowStockProducts.length)} tone="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart data={stats.salesLast7Days} totalRevenue={stats.totalRevenue} />
        </div>

        {/* Top products */}
        <div className="bg-white rounded-2xl border border-[#e8bcb7]/20 p-5 shadow-sm">
          <h3 className="font-display font-bold text-base text-[#291715] mb-4">Top Products</h3>
          {stats.topProducts.length === 0 ? (
            <p className="text-xs text-[#5e3f3b]/50 py-6 text-center">No products yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.topProducts.map((p, idx) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#5e3f3b]/40 w-4">{idx + 1}</span>
                  <img
                    src={p.images?.[0] || 'https://placehold.co/80x80/fff0ee/bb0012?text=PC'}
                    alt={p.name}
                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#291715] truncate">{p.name}</p>
                    <p className="text-[10px] text-[#5e3f3b]/60 flex items-center gap-1">
                      <Star size={10} className="fill-amber-400 text-amber-400" />
                      {p.rating} Â· {p.reviewCount} reviews
                    </p>
                  </div>
                  <span className="text-xs font-bold text-primary shrink-0">₹{p.price.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low stock */}
        <div className="bg-white rounded-2xl border border-[#e8bcb7]/20 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-amber-500" />
            <h3 className="font-display font-bold text-base text-[#291715]">Low Stock Alerts</h3>
          </div>
          {stats.lowStockProducts.length > 0 ? (
            <div className="space-y-3">
              {stats.lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <img
                    src={p.images?.[0] || 'https://placehold.co/80x80/fff0ee/bb0012?text=PC'}
                    alt={p.name}
                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#291715] truncate">{p.name}</p>
                    <p className="text-[10px] text-[#5e3f3b]/60 capitalize">{p.categorySlug}</p>
                  </div>
                  <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full shrink-0">
                    {p.stock} left
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#5e3f3b]/50 py-6 text-center">All products are well stocked.</p>
          )}
        </div>

        {/* Recent orders */}
        <div className="bg-white rounded-2xl border border-[#e8bcb7]/20 p-5 shadow-sm">
          <h3 className="font-display font-bold text-base text-[#291715] mb-4">Recent Orders</h3>
          {stats.recentOrders.length === 0 ? (
            <p className="text-xs text-[#5e3f3b]/50 py-6 text-center">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentOrders.map((o) => (
                <div key={o.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <ShoppingBag size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono font-semibold text-[#291715] truncate">#{o.id.slice(0, 10)}</p>
                    <p className="text-[10px] text-[#5e3f3b]/60 capitalize">{o.orderStatus} Â· {o.paymentMethod.toUpperCase()}</p>
                  </div>
                  <span className="text-xs font-bold text-primary shrink-0">₹{o.total.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


