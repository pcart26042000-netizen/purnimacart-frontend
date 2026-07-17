import { useEffect, useState } from 'react';
import type { FirestoreBrandDeal } from '../../types/firestore';
import { subscribeBrandDealsAdmin } from '../../lib/services/misc';

export function useAdminBrandDeals() {
  const [deals, setDeals] = useState<FirestoreBrandDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeBrandDealsAdmin(
      (data) => {
        setDeals(data);
        setLoading(false);
        setError(null);
      },
      () => {
        setError('Could not load brand deals right now.');
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  return { deals, loading, error };
}
