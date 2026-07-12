import React, { useEffect, useMemo, useState } from 'react';
import { Search, Package, ChevronRight } from 'lucide-react';
import type { FirestoreOrder, OrderStatus } from '../types/firestore';
import { getUserOrders } from '../lib/services/orders';

interface OrderHistoryPageProps {
  uid: string;
  onSelectOrder: (orderId: string) => void;
  onBrowse: () => void;
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  packed: 'bg-sky-100 text-sky-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function OrderHistoryPage({ uid, onSelectOrder, onBrowse }: OrderHistoryPageProps) {
  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getUserOrders(uid)
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError('Could not load your orders right now.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const filteredOrders = useMemo(() => {
    let result = [...orders].sort(
      (a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
    );
    if (statusFilter !== 'all') {
      result = result.filter((o) => o.orderStatus === statusFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.items.some((item) => item.name.toLowerCase().includes(q))
      );
    }
    return result;
  }, [orders, search, statusFilter]);

  return (
    <div className="space-y-8 min-h-[60vh]">
      <div className="border-b border-[#e8bcb7]/20 pb-6">
        <h1 className="font-display font-bold text-3xl text-[#291715]">My Orders</h1>
        <p className="text-xs text-[#5e3f3b] mt-1.5">Track and review everything you've ordered from PurnimaCart.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5e3f3b]/40" size={15} />
          <input
            type="text"
            placeholder="Search by Order ID or product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#e8bcb7]/20 rounded-xl py-3 pl-10 pr-4 text-xs outline-none focus:ring-1 focus:ring-primary text-[#291715]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="bg-white border border-[#e8bcb7]/20 text-xs rounded-xl py-3 px-4 text-[#291715] outline-none focus:ring-1 focus:ring-primary cursor-pointer font-semibold"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="packed">Packed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-xs font-semibold text-[#5e3f3b]/60">Loading your orders…</p>
        </div>
      )}

      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

      {!loading && !error && filteredOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-white rounded-[32px] border border-[#e8bcb7]/15">
          <Package size={44} className="text-[#e8bcb7]" />
          <h3 className="font-semibold text-base text-[#291715]">
            {orders.length === 0 ? 'No orders yet' : 'No orders match your filters'}
          </h3>
          <p className="text-xs text-[#5e3f3b]/60 max-w-sm">
            {orders.length === 0
              ? 'Once you place an order, it will show up here.'
              : 'Try adjusting your search or status filter.'}
          </p>
          {orders.length === 0 && (
            <button
              onClick={onBrowse}
              className="bg-primary text-white text-xs font-bold px-6 py-3 rounded-xl hover:bg-[#9a000e] transition-colors cursor-pointer"
            >
              Browse Products
            </button>
          )}
        </div>
      )}

      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <button
            key={order.id}
            onClick={() => onSelectOrder(order.id)}
            className="w-full text-left bg-white border border-[#e8bcb7]/20 rounded-2xl p-5 flex items-center gap-4 hover:border-primary/40 transition-colors cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-[#fff0ee] flex items-center justify-center text-primary shrink-0">
              <Package size={20} />
            </div>
            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-[#291715] truncate max-w-[150px] sm:max-w-[250px]">
                  {order.items.length > 0
                    ? (order.items.length > 1
                        ? `${order.items[0].name} & ${order.items.length - 1} more`
                        : order.items[0].name)
                    : 'Order'}
                </span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_STYLES[order.orderStatus]}`}>
                  {order.orderStatus}
                </span>
              </div>
              <p className="text-[11px] text-[#5e3f3b]/70 mt-1">
                {order.items.reduce((acc, i) => acc + i.qty, 0)} item(s) ·{' '}
                {order.createdAt?.toDate?.()
                  ? order.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—'}
              </p>
            </div>
            <span className="text-sm font-bold text-primary shrink-0">₹{order.total.toLocaleString()}</span>
            <ChevronRight size={16} className="text-[#5e3f3b]/40 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
