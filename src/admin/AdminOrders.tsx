import React, { useMemo, useState } from 'react';
import { Search, Eye, X, MapPin, Package, CreditCard } from 'lucide-react';
import type { FirestoreOrder, OrderStatus } from '../types/firestore';
import { useAdminOrders } from './hooks/useAdminOrders';
import { updateOrderStatusAdmin } from '../lib/services/orders';
import { LoadingBlock, ErrorBlock, EmptyState } from './components/LoadingState';
import ConfirmDialog from './components/ConfirmDialog';
import Pagination from './components/Pagination';

const FILTERS: (OrderStatus | 'all')[] = ['all', 'pending', 'packed', 'shipped', 'delivered', 'cancelled'];
const PAGE_SIZE = 10;

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-amber-50 text-amber-600',
  packed: 'bg-primary/10 text-primary',
  shipped: 'bg-violet-50 text-violet-600',
  delivered: 'bg-emerald-50 text-emerald-600',
  cancelled: 'bg-red-50 text-red-500',
};

// What an admin is allowed to move an order to from its current status â€”
// mirrors ALLOWED_TRANSITIONS in functions/src/orderAdmin.ts so the UI never
// offers an option the server will reject.
const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

interface AdminOrdersProps {
  onToast: (message: string, type?: 'success' | 'info') => void;
}

