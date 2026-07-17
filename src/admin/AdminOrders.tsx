import React, { useMemo, useState } from 'react';
import { Search, Eye, X, MapPin, Package, CreditCard, PackageX, AlertTriangle } from 'lucide-react';
import type { FirestoreOrder, OrderStatus } from '../types/firestore';
import { useAdminOrders } from './hooks/useAdminOrders';
import { updateOrderStatusAdmin, handleCancelRequestAdmin } from '../lib/services/orders';
import { LoadingBlock, ErrorBlock, EmptyState } from './components/LoadingState';
import ConfirmDialog from './components/ConfirmDialog';
import Pagination from './components/Pagination';

const FILTERS: (OrderStatus | 'all' | 'cancel_requested')[] = ['all', 'pending', 'packed', 'shipped', 'delivered', 'cancelled', 'cancel_requested'];
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
  
  const [shippedDate, setShippedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });

  const [rejectReason, setRejectReason] = useState('');
  const [showRejectPrompt, setShowRejectPrompt] = useState(false);
  const [showCancelAcceptPrompt, setShowCancelAcceptPrompt] = useState(false);

  const nextOptions = NEXT_STATUSES[order.orderStatus];

  const applyStatus = async (status: OrderStatus) => {
    setSaving(true);
    try {
      await updateOrderStatusAdmin(order.id, status, trackingNote);
      onToast(status === 'cancelled' ? 'Order cancelled — stock restored.' : `Order marked as ${status}.`);
      onClose();
    } catch (error: any) {
      console.error(error);
      onToast(error.message || 'Could not update order status.', 'info');
    } finally {
      setSaving(false);
      setPendingStatus(null);
    }
  };

  const applyStatusWithDates = async (status: OrderStatus) => {
    if (!shippedDate || !deliveryDate) {
      onToast('Please fill in both Shipped and Estimated Delivery dates.', 'info');
      return;
    }
    setSaving(true);
    try {
      await updateOrderStatusAdmin(order.id, status, trackingNote, shippedDate, deliveryDate);
      onToast(`Order marked as ${status}.`);
      onClose();
    } catch (error: any) {
      console.error(error);
      onToast(error.message || 'Could not update order status.', 'info');
    } finally {
      setSaving(false);
      setPendingStatus(null);
    }
  };

  const handleCancelRequest = async (accept: boolean) => {
    setSaving(true);
    try {
      await handleCancelRequestAdmin(order.id, accept, accept ? undefined : rejectReason.trim());
      onToast(accept ? 'Order cancellation request accepted.' : 'Order cancellation request rejected.');
      onClose();
    } catch (error: any) {
      console.error(error);
      onToast(error.message || 'Could not process cancellation request.', 'info');
    } finally {
      setSaving(false);
      setShowCancelAcceptPrompt(false);
      setShowRejectPrompt(false);
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
          {/* Cancellation Request Section */}
          {order.cancelRequested && order.cancelRequestStatus === 'pending' && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 space-y-4 animate-[fadeIn_0.15s_ease-out]">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-100/70 text-rose-700 rounded-xl mt-0.5 shrink-0">
                  <PackageX size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider">Cancellation Requested</h4>
                  <p className="text-xs text-rose-700 leading-relaxed">
                    Reason: <span className="font-semibold italic">"{order.cancelReason}"</span>
                  </p>
                  {order.cancelRequestedAt && (
                    <p className="text-[10px] text-rose-500/80">
                      Requested on: {order.cancelRequestedAt.toDate ? order.cancelRequestedAt.toDate().toLocaleString('en-IN') : String(order.cancelRequestedAt)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-1">
                <button
                  onClick={() => setShowRejectPrompt(true)}
                  disabled={saving}
                  className="bg-white border border-rose-200 text-rose-700 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-rose-100/50 transition-colors cursor-pointer disabled:opacity-60"
                >
                  Reject Request
                </button>
                <button
                  onClick={() => setShowCancelAcceptPrompt(true)}
                  disabled={saving}
                  className="bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-rose-700 transition-colors cursor-pointer disabled:opacity-60"
                >
                  Accept & Cancel Order
                </button>
              </div>
            </div>
          )}

          {order.cancelRequested && order.cancelRequestStatus === 'rejected' && (
            <div className="bg-gray-50 border border-gray-200/60 rounded-2xl p-4 flex items-start gap-3 animate-[fadeIn_0.15s_ease-out]">
              <div className="p-2 bg-gray-200/50 text-gray-500 rounded-xl mt-0.5 shrink-0">
                <Package size={16} />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Cancellation Request Declined</h4>
                <p className="text-xs text-gray-600">
                  Reason: <span className="font-semibold italic">"{order.cancelReason}"</span>
                </p>
                {order.cancelRejectReason && (
                  <p className="text-xs text-gray-600 mt-1">
                    Declined reason: <span className="font-semibold">"{order.cancelRejectReason}"</span>
                  </p>
                )}
              </div>
            </div>
          )}

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
                    <p className="text-xs font-semibold text-[#291715]">{item.name}</p>
                    <p className="text-[10px] text-[#5e3f3b]/60">
                      Qty {item.qty}
                      {(item.selectedSize || item.variant?.size) ? ` · ${item.selectedSize || item.variant?.size}` : ''}
                      {(item.selectedColor || item.variant?.color) ? ` · ${item.selectedColor || item.variant?.color}` : ''}
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
                    onClick={() =>
                      status === 'cancelled'
                        ? setPendingStatus('cancelled')
                        : status === 'packed'
                        ? setPendingStatus('packed')
                        : applyStatus(status)
                    }
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

      {pendingStatus === 'packed' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 animate-[fadeIn_0.15s_ease-out]" onClick={() => setPendingStatus(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-[slideUp_0.2s_ease-out] space-y-4">
            <button
              onClick={() => setPendingStatus(null)}
              className="absolute top-4 right-4 text-[#5e3f3b]/50 hover:text-primary cursor-pointer"
              aria-label="Close"
            >
              <X size={16} />
            </button>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
              <Package size={19} />
            </div>
            <h3 className="font-display font-bold text-base text-[#291715]">Confirm & Pack Order</h3>
            <p className="text-xs text-[#5e3f3b]/70 leading-relaxed">
              To confirm this order and mark it as Packed, please specify the expected shipped and estimated delivery dates:
            </p>
            
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#5e3f3b]/60 mb-1.5 block">
                  Expected Shipped Date
                </label>
                <input
                  type="date"
                  required
                  value={shippedDate}
                  onChange={(e) => setShippedDate(e.target.value)}
                  className="w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary text-[#291715]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#5e3f3b]/60 mb-1.5 block">
                  Expected Delivery Date
                </label>
                <input
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary text-[#291715]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setPendingStatus(null)}
                disabled={saving}
                className="flex-1 bg-[#fff0ee] text-[#5e3f3b] text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#ffe4df] transition-colors cursor-pointer disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={() => applyStatusWithDates('packed')}
                disabled={saving || !shippedDate || !deliveryDate}
                className="flex-1 bg-primary hover:bg-[#9a000e] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-60 font-semibold"
              >
                {saving ? 'Please wait…' : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showCancelAcceptPrompt}
        title="Accept Cancellation Request?"
        description="This will accept the cancellation request, mark the order as cancelled, restore stock for all items, and flag payment for refund if already paid."
        confirmLabel="Accept Cancellation"
        loading={saving}
        onConfirm={() => handleCancelRequest(true)}
        onCancel={() => setShowCancelAcceptPrompt(false)}
      />

      {showRejectPrompt && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]" onClick={() => setShowRejectPrompt(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-[slideUp_0.2s_ease-out] border border-[#e8bcb7]/20 space-y-4">
            <div className="flex items-center justify-between border-b border-[#e8bcb7]/15 pb-3">
              <h3 className="font-display font-bold text-sm text-[#291715]">Reject Cancellation Request</h3>
              <button
                onClick={() => setShowRejectPrompt(false)}
                className="text-[#5e3f3b]/50 hover:text-primary cursor-pointer"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="space-y-3">
              <p className="text-xs text-[#5e3f3b]/70">
                Are you sure you want to decline this cancellation request? You can optionally provide a reason for the customer.
              </p>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wide text-[#5e3f3b]/60">Rejection Reason (Optional)</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g., Order has already been packaged and handed over to courier."
                  rows={3}
                  className="w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl p-3 text-xs outline-none focus:ring-1 focus:ring-primary text-[#291715]"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowRejectPrompt(false)}
                disabled={saving}
                className="flex-grow bg-[#fff0ee] text-[#5e3f3b] text-xs font-bold py-2.5 rounded-xl hover:bg-[#ffe4df] transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCancelRequest(false)}
                disabled={saving}
                className="flex-grow bg-primary text-white text-xs font-bold py-2.5 rounded-xl hover:bg-[#9a000e] transition-colors cursor-pointer disabled:opacity-60 text-center"
              >
                {saving ? 'Rejecting...' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}
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
    if (filter === 'cancel_requested') {
      result = result.filter((o) => o.cancelRequested && o.cancelRequestStatus === 'pending');
    } else if (filter !== 'all') {
      result = result.filter((o) => o.orderStatus === filter);
    }
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
              {f === 'cancel_requested' ? 'Cancel Requests' : f}
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
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[o.orderStatus]}`}>
                          {o.orderStatus}
                        </span>
                        {o.cancelRequested && o.cancelRequestStatus === 'pending' && (
                          <span className="text-[9px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md leading-none tracking-wide uppercase shrink-0">
                            Cancel Req
                          </span>
                        )}
                      </div>
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


