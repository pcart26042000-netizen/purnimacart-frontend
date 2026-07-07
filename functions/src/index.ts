import { setGlobalOptions } from 'firebase-functions/v2';
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { db } from './admin';
import { priceCartServerSide, loadAddress, getStoreDeliveryCharge } from './pricing';
import { validateCouponServerSide, applyCouponUsage } from './coupon';
import { deductStockInTransaction } from './stock';
import { createRazorpayOrderRemote, verifyRazorpaySignature, verifyWebhookSignature } from './razorpay';
import { finalizeVerifiedSession, markSessionFailed } from './checkout';
import type { CheckoutRequest } from './types';

export { adminUpdateOrderStatus } from './orderAdmin';

setGlobalOptions({ region: 'asia-south1', maxInstances: 10 });

const RAZORPAY_KEY_ID = defineSecret('RAZORPAY_KEY_ID');
const RAZORPAY_KEY_SECRET = defineSecret('RAZORPAY_KEY_SECRET');
const RAZORPAY_WEBHOOK_SECRET = defineSecret('RAZORPAY_WEBHOOK_SECRET');

function requireAuth(auth: { uid: string } | undefined): string {
  if (!auth?.uid) {
    throw new HttpsError('unauthenticated', 'You must be signed in to do this.');
  }
  return auth.uid;
}

