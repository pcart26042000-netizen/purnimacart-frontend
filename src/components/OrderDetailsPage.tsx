import React, { useEffect, useState } from 'react';
import { ChevronLeft, MapPin, CreditCard, Truck, PackageCheck, PackageX, Clock, Info, X, AlertTriangle } from 'lucide-react';
import type { FirestoreOrder, OrderStatus } from '../types/firestore';
import { getOrderById, requestOrderCancellation } from '../lib/services/orders';

interface OrderDetailsPageProps {
  orderId: string;
  onBack: () => void;
}

const TIMELINE_STEPS: OrderStatus[] = ['pending', 'packed', 'shipped', 'delivered'];

const STEP_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function formatTimelineDate(dateStr?: string) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
  return dateStr;
}

export default function OrderDetailsPage({ orderId, onBack }: OrderDetailsPageProps) {
  const [order, setOrder] = useState<FirestoreOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Ordered by mistake');
  const [customReason, setCustomReason] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCancel(true);
    setCancelError(null);
    const finalReason = cancelReason === 'Other' ? customReason.trim() : cancelReason;
    if (cancelReason === 'Other' && !finalReason) {
      setCancelError('Please specify a cancellation reason.');
      setSubmittingCancel(false);
      return;
    }
    try {
      await requestOrderCancellation(orderId, finalReason);
      if (order) {
        setOrder({
          ...order,
          cancelRequested: true,
          cancelReason: finalReason,
          cancelRequestStatus: 'pending',
          cancelRequestedAt: { toDate: () => new Date() } as any,
        });
      }
      setShowCancelModal(false);
    } catch (err: any) {
      setCancelError(err.message || 'Failed to submit cancellation request.');
    } finally {
      setSubmittingCancel(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getOrderById(orderId)
      .then((data) => {
        if (!cancelled) setOrder(data);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError('Could not load this order right now.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-xs font-semibold text-[#5e3f3b]/60">Loading order details…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <p className="text-xs font-semibold text-red-600">{error || 'Order not found.'}</p>
        <button onClick={onBack} className="text-xs font-bold text-primary hover:underline cursor-pointer">
          Back to Orders
        </button>
      </div>
    );
  }

  const isCancelled = order.orderStatus === 'cancelled';
  const currentStepIndex = TIMELINE_STEPS.indexOf(order.orderStatus as OrderStatus);
  const address = order.addressSnapshot || (order as any).shippingAddress || {};
  const createdDate = order.createdAt?.toDate?.()
    ? order.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="space-y-8 min-h-[60vh]">
      <div className="border-b border-[#e8bcb7]/20 pb-6 flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-[#e8bcb7]/20 hover:border-primary hover:text-primary transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
        </button>
        <div>
          <h1 className="font-display font-bold text-2xl text-[#291715]">Order #{order.id.slice(0, 10)}</h1>
          <p className="text-xs text-[#5e3f3b] mt-1">Placed on {createdDate}</p>
        </div>
      </div>

      {/* Timeline */}
      <section className="bg-white border border-[#e8bcb7]/20 rounded-3xl p-6">
        {isCancelled ? (
          <div className="flex items-center gap-3 text-red-600">
            <PackageX size={20} />
            <span className="text-sm font-bold">This order has been cancelled.</span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            {TIMELINE_STEPS.map((step, idx) => {
              const isDone = idx <= currentStepIndex;
              return (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        isDone ? 'bg-primary text-white' : 'bg-[#fff0ee] text-[#5e3f3b]/40'
                      }`}
                    >
                      {step === 'delivered' ? <PackageCheck size={16} /> : step === 'shipped' ? <Truck size={16} /> : <Clock size={16} />}
                    </div>
                    <span className={`text-[10px] font-bold text-center ${isDone ? 'text-primary' : 'text-[#5e3f3b]/50'}`}>
                      {STEP_LABEL[step]}
                    </span>
                    {step === 'shipped' && order.shippedDate && (
                      <span className="text-[9px] text-[#5e3f3b]/70 font-semibold mt-0.5 whitespace-nowrap">
                        {formatTimelineDate(order.shippedDate)}
                      </span>
                    )}
                    {step === 'delivered' && order.deliveryDate && (
                      <span className="text-[9px] text-[#5e3f3b]/70 font-semibold mt-0.5 whitespace-nowrap">
                        {order.orderStatus === 'delivered' ? 'Delivered: ' : 'Est: '}
                        {formatTimelineDate(order.deliveryDate)}
                      </span>
                    )}
                  </div>
                  {idx < TIMELINE_STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 -mt-6 ${idx < currentStepIndex ? 'bg-primary' : 'bg-[#e8bcb7]/30'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
        {order.trackingNote && (
          <div className="mt-5 flex items-start gap-2 bg-[#fff0ee] p-3 rounded-xl text-xs text-[#5e3f3b]">
            <Info size={14} className="text-primary mt-0.5 shrink-0" />
            <span>{order.trackingNote}</span>
          </div>
        )}
        {order.cancelRequested && (
          <div className={`mt-5 flex items-start gap-2.5 p-4 rounded-xl text-xs ${
            order.cancelRequestStatus === 'pending'
              ? 'bg-amber-50 border border-amber-200/50 text-amber-800'
              : order.cancelRequestStatus === 'rejected'
              ? 'bg-rose-50 border border-rose-200/50 text-rose-800'
              : 'bg-emerald-50 border border-emerald-200/50 text-emerald-800'
          }`}>
            <AlertTriangle size={16} className={`shrink-0 mt-0.5 ${
              order.cancelRequestStatus === 'pending'
                ? 'text-amber-600'
                : order.cancelRequestStatus === 'rejected'
                ? 'text-rose-600'
                : 'text-emerald-600'
            }`} />
            <div>
              <p className="font-bold">
                {order.cancelRequestStatus === 'pending' && 'Cancellation Request Pending'}
                {order.cancelRequestStatus === 'rejected' && 'Cancellation Request Declined'}
                {order.cancelRequestStatus === 'accepted' && 'Cancellation Request Approved'}
              </p>
              <p className="mt-1 text-[11px] opacity-90">
                Reason for cancellation: <span className="italic font-medium">"{order.cancelReason}"</span>
              </p>
              {order.cancelRequestStatus === 'rejected' && order.cancelRejectReason && (
                <p className="mt-1.5 text-[11px] font-bold">
                  Admin response: <span className="font-medium text-rose-700">"{order.cancelRejectReason}"</span>
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          {/* Products */}
          <section className="bg-white border border-[#e8bcb7]/20 rounded-2xl divide-y divide-[#e8bcb7]/10">
            {order.items.map((item, idx) => (
              <div key={`${item.productId}-${idx}`} className="flex gap-4 p-4">
                <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover bg-[#fff8f7]" />
                <div className="flex-grow min-w-0">
                  <h3 className="font-semibold text-sm text-[#291715] truncate">{item.name}</h3>
                  <p className="text-[10px] text-[#5e3f3b]/70 mt-0.5">
                    {(item.selectedColor || item.variant?.color) ? `Style: ${item.selectedColor || item.variant?.color} · ` : ''}
                    {(item.selectedSize || item.variant?.size) ? `Size: ${item.selectedSize || item.variant?.size} · ` : ''}Qty: {item.qty}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-1">7-day return window</p>
                </div>
                <span className="text-sm font-bold text-primary shrink-0">₹{(item.price * item.qty).toLocaleString()}</span>
              </div>
            ))}
          </section>

          {/* Address */}
          <section className="bg-white border border-[#e8bcb7]/20 rounded-2xl p-5 space-y-2">
            <h2 className="font-display font-bold text-sm text-[#291715] flex items-center gap-2">
              <MapPin size={16} className="text-primary" /> Delivery Address
            </h2>
            <p className="text-xs font-bold text-[#291715]">{address.fullName}</p>
            <p className="text-xs text-[#5e3f3b] leading-relaxed">
              {address.line1}{address.line2 ? `, ${address.line2}` : ''}
              {address.landmark ? `, Near ${address.landmark}` : ''}<br />
              {address.city}{address.district ? `, ${address.district}` : ''}, {address.state} - {address.pincode}<br />
              {address.country}
            </p>
            <p className="text-xs text-[#5e3f3b]/70">Phone: {address.phone}</p>
          </section>
        </div>

        {/* Payment / totals */}
        <div className="bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-3xl p-6 space-y-4 sticky top-24">
          <h2 className="font-display font-bold text-sm text-[#291715] flex items-center gap-2">
            <CreditCard size={16} className="text-primary" /> Payment Summary
          </h2>
          <div className="space-y-2 text-xs text-[#5e3f3b]">
            <div className="flex justify-between">
              <span>Payment Method</span>
              <span className="font-bold text-[#291715] capitalize">
                {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Payment Status</span>
              <span className="font-bold text-amber-600 capitalize">{order.paymentStatus}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#e8bcb7]/15">
              <span>Subtotal</span>
              <span className="font-bold text-[#291715]">₹{order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Charge</span>
              <span className="font-bold text-[#291715]">
                {order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge.toLocaleString()}`}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount</span>
                <span>-₹{order.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black text-[#291715] pt-2 border-t border-[#e8bcb7]/15">
              <span>Total</span>
              <span className="text-primary text-base font-bold">₹{order.total.toLocaleString()}</span>
            </div>
          </div>
          {!isCancelled && !order.cancelRequested && (order.orderStatus === 'pending' || order.orderStatus === 'packed') && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="w-full mt-4 bg-white border border-[#e8bcb7]/40 text-[#5e3f3b] hover:text-primary hover:border-primary text-xs font-bold py-3 px-4 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              <PackageX size={15} />
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]" onClick={() => setShowCancelModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 animate-[slideUp_0.2s_ease-out] border border-[#e8bcb7]/20 space-y-5">
            <div className="flex items-center justify-between border-b border-[#e8bcb7]/15 pb-4">
              <h3 className="font-display font-bold text-lg text-[#291715]">Request Cancellation</h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-[#5e3f3b]/50 hover:text-primary cursor-pointer transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <p className="text-xs text-[#5e3f3b]/70">
                Please select a reason for cancelling your order. Your request will be reviewed by our administrator.
              </p>
              
              <div className="space-y-2">
                {[
                  'Ordered by mistake',
                  'Incorrect shipping address',
                  'Found a better price elsewhere',
                  'Item delivery is too late',
                  'Change/Modify items in order',
                  'Other'
                ].map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      cancelReason === reason
                        ? 'border-primary bg-[#fff0ee]/40 text-primary'
                        : 'border-[#e8bcb7]/20 hover:bg-[#fff8f7] text-[#5e3f3b]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cancelReason"
                      value={reason}
                      checked={cancelReason === reason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="accent-primary cursor-pointer"
                    />
                    <span className="text-xs font-semibold">{reason === 'Other' ? 'Other (please specify)' : reason}</span>
                  </label>
                ))}
              </div>
              
              {cancelReason === 'Other' && (
                <div className="space-y-1.5 animate-[fadeIn_0.15s_ease-out]">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-[#5e3f3b]/60">Reason Details</label>
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Describe the reason for cancellation..."
                    rows={3}
                    required
                    className="w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl p-3 text-xs outline-none focus:ring-1 focus:ring-primary text-[#291715] placeholder-[#5e3f3b]/40"
                  />
                </div>
              )}
              
              {cancelError && (
                <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl font-medium">
                  {cancelError}
                </div>
              )}
              
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  disabled={submittingCancel}
                  className="flex-1 bg-[#fff0ee] text-[#5e3f3b] text-xs font-bold py-3 rounded-xl hover:bg-[#ffe4df] transition-colors cursor-pointer disabled:opacity-60 text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCancel}
                  className="flex-1 bg-primary text-white text-xs font-bold py-3 rounded-xl hover:bg-[#9a000e] transition-colors cursor-pointer disabled:opacity-60 text-center"
                >
                  {submittingCancel ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
