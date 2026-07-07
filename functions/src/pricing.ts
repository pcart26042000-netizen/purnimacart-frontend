import { HttpsError } from 'firebase-functions/v2/https';
import { db } from './admin';
import type { CartLineInput, OrderItem, FirestoreProduct, AddressInput } from './types';

export interface PricedCart {
  items: OrderItem[];
  subtotal: number;
}

// Rebuilds the order line items from Firestore, using the current price and
// name for every product — the client only ever sends productId + qty +
// variant. This is what stops someone from POSTing a fake ₹1 price.
export async function priceCartServerSide(cartLines: CartLineInput[]): Promise<PricedCart> {
  if (!cartLines || cartLines.length === 0) {
    throw new HttpsError('invalid-argument', 'Your cart is empty.');
  }
  if (cartLines.length > 50) {
    throw new HttpsError('invalid-argument', 'Too many distinct items in one order.');
  }

  const items: OrderItem[] = [];
  let subtotal = 0;

  for (const line of cartLines) {
    if (!line.productId || !Number.isFinite(line.qty) || line.qty <= 0 || line.qty > 20) {
      throw new HttpsError('invalid-argument', 'Invalid cart line item.');
    }
    const snap = await db.collection('products').doc(line.productId).get();
    if (!snap.exists) {
      throw new HttpsError('not-found', `A product in your cart is no longer available.`);
    }
    const product = snap.data() as FirestoreProduct;
    if (!product.isActive) {
      throw new HttpsError('failed-precondition', `${product.name} is no longer available.`);
    }
    const hasOffer = typeof product.offerPrice === 'number' && product.offerPrice! > 0 && product.offerPrice! < product.price;
    const unitPrice = hasOffer ? (product.offerPrice as number) : product.price;

    items.push({
      productId: line.productId,
      name: product.name,
      image: product.images?.[0] || '',
      price: unitPrice,
      qty: line.qty,
      variant: line.variant,
    });
    subtotal += unitPrice * line.qty;
  }

  return { items, subtotal };
}

export async function loadAddress(uid: string, addressId: string): Promise<AddressInput> {
  const userSnap = await db.collection('users').doc(uid).get();
  if (!userSnap.exists) {
    throw new HttpsError('failed-precondition', 'User profile not found.');
  }
  const addresses = (userSnap.data()?.addresses as AddressInput[]) || [];
  const address = addresses.find((a) => a.id === addressId);
  if (!address) {
    throw new HttpsError('invalid-argument', 'Selected address was not found on your account.');
  }
  return address;
}

export async function getStoreDeliveryCharge(subtotal: number, totalQty: number): Promise<number> {
  const snap = await db.doc('settings/store').get();
  const settings = snap.exists ? snap.data() as { deliveryCharge?: number } : {};
  const deliveryCharge = settings.deliveryCharge ?? 15;
  if (subtotal === 0) return 0;
  return totalQty * deliveryCharge;
}
