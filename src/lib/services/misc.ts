import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, setDoc, onSnapshot,
  query, where, orderBy, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { FirestoreBanner, FirestoreCoupon, StoreSettings, FirestoreBrandDeal } from '../../types/firestore';

// ---------- Banners ----------
const BANNERS_COL = 'banners';

// A banner counts as "live" on the storefront when it's active AND (if a
// schedule is set) the current time falls inside [startDate, endDate].
export function isBannerLive(banner: FirestoreBanner, now: Date = new Date()): boolean {
  if (!banner.isActive) return false;
  const t = now.getTime();
  if (banner.startDate && banner.startDate.toMillis() > t) return false;
  if (banner.endDate && banner.endDate.toMillis() < t) return false;
  return true;
}

export async function getActiveBanners(): Promise<FirestoreBanner[]> {
  const q = query(collection(db, BANNERS_COL), where('isActive', '==', true));
  const snap = await getDocs(q);
  const banners = snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreBanner));
  banners.sort((a, b) => (a.order || 0) - (b.order || 0));
  // Scheduling window is enforced client-side on top of the isActive filter
  // above, since Firestore can't easily query "now is between two fields".
  return banners.filter((b) => isBannerLive(b));
}

export async function getAllBannersForAdmin(): Promise<FirestoreBanner[]> {
  const q = query(collection(db, BANNERS_COL), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreBanner));
}

// Realtime feed for the admin Banner Manager screen.
export function subscribeBannersAdmin(
  onData: (banners: FirestoreBanner[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(collection(db, BANNERS_COL), orderBy('order', 'asc'));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreBanner))),
    (error) => {
      console.error('subscribeBannersAdmin: listener failed', error);
      onError?.(error as unknown as Error);
    }
  );
}

export interface BannerInput {
  imageUrl: string;
  title?: string;
  order: number;
  isActive: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
}

// Banners are promotional images ONLY — no link/CTA field exists on this type on purpose.
export async function createBanner(input: BannerInput) {
  const ref = await addDoc(collection(db, BANNERS_COL), {
    imageUrl: input.imageUrl,
    title: input.title || '',
    order: input.order,
    isActive: input.isActive,
    startDate: input.startDate ? Timestamp.fromDate(input.startDate) : null,
    endDate: input.endDate ? Timestamp.fromDate(input.endDate) : null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateBanner(id: string, input: Partial<BannerInput>) {
  const data: Record<string, unknown> = { ...input };
  if ('startDate' in input) data.startDate = input.startDate ? Timestamp.fromDate(input.startDate) : null;
  if ('endDate' in input) data.endDate = input.endDate ? Timestamp.fromDate(input.endDate) : null;
  await updateDoc(doc(db, BANNERS_COL, id), data);
}

export async function deleteBanner(id: string) {
  await deleteDoc(doc(db, BANNERS_COL, id));
}

// ---------- Coupons ----------
const COUPONS_COL = 'coupons';

export async function getActiveCoupons(): Promise<FirestoreCoupon[]> {
  const q = query(collection(db, COUPONS_COL), where('isActive', '==', true));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreCoupon));
}

export async function getAllCouponsForAdmin(): Promise<FirestoreCoupon[]> {
  const snap = await getDocs(collection(db, COUPONS_COL));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreCoupon));
}

// Realtime feed for the admin Coupons screen.
export function subscribeCouponsAdmin(
  onData: (coupons: FirestoreCoupon[]) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    collection(db, COUPONS_COL),
    (snap) => onData(snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreCoupon))),
    (error) => {
      console.error('subscribeCouponsAdmin: listener failed', error);
      onError?.(error as unknown as Error);
    }
  );
}

export async function getCouponByCode(code: string): Promise<FirestoreCoupon | null> {
  const q = query(collection(db, COUPONS_COL), where('code', '==', code.toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as FirestoreCoupon;
}

export async function createCoupon(data: Omit<FirestoreCoupon, 'id' | 'usedCount'>) {
  const ref = await addDoc(collection(db, COUPONS_COL), { ...data, code: data.code.toUpperCase(), usedCount: 0 });
  return ref.id;
}

export async function updateCoupon(id: string, data: Partial<FirestoreCoupon>) {
  await updateDoc(doc(db, COUPONS_COL, id), data);
}

export async function deleteCoupon(id: string) {
  await deleteDoc(doc(db, COUPONS_COL, id));
}

// ---------- Store settings ----------
const SETTINGS_DOC = 'settings/store';

const DEFAULT_STORE_SETTINGS: StoreSettings = {
  deliveryCharge: 15,
  freeDeliveryThreshold: 999,
  storeName: 'PurnimaCart',
  storeEmail: '',
  storePhone: '',
  storeAddress: '',
  taxPercent: 0,
  socialLinks: {},
  fiveMinDeliveryAvailable: false,
  fiveMinDeliveryPincode: '732101',
  dealShowcaseTitle: '',
  dealItem1Image: '',
  dealItem1Badge: '',
  dealItem1Title: '',
  dealItem1Link: '',
  dealItem2Image: '',
  dealItem2Badge: '',
  dealItem2Title: '',
  dealItem2Link: '',
  dealItem3Image: '',
  dealItem3Badge: '',
  dealItem3Title: '',
  dealItem3Link: '',
  dealItem4Badge: '',
  dealItem4Title: '',
  dealItem4Link: '',
  singleBannerImage: '',
  singleBannerCategory: '',
  singleBannerTitle: '',
  singleBannerSubtitle: '',
  singleBannerCtaText: '',
  fiveMinMinOrderValue: 0,
};

export async function getStoreSettings(): Promise<StoreSettings> {
  const snap = await getDoc(doc(db, SETTINGS_DOC));
  if (!snap.exists()) {
    return DEFAULT_STORE_SETTINGS;
  }
  // Merge with defaults so older settings docs (from before Phase 5) that are
  // missing the newer fields don't break admin forms or storefront reads.
  return { ...DEFAULT_STORE_SETTINGS, ...(snap.data() as Partial<StoreSettings>) };
}

export async function updateStoreSettings(data: Partial<StoreSettings>) {
  await setDoc(doc(db, SETTINGS_DOC), data, { merge: true });
}

// ---------- Brand Deals ----------
const BRAND_DEALS_COL = 'brandDeals';

export interface BrandDealInput {
  imageUrl: string;
  brandLogoUrl?: string;
  title: string;
  brandName: string;
  discountText: string;
  link: string;
  order: number;
  isActive: boolean;
}

export async function getActiveBrandDeals(): Promise<FirestoreBrandDeal[]> {
  const q = query(collection(db, BRAND_DEALS_COL), where('isActive', '==', true));
  const snap = await getDocs(q);
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreBrandDeal));
  items.sort((a, b) => (a.order || 0) - (b.order || 0));
  return items;
}

export function subscribeBrandDealsAdmin(
  onData: (deals: FirestoreBrandDeal[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(collection(db, BRAND_DEALS_COL), orderBy('order', 'asc'));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreBrandDeal))),
    (error) => {
      console.error('subscribeBrandDealsAdmin: listener failed', error);
      onError?.(error as unknown as Error);
    }
  );
}

export async function createBrandDeal(input: BrandDealInput) {
  const ref = await addDoc(collection(db, BRAND_DEALS_COL), {
    ...input,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateBrandDeal(id: string, input: Partial<BrandDealInput>) {
  await updateDoc(doc(db, BRAND_DEALS_COL, id), input);
}

export async function deleteBrandDeal(id: string) {
  await deleteDoc(doc(db, BRAND_DEALS_COL, id));
}



