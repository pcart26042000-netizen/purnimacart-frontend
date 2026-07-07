import React from 'react';
import {
  Blocks,
  Cookie,
  Shirt,
  Sparkles,
  Gift,
  Watch,
  Image as ImageIcon,
  Grid,
  ShoppingBag,
  Star,
} from 'lucide-react';
import { Category } from '../types';

interface CategoryListProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export default function CategoryList({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryListProps) {
  const getIcon = (iconName: string, size = 26) => {
    switch (iconName) {
      case 'grid':
        return <Grid size={size} />;
      case 'smart_toy':
        return <Blocks size={size} />;
      case 'cake':
        return <Cookie size={size} />;
      case 'apparel':
        return <Shirt size={size} />;
      case 'face_6':
        return <Sparkles size={size} />;
      case 'featured_seasonal_and_gifts':
        return <Gift size={size} />;
      case 'watch':
        return <Watch size={size} />;
      case 'photo_frame':
        return <ImageIcon size={size} />;
      default:
        return <ShoppingBag size={size} />;
    }
  };

  return (
    <div className="w-full bg-white rounded-[24px] border border-[#e8eff8] shadow-[0_10px_28px_rgba(13,71,161,0.10)] px-2.5 py-3 md:px-3 md:py-3.5 animate-fade-in">
      <div className="flex items-start gap-2 overflow-x-auto hide-scrollbar scroll-smooth justify-start md:justify-center">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          const isDeals = /deal/i.test(cat.name) || /deal/i.test(cat.id);
          const iconSize = isActive ? 32 : 30;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="relative flex flex-col items-center shrink-0 group focus:outline-none cursor-pointer w-[74px] sm:w-[80px] md:w-[86px]"
            >
              {isDeals && (
                <span className="absolute -top-1.5 right-0.5 z-10 rounded-full bg-[#ff1f2d] px-2 py-0.5 text-[9px] font-black uppercase text-white shadow-sm">
                  Hot
                </span>
              )}

              <div
                className={`w-14 h-14 sm:w-[58px] sm:h-[58px] rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 ${
                  isActive
                    ? 'bg-[#eef6ff] shadow-[0_8px_18px_rgba(11,124,255,0.16)] scale-105'
                    : 'bg-white shadow-[0_6px_12px_rgba(13,71,161,0.05)] group-hover:shadow-[0_8px_16px_rgba(13,71,161,0.08)] group-hover:-translate-y-0.5'
                }`}
              >
                {cat.id === 'all' ? (
                  <span className="flex items-center justify-center w-full h-full rounded-full bg-white text-[#2f80ff] shadow-inner">
                    <Star size={iconSize} fill="currentColor" strokeWidth={2.25} />
                  </span>
                ) : cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className={isActive ? 'text-[#0b7cff]' : 'text-[#1f66cf]'}>
                    {getIcon(cat.iconName, iconSize)}
                  </span>
                )}
              </div>

              <span
                className={`mt-2 text-[11px] sm:text-xs font-semibold tracking-tight capitalize text-center w-full leading-tight ${
                  isActive ? 'text-[#0b63d1] font-black' : 'text-[#1f2937] group-hover:text-[#0b63d1]'
                }`}
              >
                {cat.name}
              </span>

              <span
                className={`mt-1 h-1.5 rounded-full transition-all duration-300 ${
                  isActive ? 'w-6 bg-[#0b7cff]' : 'w-0 bg-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
