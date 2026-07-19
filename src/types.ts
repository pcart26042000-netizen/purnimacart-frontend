export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  rating: number;
  reviewCount: number;
  tags: string[];
  description: string;
  isDeal?: boolean;
  dealDiscount?: string;
  features?: string[];
  returnWindow?: string;
  isFiveMinBadge?: boolean;
  isFashionFit?: boolean;
  variants?: { color?: string; image?: string; price?: number; stock?: number }[];
  hasSizes?: boolean;
  sizes?: { size: string; stock: number }[];
  stock?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export type PageType =
  | 'home'
  | 'category'
  | 'product-detail'
  | 'offers'
  | 'wishlist'
  | 'checkout'
  | 'checkout-success'
  | 'my-orders'
  | 'order-details'
  | 'addresses'
  | 'contact'
  | 'about-us'
  | 'faq'
  | 'privacy-policy'
  | 'terms-conditions'
  | 'refund-return-policy'
  | 'shipping-policy'
  | 'cancellation-policy'
  | 'cookie-policy'
  | 'admin';

export type AdminSection =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'orders'
  | 'customers'
  | 'coupons'
  | 'banners'
  | 'settings';

export interface Category {
  id: string;
  name: string;
  iconName: string;
  count: number;
  image?: string;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  date: string;
  comment: string;
}


