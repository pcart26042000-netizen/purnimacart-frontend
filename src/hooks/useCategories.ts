import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { FirestoreCategory } from '../types/firestore';
import { categoryFromFirestore } from '../lib/adapters';
import type { Category, Product } from '../types';

interface UseCategoriesResult {
  categories: Category[];
  loading: boolean;
  error: string | null;
}

// Realtime category list, ordered by the admin-defined `order` field.
// productCounts (id -> count) is optional — pass it once products have
// loaded so the "All Products (12)" style counts stay accurate; omit it
// and every category will just show a count of 0.
export function useCategories(products: Product[] = []): UseCategoriesResult {
  const [rawCategories, setRawCategories] = useState<FirestoreCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('order', 'asc'));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setRawCategories(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreCategory))
        );
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('useCategories: Firestore listener failed', err);
        setError('Could not load categories right now.');
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  const counts = products.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});

  const categories: Category[] = [
    { id: 'all', name: 'For You', iconName: 'grid', count: products.length },
    ...rawCategories
      .filter((c) => c.isActive !== false)
      .map((c) => categoryFromFirestore(c, counts[c.slug] ?? 0)),
  ];

  return { categories, loading, error };
}
