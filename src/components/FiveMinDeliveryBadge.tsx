import React from 'react';
import type { Product } from '../types';

interface FiveMinDeliveryBadgeProps {
  product: Product;
  isActive?: boolean;
  variant?: 'card' | 'detail';
}

function hasFiveMinMarker(product: Product) {
  return product.isFiveMinBadge || (product.tags?.some((tag) => {
    const clean = tag.toLowerCase().trim();
    return clean === '5 min' || clean === '5min' || clean === '5-min';
  }) ?? false);
}

export default function FiveMinDeliveryBadge({ product, isActive = false, variant = 'card' }: FiveMinDeliveryBadgeProps) {
  if (!isActive || !hasFiveMinMarker(product)) return null;

  const isDetail = variant === 'detail';

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border border-[var(--brand-outline-variant)] bg-white/95 shadow-[0_8px_22px_rgba(229,57,53,0.08)] ${isDetail ? 'px-3 py-1.5' : 'px-2.5 py-1'}`}>
      <span className={`inline-flex items-center justify-center rounded-[6px] bg-[var(--brand-primary)] text-white font-black ${isDetail ? 'h-6 min-w-6 px-1 text-[12px]' : 'h-5 min-w-5 px-1 text-[10px]'}`}>
        5
      </span>
      <span className={`font-black italic text-[var(--brand-primary)] leading-none ${isDetail ? 'text-[14px] tracking-[-0.03em]' : 'text-[11px] tracking-[-0.02em]'}`}>
        MINUTES
      </span>
      <span className={`font-semibold text-[var(--brand-on-surface-variant)] leading-none ${isDetail ? 'text-[13px]' : 'text-[11px]'}`}>
        delivery
      </span>
    </div>
  );
}

