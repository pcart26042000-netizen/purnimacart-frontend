import React, { useState } from 'react';
import { X, ShoppingBag, Plus, Minus, Trash2, Tag, CheckCircle2, ShoppingCart } from 'lucide-react';
import { CartItem, Product } from '../types';
import { getCouponByCode } from '../lib/services/misc';
import type { FirestoreCoupon } from '../types/firestore';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number, color?: string, size?: string) => void;
  onRemoveItem: (productId: string, color?: string, size?: string) => void;
  onProceedToCheckout: () => void;
  deliveryCharge?: number;
  freeDeliveryThreshold?: number;
}

export default function CartSidebar({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  deliveryCharge = 49,
  freeDeliveryThreshold = 999,
}: CartSidebarProps) {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<FirestoreCoupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');

    const trimmedCode = couponCode.trim();
    if (!trimmedCode) return;

    setCouponLoading(true);
    try {
      const coupon = await getCouponByCode(trimmedCode);
      if (!coupon || !coupon.isActive) {
        setCouponError('Invalid coupon code.');
        return;
      }
      const expiryMs = coupon.expiryDate?.toMillis?.();
      if (expiryMs && expiryMs < Date.now()) {
        setCouponError('This coupon has expired.');
        return;
      }
      if (subtotal < coupon.minOrderValue) {
        setCouponError(`Min spend to apply ${coupon.code} is ₹${coupon.minOrderValue.toLocaleString()}`);
        return;
      }
      setAppliedCoupon(coupon);
      setCouponSuccess(`✓ Coupon ${coupon.code} successfully applied!`);
    } catch (error: any) {
      console.error(error);
      setCouponError('Could not validate coupon right now.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponSuccess('');
    setCouponError('');
  };

  const totalQty = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const deliveryFee = totalQty * deliveryCharge;
  const discountAmount = appliedCoupon
    ? appliedCoupon.type === 'flat'
      ? Math.min(appliedCoupon.value, subtotal)
      : Math.round((subtotal * appliedCoupon.value) / 100)
    : 0;
  const finalTotal = Math.max(0, subtotal + deliveryFee - discountAmount);

  const handleCheckoutClick = () => {
    onClose();
    onProceedToCheckout();
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden font-sans">
      {/* Background Overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500"
      />

      {/* Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full rounded-l-[32px] overflow-hidden border-l border-[#e8bcb7]/30">
          {/* Header */}
          <div className="p-6 bg-[#fff8f7] border-b border-[#e8bcb7]/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="text-primary" size={20} />
              <h2 className="font-display font-bold text-lg text-[#291715]">
                My Shopping Cart ({cartItems.length})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-[#5e3f3b] hover:text-primary p-1.5 rounded-full hover:bg-[#fff0ee] transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar">
            {cartItems.length > 0 ? (
              cartItems.map((item, index) => (
                <div
                  key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}`}
                  className="flex gap-4 p-4 bg-[#fff8f7]/60 border border-[#e8bcb7]/10 rounded-2xl relative group"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-20 h-20 rounded-xl object-cover bg-white"
                  />
                  <div className="flex-grow min-w-0">
                    <span className="text-[10px] uppercase font-bold text-[#5e3f3b]/60">
                      {item.product.category}
                    </span>
                    <h3 className="font-semibold text-sm text-[#291715] truncate pr-6 mt-0.5">
                      {item.product.name}
                    </h3>

                    {/* Style Details label */}
                    <div className="flex gap-2 mt-1 mb-2 text-[10px] text-[#5e3f3b]/80">
                      <span className="bg-white border border-[#e8bcb7]/10 px-1.5 py-0.5 rounded">
                        Style: {item.selectedColor || 'Classic'}
                      </span>
                      <span className="bg-white border border-[#e8bcb7]/10 px-1.5 py-0.5 rounded">
                        Size: {item.selectedSize || 'Standard'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Counter */}
                      <div className="flex items-center border border-[#e8bcb7]/35 rounded-lg bg-white overflow-hidden">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1), item.selectedColor, item.selectedSize)}
                          className="px-2 py-1 text-xs text-[#5e3f3b] hover:text-primary hover:bg-[#fff0ee] font-bold"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="px-3 text-xs font-bold text-[#291715]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1, item.selectedColor, item.selectedSize)}
                          className="px-2 py-1 text-xs text-[#5e3f3b] hover:text-primary hover:bg-[#fff0ee] font-bold"
                        >
                          <Plus size={10} />
                        </button>
                      </div>

                      {/* Item Price */}
                      <span className="text-sm font-bold text-primary">
                        ₹{(item.product.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Remove Item */}
                  <button
                    onClick={() => onRemoveItem(item.product.id, item.selectedColor, item.selectedSize)}
                    className="absolute top-4 right-4 text-[#5e3f3b]/40 hover:text-primary transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <div className="w-16 h-16 bg-[#fff0ee] rounded-full flex items-center justify-center text-primary/40">
                  <ShoppingCart size={28} />
                </div>
                <h3 className="font-semibold text-[#291715] text-base">Your cart is empty</h3>
                <p className="text-xs text-[#5e3f3b]/60 max-w-xs">
                  Fill your boutique cart with artisanal wooden toys, luxury chocolates, and fine designer dress wear!
                </p>
                <button
                  onClick={onClose}
                  className="bg-primary text-white text-xs font-bold px-6 py-3 rounded-xl hover:bg-[#9a000e] transition-colors cursor-pointer mt-2"
                >
                  Start Shopping
                </button>
              </div>
            )}
          </div>

          {/* Footer Promo and Pricing Summary */}
          {cartItems.length > 0 && (
            <div className="p-6 bg-[#fff8f7] border-t border-[#e8bcb7]/20 space-y-4">
              {/* Promo code form */}
              {!appliedCoupon ? (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5e3f3b]/40" size={14} />
                    <input
                      type="text"
                      placeholder="ENTER PROMO CODE (e.g. PCART20)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full bg-white border border-[#e8bcb7]/20 rounded-xl py-2.5 pl-9 pr-4 text-xs font-semibold uppercase outline-none focus:ring-1 focus:ring-primary text-[#291715]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={couponLoading}
                    className="bg-[#e5e2e1] text-[#474646] hover:bg-primary hover:text-white font-bold text-xs px-4 rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-60"
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-xl text-emerald-800">
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>
                      Promo <strong>{appliedCoupon.code}</strong> Applied! (
                      {appliedCoupon.type === 'flat' ? `₹${appliedCoupon.value} off` : `${appliedCoupon.value}% off`})
                    </span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-emerald-700 hover:text-red-600 text-xs font-bold"
                  >
                    Remove
                  </button>
                </div>
              )}

              {couponError && <p className="text-[10px] font-bold text-red-600 px-1">{couponError}</p>}
              {couponSuccess && <p className="text-[10px] font-bold text-emerald-600 px-1">{couponSuccess}</p>}

              {/* Price list breakdown */}
              <div className="space-y-2 text-xs text-gray-500 pt-2 border-t border-gray-200">
                <div className="flex justify-between">
                  <span>Price ({totalQty} item{totalQty > 1 ? 's' : ''})</span>
                  <span className="font-semibold text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span className="font-semibold text-gray-900">
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toLocaleString('en-IN')}`}
                  </span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Coupon Discount</span>
                    <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total Amount</span>
                  <span className="text-gray-900 text-base font-black">₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Secure Checkout button */}
              <button
                onClick={handleCheckoutClick}
                className="w-full bg-[#fb641b] hover:bg-[#e0540d] text-white py-4 rounded-sm font-bold text-sm transition-all shadow-md mt-4 flex items-center justify-center gap-2 cursor-pointer active:scale-95 uppercase"
              >
                Proceed to Checkout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
