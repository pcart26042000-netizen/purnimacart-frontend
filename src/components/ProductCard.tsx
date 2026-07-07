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
      className="bg-white rounded-2xl border border-gray-150 overflow-hidden product-card-shadow group relative cursor-pointer flex flex-col h-full justify-between transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]"
    >
      {/* Wishlist Button */}
      <button
        onClick={(e) => onToggleWishlist(product, e)}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/95 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all duration-300 shadow-sm active:scale-90 cursor-pointer"
        title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
      >
        <Heart
          size={15}
          className={`transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
        />
      </button>

      {/* Card Image */}
      <div className="aspect-square overflow-hidden relative bg-white p-3 flex items-center justify-center border-b border-gray-100 h-48 sm:h-52">
        <img
          src={product.image}
          alt={product.name}
          className="max-h-full max-w-full object-contain transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Product Content Details */}
      <div className="p-3 flex flex-col flex-grow justify-between">
        <div className="space-y-1">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block">
            {product.category}
          </span>
          <h3 className="font-sans font-bold text-xs text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="bg-[#388e3c] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
              {product.rating} <span className="text-[7px]">â˜…</span>
            </span>
            <span className="text-[10px] text-gray-400 font-semibold">({product.reviewCount})</span>
          </div>

          <div className="pt-1">
            <FiveMinDeliveryBadge product={product} isActive={isFiveMinActive} />
          </div>
        </div>

        <div className="pt-2">
          {/* Pricing Row */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-gray-900 font-black text-sm">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && (
              <>
                <span className="text-gray-400 line-through text-[11px]">
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-[#388e3c] text-[11px] font-bold">
                  {discountPercent}% off
                </span>
              </>
            )}
          </div>

          <button
            onClick={(e) => onAddToCart(product, e)}
            className="w-full py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer shadow-sm shadow-primary/10"
          >
            <ShoppingCart size={13} />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}


