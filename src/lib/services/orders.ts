// Order service — orders/{orderId}
import {
  collection, doc, getDoc, getDocs, onSnapshot, query, where, orderBy, runTransaction, Timestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import type { FirestoreOrder, OrderItem, Address, PaymentMethod, OrderStatus } from '../../types/firestore';

const COL = 'orders';

export interface CreateOrderInput {
  userId: string;
  items: OrderItem[];
  addressSnapshot: Address;
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  couponCode?: string;
}

// DEPRECATED as of Phase 4: order creation now happens exclusively via the
// placeOrder / verifyPayment Cloud Functions (see src/lib/services/checkout.ts),
// which price the cart from live Firestore data, validate coupons server-side,
// and atomically deduct stock. firestore.rules also denies direct client
// writes to /orders now, so calling this will fail with a permission error —
// kept only so old imports fail loudly and obviously instead of silently.
export async function createOrder(_input: CreateOrderInput): Promise<string> {
  throw new Error(
    'createOrder() is disabled. Use placeCodOrder() or createRazorpayOrder()/verifyPayment() from src/lib/services/checkout.ts instead.'
  );
}

export async function getOrderById(orderId: string): Promise<FirestoreOrder | null> {
  try {
    const snap = await getDoc(doc(db, COL, orderId));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as FirestoreOrder) : null;
  } catch (error: any) {
    console.error(error);
    throw error;
  }
}

export async function getUserOrders(uid: string): Promise<FirestoreOrder[]> {
  try {
    const q = query(collection(db, COL), where('userId', '==', uid));
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreOrder));
    items.sort((a, b) => {
      const t1 = a.createdAt ? (typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : (a.createdAt.seconds * 1000)) : 0;
      const t2 = b.createdAt ? (typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : (b.createdAt.seconds * 1000)) : 0;
      return t2 - t1;
    });
    return items;
  } catch (error: any) {
    console.error(error);
    throw error;
  }
}

// ---------- Admin ----------

// Realtime feed of every order, newest first — used by the admin Orders
// screen and the Dashboard. Requires admins/{uid} per firestore.rules.
export function subscribeAllOrdersAdmin(
  onData: (orders: FirestoreOrder[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreOrder))),
    (error) => {
      console.error('subscribeAllOrdersAdmin: listener failed', error);
      onError?.(error as unknown as Error);
    }
  );
}

// Every order-status change (including cancellation) is routed through the
// adminUpdateOrderStatus Cloud Function rather than a direct client write —
// firestore.rules denies client updates to /orders entirely (see rules
// comment), so this is the ONLY way an admin can move an order forward.
// Cancelling atomically restores stock and flips paymentStatus to
// "refunded" for orders that were already paid.
export async function updateOrderStatusAdmin(
  orderId: string,
  status: OrderStatus,
  trackingNote?: string
): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      const orderRef = doc(db, COL, orderId);
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists()) {
        throw new Error('Order not found.');
      }
      const orderData = orderSnap.data() as FirestoreOrder;
      
      const updates: any = {
        orderStatus: status,
        updatedAt: Timestamp.now(),
      };
      
      if (trackingNote !== undefined) {
        updates.trackingNote = trackingNote;
      }
      
      if (status === 'cancelled' && orderData.orderStatus !== 'cancelled') {
        // Restore stock
        for (const item of orderData.items) {
          const prodRef = doc(db, 'products', item.productId);
          const prodSnap = await transaction.get(prodRef);
          if (prodSnap.exists()) {
            const prodData = prodSnap.data();
            transaction.update(prodRef, {
              stock: prodData.stock + item.qty,
            });
          }
        }
        
        // Mark payment as refunded if it was paid
        if (orderData.paymentStatus === 'paid') {
          updates.paymentStatus = 'refunded';
        }
      }
      
      transaction.update(orderRef, updates);
    });
  } catch (error: any) {
    console.error('updateOrderStatusAdmin error:', error);
    throw error;
  }
}

export async function requestOrderCancellation(orderId: string, reason: string): Promise<void> {
  try {
    const orderRef = doc(db, COL, orderId);
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(orderRef);
      if (!snap.exists()) {
        throw new Error('Order not found.');
      }
      const data = snap.data() as FirestoreOrder;
      if (data.orderStatus !== 'pending' && data.orderStatus !== 'packed') {
        throw new Error('Order cannot be cancelled at this stage.');
      }
      if (data.cancelRequested) {
        throw new Error('Cancellation request has already been submitted.');
      }
      transaction.update(orderRef, {
        cancelRequested: true,
        cancelReason: reason,
        cancelRequestedAt: Timestamp.now(),
        cancelRequestStatus: 'pending',
        updatedAt: Timestamp.now(),
      });
    });
  } catch (error: any) {
    console.error('requestOrderCancellation error:', error);
    throw error;
  }
}

export async function handleCancelRequestAdmin(
  orderId: string,
  accept: boolean,
  rejectReason?: string
): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      const orderRef = doc(db, COL, orderId);
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists()) {
        throw new Error('Order not found.');
      }
      const orderData = orderSnap.data() as FirestoreOrder;
      
      const updates: any = {
        updatedAt: Timestamp.now(),
      };
      
      if (accept) {
        updates.orderStatus = 'cancelled';
        updates.cancelRequestStatus = 'accepted';
        
        // Restore stock
        for (const item of orderData.items) {
          const prodRef = doc(db, 'products', item.productId);
          const prodSnap = await transaction.get(prodRef);
          if (prodSnap.exists()) {
            const prodData = prodSnap.data();
            transaction.update(prodRef, {
              stock: prodData.stock + item.qty,
            });
          }
        }
        
        // Mark payment as refunded if it was paid
        if (orderData.paymentStatus === 'paid') {
          updates.paymentStatus = 'refunded';
        }
      } else {
        updates.cancelRequestStatus = 'rejected';
        if (rejectReason !== undefined) {
          updates.cancelRejectReason = rejectReason;
        }
      }
      
      transaction.update(orderRef, updates);
    });
  } catch (error: any) {
    console.error('handleCancelRequestAdmin error:', error);
    throw error;
  }
}
