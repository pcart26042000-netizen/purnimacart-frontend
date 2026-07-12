// Firestore data model types for PurnimaCart.
// These mirror the collections described in the backend spec.
// Kept in a separate module from ../types.ts (the existing UI types) so Phase 1
// doesn't touch any existing component. Phase 2 reconciles the two.

import type { Timestamp } from 'firebase/firestore';

export type ReturnWindow = '1-day' | '3-day' | '7-day' | 'none';
export type PaymentMethod = 'razorpay' | 'cod';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type OrderStatus = 'pending' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
export type CouponType = 'flat' | 'percentage';

export interface FirestoreCategory {
  id: string;
  name: string;
  slug: string;
  image: string; // Cloudinary URL
  order: number;
  isActive: boolean;
  createdAt: Timestamp | null;
}

export interface ProductVariant {
  color?: string;
  image?: string;
  price?: number;
  stock?: number;
}

export interface SizeVariant {
  size: string;
  stock: number;
}

export interface FirestoreProduct {
  id: string;
  name: string;
  description: string;
  categorySlug: string;
  price: number;
  offerPrice?: number | null;
  images: string[]; // Cloudinary URLs
  stock: number;
  sku: string;
  brand?: string;
  variants: ProductVariant[];
  hasSizes?: boolean;
  sizes?: SizeVariant[];
  returnWindow: ReturnWindow;
  rating: number;
  reviewCount: number;
  tags: string[];
  isActive: boolean;
  isFeatured?: boolean;
  isFiveMinBadge?: boolean;
  createdAt: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface Address {
  id: string;
  label: string; // e.g. "Home", "Work"
  fullName: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  district?: string;
  state: string;
  country: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
}

// ---------- Cart ----------
export interface CartItemVariant {
  color?: string;
  size?: string;
}

export interface FirestoreCartItem {
  id: string; // deterministic: productId + variant
  productId: string;
  productName: string;
  image: string;
  price: number;
  offerPrice?: number | null;
  quantity: number;
  selectedVariant?: CartItemVariant | null;
  createdAt: Timestamp | null;
}

// ---------- Wishlist ----------
export interface FirestoreWishlistItem {
  id: string; // == productId
  productId: string;
  productName: string;
  image: string;
  price: number;
  createdAt: Timestamp | null;
}

export interface FirestoreUser {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  addresses: Address[];
  createdAt: Timestamp | null;
}

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  qty: number;
  variant?: {
    color?: string;
    size?: string;
  };
  selectedColor?: string;
  selectedSize?: string;
}

export interface FirestoreOrder {
  id: string;
  userId: string;
  items: OrderItem[];
  addressSnapshot: Address;
  deliveryCharge: number;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  orderStatus: OrderStatus;
  trackingNote?: string;
  couponCode?: string;
  cancelRequested?: boolean;
  cancelReason?: string;
  cancelRequestedAt?: Timestamp | null;
  cancelRequestStatus?: 'pending' | 'accepted' | 'rejected';
  cancelRejectReason?: string;
  shippedDate?: string;
  deliveryDate?: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface FirestoreCoupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrderValue: number;
  expiryDate: Timestamp | null;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

export interface FirestoreBanner {
  id: string;
  imageUrl: string; // Cloudinary URL — image only, never a link/CTA
  title?: string; // internal label only, shown in the admin list, never rendered as a CTA on the storefront
  order: number;
  isActive: boolean;
  // Optional scheduling window. When set, a banner is only considered "live"
  // (see isBannerLive below) between these two instants; either side may be
  // left null for an open-ended start/end.
  startDate: Timestamp | null;
  endDate: Timestamp | null;
  createdAt: Timestamp | null;
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  whatsapp?: string;
}

export interface StoreSettings {
  deliveryCharge: number;
  freeDeliveryThreshold: number;
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  taxPercent: number; // applied on subtotal at checkout-preview level, GST-style
  socialLinks: SocialLinks;
  promoTitle?: string;
  promoSubtitle?: string;
  promoCode?: string;
  promoButtonText?: string;
  showPromoBanner?: boolean;
  fiveMinDeliveryAvailable?: boolean;
  fiveMinDeliveryPincode?: string;
  dealShowcaseTitle?: string;
  dealItem1Image?: string;
  dealItem1Badge?: string;
  dealItem1Title?: string;
  dealItem1Link?: string;
  dealItem2Image?: string;
  dealItem2Badge?: string;
  dealItem2Title?: string;
  dealItem2Link?: string;
  dealItem3Image?: string;
  dealItem3Badge?: string;
  dealItem3Title?: string;
  dealItem3Link?: string;
  dealItem4Image?: string;
  dealItem4Badge?: string;
  dealItem4Title?: string;
  dealItem4Link?: string;
  singleBannerImage?: string;
  singleBannerCategory?: string;
  singleBannerTitle?: string;
  singleBannerSubtitle?: string;
  singleBannerCtaText?: string;
  fiveMinMinOrderValue?: number;
}
