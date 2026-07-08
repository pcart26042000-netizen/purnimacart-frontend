import React from 'react';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Product } from '../types';
import FiveMinDeliveryBadge from './FiveMinDeliveryBadge';

interface ProductCardProps {
  key?: string;
  product: Product;
  onProductClick: (id: string) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product, e: React.MouseEvent) => void;
  isFiveMinActive?: boolean;
}

export default function ProductCard({
  product,
  onProductClick,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
  isFiveMinActive,
}: ProductCardProps) {
  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div
      onClick={() => onProductClick(product.id)}
      className="group relative cursor-pointer flex flex-col w-full transition-all duration-300 hover:translate-y-[-2px]"
    >
      {/* Card Image Container */}
      <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden relative bg-white border border-gray-100 shadow-sm flex items-center justify-center">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain p-3.5 transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product, e);
          }}
          className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-[2px] border border-gray-100/50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all duration-300 shadow-sm active:scale-90 cursor-pointer"
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart
            size={14}
            className={`transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
          />
        </button>

        {/* Rating overlay on bottom-left of image */}
        {product.rating > 0 && (
          <div className="absolute bottom-2.5 left-2.5 z-10 bg-white/90 backdrop-blur-[2px] border border-gray-100/50 rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold text-gray-800 flex items-center gap-1 shadow-sm">
            <span>{product.rating}</span>
            <Star size={10} className="fill-emerald-600 text-emerald-600" />
            <span className="text-gray-300 font-normal">|</span>
            <span className="text-gray-500 font-semibold">{product.reviewCount}</span>
          </div>
        )}

        {/* Quick Add to Cart button on bottom-right of image */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product, e);
          }}
          className="absolute bottom-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-hover active:scale-95 transition-all duration-300 shadow-md cursor-pointer"
          title="Add to Cart"
        >
          <ShoppingCart size={13} />
        </button>
      </div>

      {/* Product Content Details */}
      <div className="pt-2.5 px-0.5 flex flex-col gap-0.5">
        {/* Brand/Category & Name row */}
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-[10px] sm:text-[11px] font-extrabold text-primary uppercase tracking-wide">
            {product.category}
          </span>
          <h3 className="font-sans font-bold text-[11px] sm:text-xs text-gray-900 group-hover:text-primary transition-colors line-clamp-1 flex-1">
            {product.name}
          </h3>
        </div>

        {/* Pricing Row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {product.originalPrice && (
            <span className="text-emerald-600 text-[11px] sm:text-xs font-extrabold flex items-center">
              ↓{discountPercent}%
            </span>
          )}
          {product.originalPrice && (
            <span className="text-gray-400 line-through text-[10px] sm:text-[11px]">
              ₹{product.originalPrice.toLocaleString('en-IN')}
            </span>
          )}
          <span className="text-gray-950 font-black text-[12px] sm:text-sm">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Badges/Offers */}
        <div className="flex flex-wrap gap-1 items-center pt-0.5">
          <FiveMinDeliveryBadge product={product} isActive={isFiveMinActive} />
          {discountPercent >= 20 && (
            <span className="bg-[#fff0ee] text-primary text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded border border-primary/10">
              WOW Offer
            </span>
          )}
        </div>
      </div>
    </div>
  );
}


