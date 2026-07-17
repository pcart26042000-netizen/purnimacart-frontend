import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { FirestoreBrandDeal } from '../types/firestore';

export function useActiveBrandDeals() {
  const [deals, setDeals] = useState<FirestoreBrandDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'brandDeals'),
      where('isActive', '==', true)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as FirestoreBrandDeal)
        );
        // Sort client-side by order asc
        items.sort((a, b) => (a.order || 0) - (b.order || 0));
        setDeals(items);
        setLoading(false);
      },
      (err) => {
        console.error('useActiveBrandDeals: Firestore listener failed', err);
        setError('Could not load brand deals.');
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  return { deals, loading, error };
}
