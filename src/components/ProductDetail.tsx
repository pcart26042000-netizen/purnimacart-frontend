import React, { useEffect, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, ShoppingCart, ShieldCheck, Truck, RefreshCw, Send, Star } from 'lucide-react';
import { Product, Review } from '../types';
import { MOCK_REVIEWS } from '../data';
import ProductCard from './ProductCard';
import FiveMinDeliveryBadge from './FiveMinDeliveryBadge';

interface ProductDetailProps {
  product: Product;
  relatedProducts?: Product[];
  onSelectRelatedProduct?: (id: string) => void;
  onBack: () => void;
  onAddToCart: (product: Product, quantity: number, color?: string, size?: string, priceOverride?: number, imageOverride?: string) => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
  onBuyNow?: (product: Product, quantity: number, color?: string, size?: string, priceOverride?: number, imageOverride?: string) => void;
  isFiveMinActive?: boolean;
}

export default function ProductDetail({
  product,
  relatedProducts = [],
  onSelectRelatedProduct,
  onBack,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
  onBuyNow,
  isFiveMinActive,
}: ProductDetailProps) {
  const hasColorVariants = !!(product.variants && product.variants.length > 0);
  const hasSizeVariants = false;

  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(() => {
    return product.variants && product.variants.length > 0 ? (product.variants[0].color || 'Classic') : 'Classic';
  });
  const [selectedSize, setSelectedSize] = useState('Standard');
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewUser, setNewReviewUser] = useState('');

  const colors = hasColorVariants ? (product.variants!.map(v => v.color).filter(Boolean) as string[]) : [];
  const sizes: string[] = [];

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewComment.trim() || !newReviewUser.trim()) return;

    const newReview: Review = {
      id: Date.now().toString(),
      userName: newReviewUser,
      rating: newReviewRating,
      date: 'Today',
      comment: newReviewComment,
    };

    setReviews([newReview, ...reviews]);
    setNewReviewComment('');
    setNewReviewUser('');
    setNewReviewRating(5);
  };

  const activeVariant = React.useMemo(() => {
    if (!hasColorVariants || !product.variants) return null;
    return product.variants.find((v) => v.color === selectedColor);
  }, [selectedColor, product.variants, hasColorVariants]);

  const handleAddToCartClick = () => {
    onAddToCart(
      product,
      quantity,
      hasColorVariants ? selectedColor : undefined,
      hasSizeVariants ? selectedSize : undefined,
      activeVariant?.price,
      activeVariant?.image
    );
    const btn = document.getElementById('add-to-cart-detail-btn');
    if (btn) {
      const originalText = btn.innerHTML;
      btn.innerHTML = '✓ Added!';
      btn.classList.add('bg-green-600');
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.classList.remove('bg-green-600');
      }, 1500);
    }
  };

  const getReturnPolicyLabel = (window?: string) => {
    switch (window) {
      case 'none':
        return 'No Return Allowed';
      case '1-day':
        return '1-Day Replacement';
      case '3-day':
        return '3-Day Replacement';
      case '7-day':
        return '7-Day Replacement';
      case '10-day':
        return '10-Day Replacement';
      default:
        return '7-Day Replacement';
    }
  };

  const galleryImages = product.images && product.images.length > 0 ? product.images : [product.image];
  const [activeImageIndex, setActiveImageIndex] = useState(-1);

  useEffect(() => {
    setActiveImageIndex(-1);
  }, [product.id, product.image, product.images]);

  const activeImage = activeImageIndex >= 0 ? galleryImages[activeImageIndex] : (activeVariant?.image || galleryImages[0]);
  const activePrice = activeVariant?.price !== undefined ? activeVariant.price : product.price;

  const goPrevImage = () => {
    const fallbackLen = galleryImages.length;
    setActiveImageIndex((idx) => {
      const current = idx >= 0 ? idx : 0;
      return current === 0 ? fallbackLen - 1 : current - 1;
    });
  };

  const goNextImage = () => {
    const fallbackLen = galleryImages.length;
    setActiveImageIndex((idx) => {
      const current = idx >= 0 ? idx : 0;
      return current >= fallbackLen - 1 ? 0 : current + 1;
    });
  };

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - activePrice) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="py-3 md:py-6 px-0 max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary mb-6 cursor-pointer transition-colors group"
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
        Back to Products
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 items-start bg-transparent md:bg-white p-0 md:p-6 border-0 md:border md:border-gray-200 rounded-none md:rounded-2xl shadow-none md:shadow-sm overflow-hidden">
        {/* Left Column: Image & Action Buttons */}
        <div className="lg:col-span-5 space-y-4 px-0 md:px-0">
          <div className="space-y-3">
            <div className="aspect-[4/3] w-full rounded-none md:rounded-xl overflow-hidden bg-gradient-to-b from-[#f8fbff] to-white border-0 md:border md:border-gray-200 shadow-none md:shadow-sm relative flex items-center justify-center p-2 md:p-6 h-[260px] md:h-[350px] group">
              <img
                src={activeImage}
                alt={product.name}
                className="max-h-full max-w-full object-contain transition-transform duration-300"
              />
              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPrevImage}
                    className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 border border-[#e8bcb7]/30 shadow-lg flex items-center justify-center text-[#291715] hover:text-primary hover:border-primary transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={goNextImage}
                    className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 border border-[#e8bcb7]/30 shadow-lg flex items-center justify-center text-[#291715] hover:text-primary hover:border-primary transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                    aria-label="Next image"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>

            {galleryImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                {galleryImages.map((image, index) => (
                  <button
                    type="button"
                    key={image + index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`w-16 h-16 md:w-18 md:h-18 rounded-xl overflow-hidden border transition-all shrink-0 ${
                      activeImageIndex === index
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-[#e8bcb7]/20 hover:border-primary/60'
                    }`}
                    aria-label={`View image ${index + 1}`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Flipkart Signature Buy/Add Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCartClick}
              id="add-to-cart-detail-btn"
              className="flex-1 bg-[#ff9f00] hover:bg-[#e08c00] text-white py-4 px-4 rounded-sm font-bold text-xs uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <ShoppingCart size={16} />
              Add to Cart
            </button>
            <button
              onClick={() => {
                if (onBuyNow) {
                  onBuyNow(
                    product,
                    quantity,
                    hasColorVariants ? selectedColor : undefined,
                    hasSizeVariants ? selectedSize : undefined,
                    activeVariant?.price,
                    activeVariant?.image
                  );
                } else {
                  onAddToCart(
                    product,
                    quantity,
                    hasColorVariants ? selectedColor : undefined,
                    hasSizeVariants ? selectedSize : undefined,
                    activeVariant?.price,
                    activeVariant?.image
                  );
                }
              }}
              className="flex-1 bg-[#fb641b] hover:bg-[#e0540d] text-white py-4 px-4 rounded-sm font-bold text-xs uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              Buy Now
            </button>
          </div>
        </div>

        {/* Right Column: Details & Customizers */}
        <div className="lg:col-span-7 space-y-6 lg:pl-4 px-0 md:px-0">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              {product.category} Collection
            </span>
            <div className="flex items-center gap-2.5 flex-wrap mt-1">
              <h1 className="font-sans font-bold text-lg md:text-2xl text-gray-900 leading-snug">
                {product.name}
              </h1>
              <div className="mt-2">
                <FiveMinDeliveryBadge product={product} isActive={isFiveMinActive} variant="detail" />
              </div>
              </div>

            {/* Rating Stars Summary */}
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-[#388e3c] text-white text-xs font-bold px-2 py-0.5 rounded-sm flex items-center gap-0.5">
                {product.rating} <span className="text-[8px]">★</span>
              </span>
              <span className="text-xs text-gray-400 font-bold">
                ({reviews.length} Ratings & {reviews.length} Reviews)
              </span>
            </div>
          </div>

          {/* Pricing Row */}
          <div className="flex items-baseline gap-3 p-4 bg-gray-50 border border-gray-200 rounded-sm">
            <span className="text-2xl font-black text-gray-900">
              ₹{activePrice.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && (
              <>
                <span className="text-gray-400 line-through text-xs font-semibold">
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold text-[#388e3c] bg-green-50 px-2 py-0.5 rounded-sm border border-green-100">
                  {discountPercent}% Off
                </span>
              </>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Product Description</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Customizations selectors */}
          <div className="space-y-4 pt-4 border-t border-gray-150">
            {/* Color Selector */}
            {hasColorVariants && product.variants && product.variants.length > 0 && (
              <div>
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">
                  Selected Color: <span className="text-primary font-black">{selectedColor}</span>
                </span>
                <div className="flex gap-3 flex-wrap">
                  {product.variants.map((v) => {
                    if (!v.color) return null;
                    const isSelected = selectedColor === v.color;

                    return (
                      <button
                        key={v.color}
                        type="button"
                        onClick={() => setSelectedColor(v.color || '')}
                        className={`w-16 h-16 rounded-xl overflow-hidden bg-white border-2 flex items-center justify-center p-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-primary shadow-sm scale-105'
                            : 'border-gray-200/80 hover:border-primary/50'
                        }`}
                        title={v.color}
                      >
                        {v.image ? (
                          <img src={v.image} alt={v.color} className="max-h-full max-w-full object-contain" />
                        ) : (
                          <div className="text-[10px] font-bold text-gray-500 text-center uppercase leading-none px-1">
                            {v.color}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {hasSizeVariants && sizes.length > 0 && (
              <div>
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">
                  Select Size Option: <span className="text-primary font-black">{selectedSize}</span>
                </span>
                <div className="flex gap-2 flex-wrap">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-sm border transition-all cursor-pointer ${selectedSize === size
                          ? 'border-primary bg-primary text-white shadow-sm'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-primary'
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 pt-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Quantity</span>
              <div className="flex items-center border border-gray-300 rounded-sm bg-white overflow-hidden h-9">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 text-gray-500 hover:text-primary font-bold text-sm cursor-pointer"
                >
                  -
                </button>
                <span className="px-3 text-xs font-bold text-gray-900 w-10 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1 text-gray-500 hover:text-primary font-bold text-sm cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Guarantees with dynamic Return policy */}
          <div className="grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-sm border border-gray-200">
            <div className="flex flex-col items-center text-center gap-1.5">
              <Truck size={20} className="text-primary" />
              <span className="text-[10px] font-bold text-gray-900">Free Shipping</span>
              <span className="text-[9px] text-gray-400">Order above threshold</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1.5 border-x border-gray-200 px-1">
              <ShieldCheck size={20} className="text-primary" />
              <span className="text-[10px] font-bold text-gray-900">Secure Gateway</span>
              <span className="text-[9px] text-gray-400">100% Encrypted</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1.5">
              <RefreshCw size={20} className="text-primary" />
              <span className="text-[10px] font-bold text-gray-900">{getReturnPolicyLabel(product.returnWindow)}</span>
              <span className="text-[9px] text-gray-400">Hassle-free swap</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-8 pt-8 border-t border-gray-200 px-0">
        <h3 className="font-sans font-bold text-lg text-gray-900 mb-6">
          Customer Feedbacks ({reviews.length})
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Reviews List */}
          <div className="lg:col-span-7 space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 bg-white border border-gray-200 rounded-sm shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-xs text-gray-900">{review.userName}</h5>
                    <span className="text-[10px] text-gray-400 block mt-0.5">{review.date}</span>
                  </div>
                  <span className="bg-[#388e3c] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                    {review.rating} <span className="text-[8px]">â˜…</span>
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-3 leading-relaxed bg-gray-50 p-2.5 rounded-sm border border-gray-100">
                  {review.comment}
                </p>
              </div>
            ))}
          </div>

          {/* Write a review */}
          <div className="lg:col-span-5 bg-white p-6 rounded-sm border border-gray-200 shadow-sm">
            <h4 className="font-sans font-bold text-sm text-gray-900 mb-4">Write a Review</h4>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diya Sen"
                  value={newReviewUser}
                  onChange={(e) => setNewReviewUser(e.target.value)}
                  className="w-full bg-gray-50 px-3 py-2 text-xs rounded-sm border border-gray-250 outline-none focus:ring-1 focus:ring-primary text-gray-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Star Rating
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReviewRating(star)}
                      className="text-amber-400 focus:outline-none cursor-pointer"
                    >
                      <Star
                        size={20}
                        className={star <= newReviewRating ? 'fill-amber-400' : 'text-gray-200'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Review Comment
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Share your experience with this product..."
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  className="w-full bg-gray-50 px-3 py-2 text-xs rounded-sm border border-gray-250 outline-none focus:ring-1 focus:ring-primary text-gray-800"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-[#1254b0] text-white py-2.5 rounded-sm font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Send size={12} />
                Submit Feedback
              </button>
            </form>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-10 pt-8 border-t border-gray-200 px-0">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-sans font-bold text-lg text-gray-900">You may also like</h3>
              <p className="text-xs text-gray-500 mt-1 capitalize">{product.category} picks chosen for you</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {relatedProducts.slice(0, 8).map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                onProductClick={(id) => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  onSelectRelatedProduct?.(id);
                }}
                onAddToCart={(p, color, price, e) => {
                  e.stopPropagation();
                  const modified = price !== undefined ? { ...p, price } : p;
                  onAddToCart(modified, 1, color);
                }}
                isWishlisted={false}
                onToggleWishlist={(p, e) => {
                  e.stopPropagation();
                  onToggleWishlist(p);
                }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}











