import { collection, query, where, getDocs, doc, getDoc, runTransaction, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import type { CartItem } from '../../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export interface CartLineInput {
  productId: string;
  qty: number;
  variant?: { size?: string; color?: string };
}

export function cartItemsToLines(cartItems: CartItem[]): CartLineInput[] {
  return cartItems.map((item) => ({
    productId: item.product.id,
    qty: item.quantity,
    variant: { size: item.selectedSize, color: item.selectedColor },
  }));
}

export interface CreateRazorpayOrderResponse {
  checkoutSessionId: string;
  razorpayOrderId: string;
  amount: number; // paise
  currency: string;
  keyId: string;
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  total: number;
}

export interface VerifyPaymentResponse {
  success: boolean;
  orderId: string;
}

export interface PlaceOrderResponse {
  orderId: string;
}

export interface ValidateCouponResponse {
  valid: boolean;
  discountAmount: number;
  code?: string;
  type?: 'flat' | 'percentage';
  value?: number;
  error?: string;
}

export function describeCheckoutError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}

export async function validateCouponRemote(code: string, subtotal: number): Promise<ValidateCouponResponse> {
  try {
    const q = query(collection(db, 'coupons'), where('code', '==', code.toUpperCase()), where('isActive', '==', true));
    const snap = await getDocs(q);
    if (snap.empty) {
      return { valid: false, discountAmount: 0, error: 'Invalid or inactive coupon code.' };
    }
    const coupon = snap.docs[0].data();
    
    // Check expiry
    const expiryDate = coupon.expiryDate;
    if (expiryDate) {
      const expiryMs = typeof expiryDate.toMillis === 'function' ? expiryDate.toMillis() : (expiryDate.seconds * 1000);
      if (expiryMs < Date.now()) {
        return { valid: false, discountAmount: 0, error: 'This coupon code has expired.' };
      }
    }
    
    // Check min spend
    if (subtotal < (coupon.minOrderValue || 0)) {
      return { valid: false, discountAmount: 0, error: `Minimum spend to apply this coupon is ₹${(coupon.minOrderValue || 0).toLocaleString()}` };
    }
    
    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === 'flat') {
      discountAmount = Math.min(coupon.value, subtotal);
    } else {
      discountAmount = Math.round((subtotal * coupon.value) / 100);
    }
    
    return {
      valid: true,
      discountAmount,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
    };
  } catch (error: any) {
    console.error(error);
    return { valid: false, discountAmount: 0, error: 'Failed to validate coupon code.' };
  }
}

export async function placeCodOrder(items: CartLineInput[], addressId: string, couponCode?: string): Promise<PlaceOrderResponse> {
  try {
    const orderId = 'ORD-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    
    await runTransaction(db, async (transaction) => {
      const authUser = auth.currentUser;
      if (!authUser) {
        throw new Error('Please sign in to place an order.');
      }
      
      const userRef = doc(db, 'users', authUser.uid);
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('User profile not found.');
      }
      const userData = userSnap.data();
      const address = (userData.addresses || []).find((a: any) => a.id === addressId);
      if (!address) {
        throw new Error('Selected address not found.');
      }
      
      let subtotal = 0;
      const orderItems: any[] = [];
      const productSnaps: { ref: any; data: any; qty: number }[] = [];
      
      for (const item of items) {
        const prodRef = doc(db, 'products', item.productId);
        const prodSnap = await transaction.get(prodRef);
        if (!prodSnap.exists()) {
          throw new Error('Product not found.');
        }
        const prodData = prodSnap.data();
        if (prodData.stock < item.qty) {
          throw new Error(`Sorry, "${prodData.name}" is out of stock.`);
        }
        
        const price = prodData.offerPrice !== undefined && prodData.offerPrice !== null ? prodData.offerPrice : prodData.price;
        subtotal += price * item.qty;
        
        orderItems.push({
          productId: item.productId,
          name: prodData.name,
          image: prodData.image,
          price: price,
          qty: item.qty,
          selectedColor: item.variant?.color || 'Classic',
          selectedSize: item.variant?.size || 'Standard',
        });
        
        productSnaps.push({ ref: prodRef, data: prodData, qty: item.qty });
      }
      
      let discount = 0;
      if (couponCode) {
        const couponVal = await validateCouponRemote(couponCode, subtotal);
        if (couponVal.valid) {
          discount = couponVal.discountAmount;
        }
      }
      
      const settingsRef = doc(db, 'settings', 'store');
      const settingsSnap = await transaction.get(settingsRef);
      const settings = settingsSnap.exists() ? settingsSnap.data() : { deliveryCharge: 49, freeDeliveryThreshold: 999 };
      
      const totalQty = items.reduce((acc, item) => acc + item.qty, 0);
      const deliveryCharge = subtotal >= (settings.freeDeliveryThreshold || 999) ? 0 : (settings.deliveryCharge || 49) * totalQty;
      const total = Math.max(0, subtotal + deliveryCharge - discount);
      
      for (const prod of productSnaps) {
        transaction.update(prod.ref, {
          stock: prod.data.stock - prod.qty,
        });
      }
      
      const orderRef = doc(db, 'orders', orderId);
      transaction.set(orderRef, {
        userId: authUser.uid,
        email: authUser.email || '',
        customerName: authUser.displayName || address.name,
        items: orderItems,
        shippingAddress: address,
        subtotal,
        deliveryCharge,
        discount,
        total,
        paymentMethod: 'cod',
        paymentStatus: 'unpaid',
        orderStatus: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    });
    
    return { orderId };
  } catch (error: any) {
    console.error('placeCodOrder error:', error);
    throw error;
  }
}

export async function createRazorpayOrder(items: CartLineInput[], addressId: string, couponCode?: string): Promise<CreateRazorpayOrderResponse> {
  try {
    const authUser = auth.currentUser;
    if (!authUser) {
      throw new Error('Please sign in to place an order.');
    }
    
    const response = await fetch(`${BASE_URL}/api/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items,
        addressId,
        couponCode,
        userId: authUser.uid,
      }),
    });
    
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Failed to create payment order on backend.');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('createRazorpayOrder error:', error);
    throw error;
  }
}

export async function verifyPayment(
  checkoutSessionId: string,
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string
): Promise<VerifyPaymentResponse> {
  try {
    const response = await fetch(`${BASE_URL}/api/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        checkoutSessionId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      }),
    });
    
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Payment verification failed on backend.');
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('verifyPayment error:', error);
    throw error;
  }
}
