import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot,
  query, where, orderBy, limit as fbLimit, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { FirestoreProduct } from '../../types/firestore';

const COL = 'products';

export async function getActiveProducts(): Promise<FirestoreProduct[]> {
  const q = query(collection(db, COL), where('isActive', '==', true));
  const snap = await getDocs(q);
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreProduct));
  items.sort((a, b) => {
    const t1 = a.createdAt ? (typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : (a.createdAt.seconds * 1000)) : 0;
    const t2 = b.createdAt ? (typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : (b.createdAt.seconds * 1000)) : 0;
    return t2 - t1;
  });
  return items;
}

export async function getProductsByCategory(categorySlug: string): Promise<FirestoreProduct[]> {
  const q = query(
    collection(db, COL),
    where('isActive', '==', true),
    where('categorySlug', '==', categorySlug),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreProduct));
}

export async function getProductById(id: string): Promise<FirestoreProduct | null> {
  const snap = await getDoc(doc(db, COL, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as FirestoreProduct) : null;
}

export async function getAllProductsForAdmin(): Promise<FirestoreProduct[]> {
  const snap = await getDocs(query(collection(db, COL), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreProduct));
}

// Realtime feed of every product (active or not) — used by the admin
// Products screen and the Dashboard's low-stock widget.
export function subscribeAllProductsAdmin(
  onData: (products: FirestoreProduct[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreProduct))),
    (error) => {
      console.error('subscribeAllProductsAdmin: listener failed', error);
      onError?.(error as unknown as Error);
    }
  );
}

// Product count per category slug, derived client-side from an already
// loaded product list — avoids one query per category.
export function countProductsByCategory(products: FirestoreProduct[]): Record<string, number> {
  return products.reduce((acc, p) => {
    acc[p.categorySlug] = (acc[p.categorySlug] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

export async function getLowStockProducts(threshold = 5): Promise<FirestoreProduct[]> {
  const q = query(collection(db, COL), where('stock', '<=', threshold));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreProduct));
}

export async function createProduct(data: Omit<FirestoreProduct, 'id' | 'createdAt'>) {
  const ref = await addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

export async function updateProduct(id: string, data: Partial<FirestoreProduct>) {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
}

export async function updateStock(id: string, stock: number) {
  await updateDoc(doc(db, COL, id), { stock });
}

export async function deleteProduct(id: string) {
  await deleteDoc(doc(db, COL, id));
}

// Simple client-side search across name/tags/category, since Firestore has no
// native full-text search. Fine for a catalog of a few hundred products;
// swap for Algolia/Typesense later if the catalog grows large.
export function searchProductsLocal(products: FirestoreProduct[], queryText: string): FirestoreProduct[] {
  const q = queryText.trim().toLowerCase();
  if (!q) return products;
  return products.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.categorySlug.toLowerCase().includes(q) ||
    p.tags.some(t => t.toLowerCase().includes(q))
  );
}
