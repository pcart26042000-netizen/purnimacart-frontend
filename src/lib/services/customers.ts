// Admin customer directory. There's no dedicated "customers" collection —
// every signed-in shopper already has a doc at users/{uid} (see
// AuthContext), so this derives a directory by combining that with the
// orders collection, both of which admins can read in full per
// firestore.rules.
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import type { FirestoreUser, FirestoreOrder } from '../../types/firestore';

export interface AdminCustomer {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  createdAt: FirestoreUser['createdAt'];
  orderCount: number;
  totalSpend: number;
  whatsapp?: string;
  receiveDeals?: boolean;
}

export async function getAllCustomersWithStats(): Promise<AdminCustomer[]> {
  const [usersSnap, ordersSnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'orders')),
  ]);

  const statsByUid = new Map<string, { orderCount: number; totalSpend: number }>();
  ordersSnap.docs.forEach((d) => {
    const order = d.data() as FirestoreOrder;
    const current = statsByUid.get(order.userId) || { orderCount: 0, totalSpend: 0 };
    current.orderCount += 1;
    // Cancelled orders never completed, so they don't count toward spend.
    if (order.orderStatus !== 'cancelled') {
      current.totalSpend += order.total;
    }
    statsByUid.set(order.userId, current);
  });

  return usersSnap.docs
    .map((d) => {
      const user = d.data() as FirestoreUser;
      const stats = statsByUid.get(user.uid) || { orderCount: 0, totalSpend: 0 };
      return {
        uid: user.uid,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: user.createdAt,
        orderCount: stats.orderCount,
        totalSpend: stats.totalSpend,
        whatsapp: user.whatsapp,
        receiveDeals: user.receiveDeals,
      };
    })
    .sort((a, b) => b.totalSpend - a.totalSpend);
}