function OrderDetailModal({
  order,
  onClose,
  onToast,
}: {
  order: FirestoreOrder;
  onClose: () => void;
  onToast: (message: string, type?: 'success' | 'info') => void;
}) {
  const [trackingNote, setTrackingNote] = useState(order.trackingNote || '');
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const nextOptions = NEXT_STATUSES[order.orderStatus];

  const applyStatus = async (status: OrderStatus) => {
    setSaving(true);
    try {
      await updateOrderStatusAdmin(order.id, status, trackingNote);
      onToast(status === 'cancelled' ? 'Order cancelled â€” stock restored.' : `Order marked as ${status}.`);
      onClose();
    } catch (error: any) {
      console.error(error);
      onToast(error.message || 'Could not update order status.', 'info');
    } finally {
      setSaving(false);
      setPendingStatus(null);
    }
  };

  const saveTrackingNoteOnly = async () => {
    setSaving(true);
    try {
      await updateOrderStatusAdmin(order.id, order.orderStatus, trackingNote);
      onToast('Tracking note saved.');
    } catch (error: any) {
      console.error(error);
      onToast(error.message || 'Could not save tracking note.', 'info');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 animate-[fadeIn_0.15s_ease-out]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[88vh] overflow-y-auto animate-[slideUp_0.2s_ease-out]">
        <div className="sticky top-0 bg-white border-b border-[#e8bcb7]/15 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <p className="font-mono text-xs font-bold text-[#291715]">#{order.id}</p>
            <span className={`inline-block mt-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${STATUS_STYLES[order.orderStatus]}`}>
              {order.orderStatus}
            </span>
          </div>
          <button onClick={onClose} className="text-[#5e3f3b]/50 hover:text-primary cursor-pointer" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Items */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-3 flex items-center gap-1.5">
              <Package size={13} /> Items
            </h4>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <img src={item.image} alt={item.name} className="w-11 h-11 rounded-lg object-cover shrink-0 bg-[#fff0ee]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#291715] truncate">{item.name}</p>
                    <p className="text-[10px] text-[#5e3f3b]/60">
                      Qty {item.qty}
                      {item.variant?.size ? ` Â· ${item.variant.size}` : ''}
                      {item.variant?.color ? ` Â· ${item.variant.color}` : ''}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#291715] shrink-0">₹{(item.price * item.qty).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-[#fff8f7] rounded-xl p-4 space-y-1.5 text-xs">
            <div className="flex justify-between text-[#5e3f3b]">
              <span>Subtotal</span><span>₹{order.subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-[#5e3f3b]">
              <span>Delivery</span><span>{order.deliveryCharge === 0 ? 'Free' : `₹${order.deliveryCharge.toLocaleString('en-IN')}`}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span><span>âˆ’₹{order.discount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-[#291715] pt-1.5 border-t border-[#e8bcb7]/20">
              <span>Total</span><span>₹{order.total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Address & Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-2 flex items-center gap-1.5">
                <MapPin size={13} /> Delivery Address
              </h4>
              {(() => {
                const addr = order.addressSnapshot || (order as any).shippingAddress || {};
                return (
                  <>
                    <p className="text-xs font-semibold text-[#291715]">{addr.fullName || 'N/A'}</p>
                    <p className="text-[11px] text-[#5e3f3b] leading-relaxed mt-0.5">
                      {addr.line1 || ''}{addr.line2 ? `, ${addr.line2}` : ''}<br />
                      {addr.city || ''}, {addr.state || ''} - {addr.pincode || ''}
                    </p>
                    <p className="text-[11px] text-[#5e3f3b]/70 mt-1">Phone: {addr.phone || 'N/A'}</p>
                  </>
                );
              })()}
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-2 flex items-center gap-1.5">
                <CreditCard size={13} /> Payment
              </h4>
              <p className="text-xs text-[#291715]">
                Method: <span className="font-semibold">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay'}</span>
              </p>
              <p className="text-xs text-[#291715] mt-1">
                Status: <span className="font-semibold capitalize">{order.paymentStatus}</span>
              </p>
              {order.razorpayPaymentId && (
                <p className="text-[10px] font-mono text-[#5e3f3b]/60 mt-1 break-all">{order.razorpayPaymentId}</p>
              )}
            </div>
          </div>

          {/* Tracking note */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-2 block">Tracking Note (visible to customer)</label>
            <div className="flex gap-2">
              <input
                value={trackingNote}
                onChange={(e) => setTrackingNote(e.target.value)}
                placeholder="e.g. Shipped via BlueDart, AWB 123456"
                className="flex-1 bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={saveTrackingNoteOnly}
                disabled={saving}
                className="bg-[#fff0ee] text-primary text-xs font-bold px-4 rounded-xl hover:bg-[#ffe4df] transition-colors cursor-pointer disabled:opacity-60"
              >
                Save
              </button>
            </div>
          </div>

          {/* Status actions */}
          {nextOptions.length > 0 && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-2 block">Update Status</label>
              <div className="flex flex-wrap gap-2">
                {nextOptions.map((status) => (
                  <button
                    key={status}
                    onClick={() => (status === 'cancelled' ? setPendingStatus('cancelled') : applyStatus(status))}
                    disabled={saving}
                    className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-60 capitalize ${
                      status === 'cancelled'
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-primary text-white hover:bg-[#9a000e]'
                    }`}
                  >
                    Mark as {status}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={pendingStatus === 'cancelled'}
        title="Cancel this order?"
        description="This restores stock for every item in the order and cannot be undone. If the order was already paid, it will be flagged for refund."
        confirmLabel="Cancel Order"
        loading={saving}
        onConfirm={() => applyStatus('cancelled')}
        onCancel={() => setPendingStatus(null)}
      />
    </div>
  );
}

export default function AdminOrders({ onToast }: AdminOrdersProps) {
  const { orders, loading, error } = useAdminOrders();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<FirestoreOrder | null>(null);

  const filtered = useMemo(() => {
    let result = orders;
    if (filter !== 'all') result = result.filter((o) => o.orderStatus === filter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (o) => o.id.toLowerCase().includes(q) || (o.addressSnapshot?.fullName || (o as any).shippingAddress?.fullName)?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, filter, query]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return <LoadingBlock label="Loading ordersâ€¦" />;
  if (error) return <ErrorBlock message={error} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex overflow-x-auto hide-scrollbar gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer capitalize ${
                filter === f
                  ? 'bg-primary text-white shadow shadow-primary/20'
                  : 'bg-white border border-[#e8bcb7]/20 text-[#5e3f3b] hover:border-primary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5e3f3b]/40" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search order ID or customer"
            className="w-full h-10 bg-white border border-[#e8bcb7]/20 rounded-xl pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Package} title="No orders found" description="Orders placed by customers will show up here in real time." />
      ) : (
        <div className="bg-white rounded-2xl border border-[#e8bcb7]/20 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-[#5e3f3b]/50 border-b border-[#e8bcb7]/15">
                  <th className="px-5 py-3.5 font-bold">Order</th>
                  <th className="px-5 py-3.5 font-bold">Customer</th>
                  <th className="px-5 py-3.5 font-bold">Date</th>
                  <th className="px-5 py-3.5 font-bold">Items</th>
                  <th className="px-5 py-3.5 font-bold">Payment</th>
                  <th className="px-5 py-3.5 font-bold">Total</th>
                  <th className="px-5 py-3.5 font-bold">Status</th>
                  <th className="px-5 py-3.5 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8bcb7]/10">
                {paged.map((o) => (
                  <tr key={o.id} className="hover:bg-[#fff8f7] transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-[#291715]">{o.id.slice(0, 10)}</td>
                    <td className="px-5 py-3.5 text-[#291715] font-medium">{o.addressSnapshot?.fullName || (o as any).shippingAddress?.fullName || '—'}</td>
                    <td className="px-5 py-3.5 text-[#5e3f3b]/70 text-xs">
                      {o.createdAt?.toDate?.() ? o.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-[#5e3f3b]/70 text-xs">{o.items.reduce((a, i) => a + i.qty, 0)}</td>
                    <td className="px-5 py-3.5 text-[#5e3f3b]/70 text-xs">{o.paymentMethod === 'cod' ? 'COD' : 'Razorpay'}</td>
                    <td className="px-5 py-3.5 font-bold text-[#291715]">₹{o.total.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[o.orderStatus]}`}>
                        {o.orderStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="w-8 h-8 rounded-lg hover:bg-[#fff0ee] text-[#5e3f3b] inline-flex items-center justify-center cursor-pointer"
                        aria-label="View order"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
        </div>
      )}

      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onToast={onToast} />
      )}
    </div>
  );
}


