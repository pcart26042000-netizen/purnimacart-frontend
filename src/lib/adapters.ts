// Adapters that convert Firestore documents into the existing UI-facing
// types (src/types.ts) so none of the presentational components need to
// know about the Firestore data model. Keeps Phase 2 wiring isolated from
// the untouched UI layer.

import type { FirestoreProduct, FirestoreCategory } from '../types/firestore';
import type { Product, Category } from '../types';

const FALLBACK_IMAGE =
  'https://placehold.co/600x600/fff0ee/bb0012?text=PurnimaCart';

export function productFromFirestore(fp: FirestoreProduct): Product {
  const hasOffer = typeof fp.offerPrice === 'number' && fp.offerPrice > 0 && fp.offerPrice < fp.price;
  const displayPrice = hasOffer ? (fp.offerPrice as number) : fp.price;
  const originalPrice = hasOffer ? fp.price : undefined;
  const dealDiscount = hasOffer
    ? `-${Math.round(((fp.price - (fp.offerPrice as number)) / fp.price) * 100)}% OFF`
    : undefined;

  return {
    id: fp.id,
    name: fp.name,
    category: fp.categorySlug,
    price: displayPrice,
    originalPrice,
    image: fp.images?.[0] || FALLBACK_IMAGE,
    images: fp.images?.length ? fp.images : [fp.images?.[0] || FALLBACK_IMAGE],
    rating: fp.rating ?? 0,
    reviewCount: fp.reviewCount ?? 0,
    tags: fp.tags ?? [],
    description: fp.description ?? '',
    isDeal: hasOffer,
    dealDiscount,
    // Firestore products don't carry a bullet-feature list yet; leave empty
    // rather than inventing copy. ProductDetail already treats this as optional.
    features: [],
    returnWindow: fp.returnWindow,
    isFiveMinBadge: !!fp.isFiveMinBadge,
    isFashionFit: !!fp.isFashionFit,
    variants: fp.variants || [],
    hasSizes: !!fp.hasSizes,
    sizes: fp.sizes || [],
    stock: fp.stock || 0,
  };
}

const CATEGORY_ICONS: Record<string, string> = {
  toys: 'smart_toy',
  dresses: 'apparel',
  cosmetics: 'face_6',
  gifts: 'featured_seasonal_and_gifts',
  chocolates: 'cake',
  accessories: 'watch',
  'photo-frames': 'photo_frame',
  frames: 'photo_frame',
};

export function categoryFromFirestore(fc: FirestoreCategory, productCount: number): Category {
  return {
    id: fc.slug,
    name: fc.name,
    // Unknown/new categories fall back to a generic grid icon instead of
    // breaking â€” categories are meant to be unlimited and admin-defined.
    iconName: CATEGORY_ICONS[fc.slug] ?? 'grid',
    count: productCount,
    image: fc.image,
  };
}


