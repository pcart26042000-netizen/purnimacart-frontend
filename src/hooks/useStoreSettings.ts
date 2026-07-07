import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { StoreSettings } from '../types/firestore';

const DEFAULTS: StoreSettings = {
  deliveryCharge: 49,
  freeDeliveryThreshold: 999,
  storeName: 'PurnimaCart',
  storeEmail: '',
  storePhone: '',
  storeAddress: '',
  taxPercent: 0,
  socialLinks: {},
  fiveMinDeliveryAvailable: false,
  fiveMinDeliveryPincode: '732101',
};

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'store'),
      (snap) => {
        setSettings(snap.exists() ? { ...DEFAULTS, ...(snap.data() as Partial<StoreSettings>) } : DEFAULTS);
        setLoading(false);
      },
      (err) => {
        console.error('useStoreSettings failed', err);
        setSettings(DEFAULTS);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  return { settings, loading };
}



