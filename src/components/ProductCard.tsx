import React from 'react';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Product } from '../types';
import FiveMinDeliveryBadge from './FiveMinDeliveryBadge';

interface ProductCardProps {
  key?: string;
  product: Product;
  onProductClick: (id: string) => void;
  onAddToCart: (product: Product, color: string | undefined, price: number | undefined, e: React.MouseEvent) => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product, e: React.MouseEvent) => void;
  isFiveMinActive?: boolean;
}

const COLOR_MAP: Record<string, string> = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  green: 'bg-green-600',
  yellow: 'bg-yellow-400 border border-yellow-500/20',
  black: 'bg-black',
  white: 'bg-white border border-gray-300',
  pink: 'bg-pink-400',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  grey: 'bg-gray-500',
  gray: 'bg-gray-500',
  brown: 'bg-amber-800',
  cream: 'bg-[#fdf6e2] border border-gray-300',
  gold: 'bg-amber-400 border border-amber-500/20',
  silver: 'bg-slate-300',
  classic: 'bg-zinc-800',
};

export default function ProductCard({
  product,
  onProductClick,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
  isFiveMinActive,
}: ProductCardProps) {
  const [activeColor, setActiveColor] = React.useState<string | undefined>(() => {
    return product.variants && product.variants.length > 0 ? product.variants[0].color : undefined;
  });

  const activeVariant = React.useMemo(() => {
    if (!activeColor || !product.variants) return null;
    return product.variants.find((v) => v.color === activeColor);
  }, [activeColor, product.variants]);

  const displayImage = activeVariant?.image || product.image;
  const activePrice = activeVariant?.price !== undefined ? activeVariant.price : product.price;

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - activePrice) / product.originalPrice) * 100)
    : 0;

  return (
    <div
      onClick={() => onProductClick(product.id)}
      className="group relative cursor-pointer flex flex-col w-full transition-all duration-300 hover:translate-y-[-2px]"
    >
      {/* Card Image Container */}
      <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden relative bg-white border border-gray-100 shadow-sm flex items-center justify-center">
        <img
          src={displayImage}
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
            onAddToCart(product, activeColor, activePrice, e);
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
          <span className="text-[11px] sm:text-xs font-extrabold text-primary uppercase tracking-wide">
            {product.category}
          </span>
          <h3 className="font-sans font-bold text-xs sm:text-sm text-gray-900 group-hover:text-primary transition-colors line-clamp-1 flex-1">
            {product.name}
          </h3>
        </div>

        {/* Pricing Row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {product.originalPrice && (
            <span className="text-emerald-600 text-xs sm:text-sm font-extrabold flex items-center">
              ↓{discountPercent}%
            </span>
          )}
          {product.originalPrice && (
            <span className="text-gray-400 line-through text-[11px] sm:text-xs">
              ₹{product.originalPrice.toLocaleString('en-IN')}
            </span>
          )}
          <span className="text-gray-950 font-black text-sm sm:text-base">
            ₹{activePrice.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Color Swatch Dots Selector */}
        {product.variants && product.variants.length > 0 && (
          <div className="flex gap-1.5 items-center my-1.5 flex-wrap">
            {product.variants.map((v) => {
              if (!v.color) return null;
              const normalizedColor = v.color.toLowerCase().trim();
              const colorClass = COLOR_MAP[normalizedColor] || 'bg-gray-200 text-[8px] flex items-center justify-center font-bold text-gray-600 border border-gray-300';
              const isSelected = activeColor === v.color;

              return (
                <button
                  key={v.color}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveColor(v.color);
                  }}
                  className={`w-4 h-4 rounded-full transition-all cursor-pointer ${colorClass} ${
                    isSelected ? 'ring-2 ring-primary ring-offset-1 scale-110' : 'hover:scale-105'
                  }`}
                  title={v.color}
                >
                  {!COLOR_MAP[normalizedColor] && v.color ? v.color[0].toUpperCase() : ''}
                </button>
              );
            })}
          </div>
        )}

        {/* Badges/Offers */}
        <div className="flex flex-wrap gap-1 items-center pt-0.5">
          <FiveMinDeliveryBadge product={product} isActive={isFiveMinActive} />
          {discountPercent >= 20 && (
            <span className="bg-[#fff0ee] text-primary text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded border border-primary/10">
              WOW Offer
            </span>
          )}
        </div>
      </div>
    </div>
  );
}


