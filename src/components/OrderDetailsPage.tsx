import React, { useEffect, useState } from 'react';
import { ChevronLeft, MapPin, CreditCard, Truck, PackageCheck, PackageX, Clock, Info } from 'lucide-react';
import type { FirestoreOrder, OrderStatus } from '../types/firestore';
import { getOrderById } from '../lib/services/orders';

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

export default function OrderDetailsPage({ orderId, onBack }: OrderDetailsPageProps) {
  const [order, setOrder] = useState<FirestoreOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
                    {item.variant?.color ? `Style: ${item.variant.color} · ` : ''}
                    {item.variant?.size ? `Size: ${item.variant.size} · ` : ''}Qty: {item.qty}
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
        </div>
      </div>
    </div>
  );
}
