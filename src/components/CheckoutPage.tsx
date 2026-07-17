import React, { useState, useMemo, useEffect } from 'react';
import { MapPin, Tag, CheckCircle2, Wallet, Smartphone, Loader2, ChevronLeft, AlertTriangle, Plus, Minus } from 'lucide-react';
import type { CartItem } from '../types';
import type { Address, PaymentMethod } from '../types/firestore';
import AddressBook from './AddressBook';
import { useAuth } from '../context/AuthContext';
import {
  cartItemsToLines,
  createRazorpayOrder,
  verifyPayment,
  placeCodOrder,
  validateCouponRemote,
  describeCheckoutError,
} from '../lib/services/checkout';
import { openRazorpayCheckout } from '../lib/razorpayCheckout';

interface CheckoutPageProps {
  uid: string;
  cartItems: CartItem[];
  addresses: Address[];
  deliveryCharge: number;
  freeDeliveryThreshold: number;
  onOrderPlaced: (orderId: string) => Promise<void> | void;
  onBack: () => void;
  onToast: (message: string, type?: 'success' | 'info') => void;
  onUpdateQuantity: (productId: string, quantity: number, color?: string, size?: string) => void;
  onRemoveItem: (productId: string, color?: string, size?: string) => void;
  isFiveMinActive?: boolean;
  fiveMinMinOrderValue?: number;
}

type Stage = 'idle' | 'validating-coupon' | 'creating-payment' | 'awaiting-payment' | 'verifying' | 'placing-cod';