// ---------------------------------------------------------------------------
// 1. createRazorpayOrder — prices the cart from Firestore (never trusts the
//    client's numbers), validates any coupon, opens a Razorpay order, and
//    stores everything server-side in checkoutSessions/{id} so verifyPayment
//    can finalize the exact same order later without re-trusting the client.
// ---------------------------------------------------------------------------
export const createRazorpayOrder = onCall(
  { secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET] },
  async (request) => {
    const uid = requireAuth(request.auth);
    const data = request.data as CheckoutRequest;

    const { items, subtotal } = await priceCartServerSide(data.items);
    const address = await loadAddress(uid, data.addressId);
    const totalQty = data.items.reduce((acc, item) => acc + item.qty, 0);
    const deliveryCharge = await getStoreDeliveryCharge(subtotal, totalQty);

    let discount = 0;
    let couponRefPath: string | undefined;
    let couponCode: string | undefined;
    if (data.couponCode) {
      const validated = await validateCouponServerSide(data.couponCode, subtotal, uid);
      if (validated) {
        discount = validated.discountAmount;
        couponRefPath = validated.couponRef.path;
        couponCode = validated.coupon.code;
      }
    }

    const total = Math.max(0, subtotal + deliveryCharge - discount);
    if (total <= 0) {
      throw new HttpsError('invalid-argument', 'Order total is ₹0 — please choose Cash on Delivery instead.');
    }
    const amountPaise = Math.round(total * 100);

    const sessionRef = db.collection('checkoutSessions').doc();
    await sessionRef.set({
      uid,
      items,
      addressSnapshot: address,
      couponCode: couponCode || null,
      couponRefPath: couponRefPath || null,
      subtotal,
      discount,
      deliveryCharge,
      total,
      razorpayOrderId: null,
      status: 'created',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    try {
      const rpOrder = await createRazorpayOrderRemote(
        RAZORPAY_KEY_ID.value(),
        RAZORPAY_KEY_SECRET.value(),
        amountPaise,
        sessionRef.id
      );
      await sessionRef.update({ razorpayOrderId: rpOrder.id });

      return {
        checkoutSessionId: sessionRef.id,
        razorpayOrderId: rpOrder.id,
        amount: amountPaise,
        currency: 'INR',
        keyId: RAZORPAY_KEY_ID.value(),
        subtotal,
        discount,
        deliveryCharge,
        total,
      };
    } catch (err) {
      await markSessionFailed(sessionRef.id, 'razorpay_order_creation_failed');
      console.error('Razorpay order creation failed', err);
      throw new HttpsError('internal', 'Could not initiate payment right now. Please try again.');
    }
  }
);

// ---------------------------------------------------------------------------
// 2. verifyPayment — the ONLY place a Razorpay payment is trusted. Verifies
//    the HMAC signature server-side, then atomically deducts stock, applies
//    coupon usage, and creates the paid order. Idempotent by session state.
// ---------------------------------------------------------------------------
export const verifyPayment = onCall(
  { secrets: [RAZORPAY_KEY_SECRET] },
  async (request) => {
    const uid = requireAuth(request.auth);
    const { checkoutSessionId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = request.data as {
      checkoutSessionId: string;
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    };

    if (!checkoutSessionId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new HttpsError('invalid-argument', 'Missing payment verification details.');
    }

    const sessionSnap = await db.collection('checkoutSessions').doc(checkoutSessionId).get();
    if (!sessionSnap.exists) {
      throw new HttpsError('not-found', 'Checkout session not found or expired.');
    }
    const session = sessionSnap.data()!;
    if (session.uid !== uid) {
      throw new HttpsError('permission-denied', 'This checkout session does not belong to you.');
    }
    if (session.razorpayOrderId !== razorpay_order_id) {
      throw new HttpsError('invalid-argument', 'Order mismatch during payment verification.');
    }

    const isValid = verifyRazorpaySignature(
      RAZORPAY_KEY_SECRET.value(),
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      await markSessionFailed(checkoutSessionId, 'invalid_signature');
      throw new HttpsError(
        'permission-denied',
        'Payment verification failed. If any amount was deducted, it will be automatically refunded within a few business days.'
      );
    }

    try {
      const result = await finalizeVerifiedSession(checkoutSessionId, razorpay_payment_id);
      return { success: true, orderId: result.orderId };
    } catch (err: any) {
      console.error('Order finalization failed after verified payment', err);
      if (err instanceof HttpsError) throw err;
      throw new HttpsError('internal', 'Payment was verified but we could not finalize your order. Contact support with your payment ID: ' + razorpay_payment_id);
    }
  }
);

// ---------------------------------------------------------------------------
// 3. validateCoupon — read-only preview used by the checkout UI to show the
//    discount before payment. Does not record usage (no side effects).
// ---------------------------------------------------------------------------
export const validateCoupon = onCall(async (request) => {
  const uid = requireAuth(request.auth);
  const { code, subtotal } = request.data as { code: string; subtotal: number };

  if (!Number.isFinite(subtotal) || subtotal < 0) {
    throw new HttpsError('invalid-argument', 'Invalid subtotal.');
  }

  try {
    const validated = await validateCouponServerSide(code, subtotal, uid);
    if (!validated) return { valid: false, discountAmount: 0, error: 'Enter a coupon code.' };
    return {
      valid: true,
      discountAmount: validated.discountAmount,
      code: validated.coupon.code,
      type: validated.coupon.type,
      value: validated.coupon.value,
    };
  } catch (err: any) {
    const message = err instanceof HttpsError ? err.message : 'Could not validate this coupon right now.';
    return { valid: false, discountAmount: 0, error: message };
  }
});

// ---------------------------------------------------------------------------
// 4. placeOrder — Cash on Delivery path. Same server-side pricing/coupon/
//    stock logic as the Razorpay path, minus the payment step.
// ---------------------------------------------------------------------------
export const placeOrder = onCall(async (request) => {
  const uid = requireAuth(request.auth);
  const data = request.data as CheckoutRequest;

  const { items, subtotal } = await priceCartServerSide(data.items);
  const address = await loadAddress(uid, data.addressId);
  const totalQty = data.items.reduce((acc, item) => acc + item.qty, 0);
  const deliveryCharge = await getStoreDeliveryCharge(subtotal, totalQty);

  let discount = 0;
  let couponRef: FirebaseFirestore.DocumentReference | undefined;
  let couponCode: string | undefined;
  if (data.couponCode) {
    const validated = await validateCouponServerSide(data.couponCode, subtotal, uid);
    if (validated) {
      discount = validated.discountAmount;
      couponRef = validated.couponRef;
      couponCode = validated.coupon.code;
    }
  }

  const total = Math.max(0, subtotal + deliveryCharge - discount);

  const orderId = await db.runTransaction(async (tx) => {
    await deductStockInTransaction(tx, items);

    const orderRef = db.collection('orders').doc();
    tx.set(orderRef, {
      userId: uid,
      items,
      addressSnapshot: address,
      subtotal,
      deliveryCharge,
      discount,
      total,
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      razorpayOrderId: null,
      razorpayPaymentId: null,
      orderStatus: 'pending',
      trackingNote: '',
      ...(couponCode ? { couponCode } : {}),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (couponRef) {
      applyCouponUsage(tx, couponRef, uid, orderRef.id);
    }

    return orderRef.id;
  });

  return { orderId };
});

// ---------------------------------------------------------------------------
// 5. updateInventory — admin-only manual stock correction utility. Normal
//    checkout stock decrements happen automatically inside placeOrder /
//    verifyPayment above; this is for manual corrections (returns, damage,
//    restocks) outside of the order flow.
// ---------------------------------------------------------------------------
export const updateInventory = onCall(async (request) => {
  const uid = requireAuth(request.auth);
  const adminSnap = await db.collection('admins').doc(uid).get();
  if (!adminSnap.exists) {
    throw new HttpsError('permission-denied', 'Admin access required.');
  }
  const { productId, stock } = request.data as { productId: string; stock: number };
  if (!productId || !Number.isFinite(stock) || stock < 0) {
    throw new HttpsError('invalid-argument', 'Invalid product or stock value.');
  }
  await db.collection('products').doc(productId).update({ stock });
  return { success: true };
});

// ---------------------------------------------------------------------------
// Webhook — safety net in case the client's verifyPayment call never lands
// (browser closed mid-redirect, network drop right after payment, etc).
// Razorpay retries webhook delivery automatically; finalizeVerifiedSession
// is idempotent so a retried or duplicate delivery is a no-op.
// ---------------------------------------------------------------------------
export const razorpayWebhook = onRequest(
  { secrets: [RAZORPAY_WEBHOOK_SECRET], cors: false },
  async (req, res) => {
    const signature = req.headers['x-razorpay-signature'] as string | undefined;
    const rawBody = (req as any).rawBody as Buffer | undefined;

    if (!signature || !rawBody) {
      res.status(400).send('Missing signature or body');
      return;
    }
    if (!verifyWebhookSignature(RAZORPAY_WEBHOOK_SECRET.value(), rawBody, signature)) {
      console.warn('Webhook signature mismatch — ignoring request');
      res.status(400).send('Invalid signature');
      return;
    }

    const event = req.body?.event;
    if (event !== 'payment.captured') {
      // Acknowledge everything else so Razorpay stops retrying; we only act on captures.
      res.status(200).send('ignored');
      return;
    }

    try {
      const payment = req.body.payload.payment.entity;
      const razorpayOrderId = payment.order_id as string;
      const razorpayPaymentId = payment.id as string;

      const sessionQuery = await db
        .collection('checkoutSessions')
        .where('razorpayOrderId', '==', razorpayOrderId)
        .limit(1)
        .get();

      if (sessionQuery.empty) {
        console.warn('Webhook: no matching checkout session for', razorpayOrderId);
        res.status(200).send('no matching session');
        return;
      }

      await finalizeVerifiedSession(sessionQuery.docs[0].id, razorpayPaymentId);
      res.status(200).send('ok');
    } catch (err) {
      console.error('Webhook processing failed', err);
      // 200 even on our own internal errors once signature is verified —
      // Razorpay would otherwise retry forever for a bug that's ours to fix,
      // not the payment's fault. We still have the client-side verifyPayment
      // path as the primary confirmation route.
      res.status(200).send('error logged');
    }
  }
);
