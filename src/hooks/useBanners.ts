import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { FirestoreBanner } from '../types/firestore';
import { isBannerLive } from '../lib/services/misc';

export function useActiveBanners() {
  const [banners, setBanners] = useState<FirestoreBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'banners'),
      where('isActive', '==', true)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as FirestoreBanner)
        );
        // Sort client-side by order asc
        items.sort((a, b) => (a.order || 0) - (b.order || 0));
        const liveBanners = items.filter((b) => isBannerLive(b));
        setBanners(liveBanners);
        setLoading(false);
      },
      (err) => {
        console.error('useActiveBanners: Firestore listener failed', err);
        setError('Could not load banners.');
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  return { banners, loading, error };
}