export default function CheckoutPage({
  uid,
  cartItems,
  addresses,
  deliveryCharge,
  freeDeliveryThreshold,
  onOrderPlaced,
  onBack,
  onToast,
  onUpdateQuantity,
  onRemoveItem,
  isFiveMinActive = false,
  fiveMinMinOrderValue = 0,
}: CheckoutPageProps) {
  const { user } = useAuth();
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0] || null;
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(defaultAddress?.id ?? null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [stage, setStage] = useState<Stage>('idle');
  const [checkoutError, setCheckoutError] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Auto-scroll to top of viewport on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Auto-select address when addresses load or update
  useEffect(() => {
    if (addresses.length > 0) {
      if (!selectedAddressId || !addresses.some((a) => a.id === selectedAddressId)) {
        const def = addresses.find((a) => a.isDefault) || addresses[0];
        setSelectedAddressId(def.id);
      }
    } else {
      setSelectedAddressId(null);
    }
  }, [addresses, selectedAddressId]);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || null;
  const busy = stage !== 'idle';

  // Client-side numbers are a PREVIEW ONLY, for a responsive UI. The Cloud
  // Functions (createRazorpayOrder / placeOrder) recompute every figure from
  // live Firestore data before anything is charged or an order is created —
  // this component never sends a price to the server, only productId + qty.
  const subtotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0),
    [cartItems]
  );
  const isBelowFiveMinLimit = !!isFiveMinActive && subtotal < (fiveMinMinOrderValue || 0);
  const totalQty = useMemo(() => cartItems.reduce((acc, item) => acc + item.quantity, 0), [cartItems]);
  const computedDeliveryCharge = totalQty * deliveryCharge;
  const discount = appliedCoupon?.discountAmount ?? 0;
  const total = Math.max(0, subtotal + computedDeliveryCharge - discount);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const code = couponCode.trim();
    if (!code) return;
    setStage('validating-coupon');
    try {
      const result = await validateCouponRemote(code, subtotal);
      if (!result.valid) {
        setCouponError(result.error || 'Invalid coupon code.');
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({ code: result.code || code.toUpperCase(), discountAmount: result.discountAmount });
        onToast(`Coupon ${result.code || code.toUpperCase()} applied!`);
      }
    } catch (err) {
      setCouponError(describeCheckoutError(err));
      setAppliedCoupon(null);
    } finally {
      setStage('idle');
    }
  };

  const resetPaymentState = () => {
    setStage('idle');
  };

  const handlePlaceOrder = async () => {
    setCheckoutError('');
    if (!selectedAddress) {
      onToast('Please select a delivery address.', 'info');
      return;
    }
    if (cartItems.length === 0) {
      onToast('Your cart is empty.', 'info');
      return;
    }

    const lines = cartItemsToLines(cartItems);

    if (paymentMethod === 'cod') {
      setStage('placing-cod');
      try {
        const { orderId } = await placeCodOrder(lines, selectedAddress.id, appliedCoupon?.code);
        await onOrderPlaced(orderId);
      } catch (err) {
        setCheckoutError(describeCheckoutError(err));
        onToast('Could not place your order. Please try again.', 'info');
      } finally {
        resetPaymentState();
      }
      return;
    }

    // Razorpay flow: create a server-side order + checkout session, open the
    // Razorpay modal, then hand the payment IDs back to verifyPayment â€” which
    // is the only place a payment is ever trusted as real.
    setStage('creating-payment');
    try {
      const session = await createRazorpayOrder(lines, selectedAddress.id, appliedCoupon?.code);
      setStage('awaiting-payment');

      await openRazorpayCheckout({
        keyId: session.keyId,
        amount: session.amount,
        currency: session.currency,
        razorpayOrderId: session.razorpayOrderId,
        name: 'PurnimaCart',
        description: `Order for ${cartItems.length} item(s)`,
        prefillName: user?.displayName || undefined,
        prefillEmail: user?.email || undefined,
        onSuccess: async (response) => {
          setStage('verifying');
          try {
            const result = await verifyPayment(
              session.checkoutSessionId,
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            await onOrderPlaced(result.orderId);
          } catch (err) {
            setCheckoutError(describeCheckoutError(err));
            onToast('Payment verification failed. Please contact support if you were charged.', 'info');
          } finally {
            resetPaymentState();
          }
        },
        onDismiss: () => {
          setCheckoutError('Payment was cancelled or did not complete. No charge was made â€” you can try again.');
          resetPaymentState();
        },
      });
    } catch (err) {
      setCheckoutError(describeCheckoutError(err));
      resetPaymentState();
    }
  };

  const buttonLabel = () => {
    switch (stage) {
      case 'creating-payment': return 'Preparing secure paymentâ€¦';
      case 'awaiting-payment': return 'Waiting for paymentâ€¦';
      case 'verifying': return 'Verifying paymentâ€¦';
      case 'placing-cod': return 'Placing orderâ€¦';
      default: return 'Place Order';
    }
  };

  return (
    <div className="space-y-6 min-h-[60vh]">
      {/* Visual Step Progress Header */}
      <div className="bg-white border border-gray-250/60 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (step > 1) {
                setStep((prev) => (prev - 1) as 1 | 2 | 3);
              } else {
                onBack();
              }
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-200 hover:border-primary hover:text-primary transition-colors cursor-pointer"
            title="Go back"
          >
            <ChevronLeft size={16} />
          </button>
          <h1 className="font-sans font-extrabold text-base sm:text-lg text-gray-900">
            {step === 1 && 'Delivery Address'}
            {step === 2 && 'Order Summary'}
            {step === 3 && 'Payment Options'}
          </h1>
        </div>

        {/* Progress Timeline */}
        <div className="relative max-w-md mx-auto pt-3 pb-1">
          {/* Connecting Lines */}
          <div className="absolute top-[21px] left-[12%] w-[38%] h-[2px] bg-gray-200 -z-0">
            <div className={`h-full bg-blue-600 transition-all duration-300 ${step > 1 ? 'w-full' : 'w-0'}`} />
          </div>
          <div className="absolute top-[21px] right-[12%] w-[38%] h-[2px] bg-gray-200 -z-0">
            <div className={`h-full bg-blue-600 transition-all duration-300 ${step > 2 ? 'w-full' : 'w-0'}`} />
          </div>

          <div className="flex justify-between items-center relative z-10">
            {/* Step 1: Address */}
            <button
              onClick={() => {
                if (selectedAddress) setStep(1);
              }}
              disabled={busy}
              className="flex flex-col items-center gap-1 focus:outline-none cursor-pointer"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center border text-[11px] font-bold transition-all duration-300 ${
                  step > 1
                    ? 'border-blue-600 bg-white text-blue-600'
                    : step === 1
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'border-gray-300 bg-white text-gray-400'
                }`}
              >
                {step > 1 ? <CheckCircle2 size={13} className="text-blue-600" /> : '1'}
              </div>
              <span
                className={`text-[10px] font-bold transition-colors ${
                  step === 1 ? 'text-gray-900 font-extrabold' : 'text-gray-400 font-medium'
                }`}
              >
                Address
              </span>
            </button>

            {/* Step 2: Order Summary */}
            <button
              onClick={() => {
                if (selectedAddress) setStep(2);
              }}
              disabled={busy || !selectedAddress}
              className="flex flex-col items-center gap-1 focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center border text-[11px] font-bold transition-all duration-300 ${
                  step > 2
                    ? 'border-blue-600 bg-white text-blue-600'
                    : step === 2
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'border-gray-300 bg-white text-gray-400'
                }`}
              >
                {step > 2 ? <CheckCircle2 size={13} className="text-blue-600" /> : '2'}
              </div>
              <span
                className={`text-[10px] font-bold transition-colors ${
                  step === 2 ? 'text-gray-900 font-extrabold' : 'text-gray-400 font-medium'
                }`}
              >
                Order Summary
              </span>
            </button>

            {/* Step 3: Payment */}
            <button
              onClick={() => {
                if (selectedAddress && cartItems.length > 0) setStep(3);
              }}
              disabled={busy || !selectedAddress || cartItems.length === 0}
              className="flex flex-col items-center gap-1 focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center border text-[11px] font-bold transition-all duration-300 ${
                  step === 3
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'border-gray-350 bg-white text-gray-400'
                }`}
              >
                3
              </div>
              <span
                className={`text-[10px] font-bold transition-colors ${
                  step === 3 ? 'text-gray-900 font-extrabold' : 'text-gray-400 font-medium'
                }`}
              >
                Payment
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          {/* Address selection */}
          {step === 1 && (
            <section className="bg-white border border-gray-200 rounded-sm p-4 space-y-4">
              <h2 className="font-sans font-bold text-base text-gray-900 flex items-center gap-2">
                <MapPin size={18} className="text-primary" /> Delivery Address
              </h2>
              <AddressBook
                uid={uid}
                addresses={addresses}
                selectable
                selectedId={selectedAddressId}
                onSelect={(a) => setSelectedAddressId(a.id)}
                onToast={onToast}
              />
            </section>
          )}

          {/* Order summary / products */}
          {step === 2 && (
            <section className="bg-white border border-gray-200 rounded-sm p-4 space-y-4">
              <h2 className="font-sans font-bold text-base text-gray-900">Order Summary</h2>
              <div className="divide-y divide-gray-150">
                {cartItems.length === 0 ? (
                  <div className="text-center py-8 space-y-3">
                    <p className="text-sm text-gray-500 font-semibold">Your cart is empty.</p>
                    <button
                      type="button"
                      onClick={onBack}
                      className="text-xs bg-primary text-white font-bold px-4 py-2 rounded-sm cursor-pointer hover:bg-primary-hover active:scale-95 transition-all"
                    >
                      Go Back to Shop
                    </button>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div
                      key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}`}
                      className="flex gap-4 py-4 first:pt-0 last:pb-0"
                    >
                      <img src={item.product.image} alt={item.product.name} className="w-14 h-14 rounded-sm object-contain bg-gray-50 border border-gray-100 p-1" />
                      <div className="flex-grow min-w-0">
                        <h3 className="font-semibold text-xs text-gray-900 truncate">{item.product.name}</h3>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Style: {item.selectedColor || 'Classic'} · Size: {item.selectedSize || 'Standard'}
                        </p>
                        <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 overflow-hidden w-fit mt-1.5">
                          <button
                            onClick={() => {
                              if (item.quantity <= 1) {
                                onRemoveItem(item.product.id, item.selectedColor, item.selectedSize);
                              } else {
                                onUpdateQuantity(item.product.id, item.quantity - 1, item.selectedColor, item.selectedSize);
                              }
                            }}
                            disabled={busy}
                            className="px-2 py-1 text-xs text-gray-500 hover:text-primary hover:bg-gray-100 font-bold disabled:opacity-50 cursor-pointer"
                            title={item.quantity <= 1 ? "Remove item" : "Decrease quantity"}
                          >
                            <Minus size={10} />
                          </button>
                          <span className="px-3 text-xs font-bold text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => {
                              onUpdateQuantity(item.product.id, item.quantity + 1, item.selectedColor, item.selectedSize);
                            }}
                            disabled={busy}
                            className="px-2 py-1 text-xs text-gray-500 hover:text-primary hover:bg-gray-100 font-bold disabled:opacity-50 cursor-pointer"
                            title="Increase quantity"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-gray-900 shrink-0">
                        ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {/* Payment method */}
          {step === 3 && (
            <div className="space-y-6">
              <section className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="font-sans font-bold text-lg text-gray-900">Choose Payment Option</h2>
                    <p className="text-xs text-gray-500 mt-1">Select your preferred way to pay</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-100 uppercase tracking-wider">
                    🔒 256-bit Secure
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Option 1: Razorpay / Online */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('razorpay')}
                    disabled={busy}
                    className={`group p-6 rounded-2xl border text-left transition-all duration-300 relative flex flex-col justify-between h-40 cursor-pointer ${
                      paymentMethod === 'razorpay'
                        ? 'border-blue-600 bg-blue-50/20 ring-2 ring-blue-600/10 shadow-md'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600 transition-colors group-hover:bg-blue-600/20">
                        <Smartphone size={20} />
                      </div>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        Popular
                      </span>
                    </div>

                    <div className="mt-4">
                      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                        Pay Online
                        {paymentMethod === 'razorpay' && <CheckCircle2 size={15} className="text-blue-600 shrink-0" />}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                        UPI, Google Pay, Credit/Debit Cards, Net Banking
                      </p>
                    </div>
                  </button>

                  {/* Option 2: Cash on Delivery */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    disabled={busy}
                    className={`group p-6 rounded-2xl border text-left transition-all duration-300 relative flex flex-col justify-between h-40 cursor-pointer ${
                      paymentMethod === 'cod'
                        ? 'border-amber-600 bg-amber-50/10 ring-2 ring-amber-600/10 shadow-md'
                        : 'border-gray-200 bg-white hover:border-amber-300 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="w-10 h-10 rounded-xl bg-amber-600/10 flex items-center justify-center text-amber-600 transition-colors group-hover:bg-amber-600/20">
                        <Wallet size={20} />
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                        Cash on Delivery
                        {paymentMethod === 'cod' && <CheckCircle2 size={15} className="text-amber-600 shrink-0" />}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                        Pay with cash or scan UPI code when order is delivered
                      </p>
                    </div>
                  </button>
                </div>

                {/* Secure Payment note */}
                <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4 flex gap-3 items-start">
                  <div className="text-base mt-0.5">ℹ️</div>
                  <div className="text-[11px] text-gray-600 leading-relaxed">
                    {paymentMethod === 'razorpay' ? (
                      <span>
                        You will pay <strong>₹{total.toLocaleString('en-IN')}</strong> securely using Razorpay's checkout popup. Once verified, your order will be confirmed instantly.
                      </span>
                    ) : (
                      <span>
                        Place your order now and pay <strong>₹{total.toLocaleString('en-IN')}</strong> on delivery. Safe, zero-contact payment options are available upon delivery.
                      </span>
                    )}
                  </div>
                </div>
              </section>

              {checkoutError && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl px-5 py-4">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <span>{checkoutError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Price breakdown */}
        <div className="bg-white border border-gray-200 rounded-sm p-6 space-y-4 sticky top-24 shadow-sm">
          <h2 className="font-sans font-bold text-sm text-gray-500 uppercase tracking-wider border-b border-gray-150 pb-2">Price Details</h2>

          {!appliedCoupon ? (
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  placeholder="ENTER COUPON CODE"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={busy}
                  className="w-full bg-gray-50 border border-gray-250 rounded-sm py-2 pl-8 pr-4 text-xs font-semibold uppercase outline-none focus:ring-1 focus:ring-primary text-gray-900 disabled:opacity-60"
                />
              </div>
              <button
                type="submit"
                disabled={busy || stage === 'validating-coupon'}
                className="bg-gray-100 hover:bg-primary hover:text-white text-gray-800 font-bold text-xs px-4 rounded-sm transition-all cursor-pointer active:scale-95 disabled:opacity-60"
              >
                {stage === 'validating-coupon' ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between bg-green-500/10 border border-green-500/25 p-3 rounded-sm text-green-800">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 size={16} className="text-green-600" />
                <span>Coupon <strong>{appliedCoupon.code}</strong> applied</span>
              </div>
              <button
                onClick={() => { setAppliedCoupon(null); setCouponCode(''); }}
                disabled={busy}
                className="text-green-700 hover:text-red-600 text-xs font-bold cursor-pointer disabled:opacity-60"
              >
                Remove
              </button>
            </div>
          )}
          {couponError && <p className="text-[10px] font-bold text-red-600">{couponError}</p>}

          <div className="space-y-2 text-xs text-gray-500 pt-2">
            <div className="flex justify-between">
              <span>Price ({totalQty} item{totalQty > 1 ? 's' : ''})</span>
              <span className="font-semibold text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Charges</span>
              <span className="font-semibold text-gray-900">
                {computedDeliveryCharge === 0 ? 'FREE' : `₹${computedDeliveryCharge.toLocaleString('en-IN')}`}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600 font-semibold">
                <span>Coupon Discount</span>
                <span>-₹{discount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-gray-900 pt-3 border-t border-gray-200">
              <span>Total Amount</span>
              <span className="text-gray-900 text-base font-black">₹{total.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-[9px] text-gray-400 pt-1 leading-normal">
              Final amount is recalculated securely on our server before anything is charged.
            </p>
          </div>

          {isBelowFiveMinLimit && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-sm text-xs font-semibold flex items-start gap-2">
              <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold">!</span>
              <span>
                Minimum order of ₹{(fiveMinMinOrderValue || 0).toLocaleString()} is required for 5-Minute Delivery. Add ₹{((fiveMinMinOrderValue || 0) - subtotal).toLocaleString()} more to place this order.
              </span>
            </div>
          )}

          {step === 1 && (
            <button
              type="button"
              onClick={() => {
                if (selectedAddress) setStep(2);
              }}
              disabled={!selectedAddress || isBelowFiveMinLimit}
              className="w-full bg-[#fb641b] hover:bg-[#e0540d] text-white py-4 rounded-sm font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-60 uppercase disabled:cursor-not-allowed"
            >
              Confirm Address
            </button>
          )}

          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={cartItems.length === 0 || isBelowFiveMinLimit}
              className="w-full bg-[#fb641b] hover:bg-[#e0540d] text-white py-4 rounded-sm font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-60 uppercase disabled:cursor-not-allowed"
            >
              Proceed to Payment
            </button>
          )}

          {step === 3 && (
            <button
              onClick={handlePlaceOrder}
              disabled={busy || cartItems.length === 0 || !selectedAddress || isBelowFiveMinLimit}
              className="w-full bg-[#fb641b] hover:bg-[#e0540d] text-white py-4 rounded-sm font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-60 uppercase disabled:cursor-not-allowed"
            >
              {busy ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> {buttonLabel()}
                </>
              ) : (
                buttonLabel()
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}



