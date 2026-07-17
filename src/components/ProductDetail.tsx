import React, { useEffect, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, ShoppingCart, ShieldCheck, Truck, RefreshCw, Send, Star, Share2 } from 'lucide-react';
import { Product, Review } from '../types';
import { useAuth } from '../context/AuthContext';
import { getProductReviews, addProductReview } from '../lib/services/products';
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
  const hasSizeVariants = !!product.hasSizes && !!(product.sizes && product.sizes.length > 0);

  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);
  const [selectedColor, setSelectedColor] = useState(() => {
    return product.variants && product.variants.length > 0 ? (product.variants[0].color || 'Classic') : 'Classic';
  });
  const [selectedSize, setSelectedSize] = useState(() => {
    return product.hasSizes && product.sizes && product.sizes.length > 0 ? product.sizes[0].size : 'Standard';
  });
  
  const { user, signInWithGoogle } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(1);
  const [newReviewUser, setNewReviewUser] = useState('');

  useEffect(() => {
    let active = true;
    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
        const data = await getProductReviews(product.id);
        if (active) setReviews(data);
      } catch (err) {
        console.error('Error fetching product reviews:', err);
      } finally {
        if (active) setLoadingReviews(false);
      }
    };
    fetchReviews();
    return () => {
      active = false;
    };
  }, [product.id]);

  useEffect(() => {
    if (user) {
      setNewReviewUser(user.displayName || '');
    } else {
      setNewReviewUser('');
    }
  }, [user]);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/?product=${product.id}`;
    const shareTitle = product.name;
    const shareText = `Check out this amazing product on PurnimaCart: ${product.name}!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const colors = hasColorVariants ? (product.variants!.map(v => v.color).filter(Boolean) as string[]) : [];
  const sizes = hasSizeVariants ? (product.sizes!.map(s => s.size).filter(Boolean) as string[]) : [];

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("You must be signed in to submit a review.");
      return;
    }
    if (!newReviewComment.trim() || !newReviewUser.trim()) return;

    setSubmittingReview(true);
    try {
      await addProductReview(product.id, {
        userName: newReviewUser.trim(),
        rating: newReviewRating,
        comment: newReviewComment.trim(),
      });

      const newReview: Review = {
        id: Date.now().toString(),
        userName: newReviewUser,
        rating: newReviewRating,
        date: 'Today',
        comment: newReviewComment,
      };

      setReviews((prev) => [newReview, ...prev]);
      setNewReviewComment('');
      setNewReviewRating(1);
    } catch (err) {
      console.error('Failed to submit review:', err);
      alert('Could not submit your review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
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
    setSelectedColor(product.variants && product.variants.length > 0 ? (product.variants[0].color || 'Classic') : 'Classic');
    setSelectedSize(product.hasSizes && product.sizes && product.sizes.length > 0 ? product.sizes[0].size : 'Standard');
    setQuantity(1);
  }, [product.id]);

  const activeImage = activeImageIndex >= 0 ? galleryImages[activeImageIndex] : (activeVariant?.image || galleryImages[0]);
  const activePrice = activeVariant?.price !== undefined ? activeVariant.price : product.price;

  const activeSizeStock = React.useMemo(() => {
    if (!hasSizeVariants || !product.sizes) return Number(product.stock) || 0;
    const sizeObj = product.sizes.find((s) => s.size === selectedSize);
    return sizeObj ? sizeObj.stock : 0;
  }, [selectedSize, product.sizes, product.stock, hasSizeVariants]);

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
              {/* Mobile overlay action buttons */}
              <div className="absolute top-3 left-3 z-10 md:hidden">
                <button
                  type="button"
                  onClick={onBack}
                  className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm border border-[#e8bcb7]/20 shadow flex items-center justify-center text-[#291715] active:scale-90 transition-all cursor-pointer"
                  aria-label="Back"
                >
                  <ArrowLeft size={16} />
                </button>
              </div>

              <div className="absolute top-3 right-3 z-10 md:hidden flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => onToggleWishlist(product)}
                  className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm border border-[#e8bcb7]/20 shadow flex items-center justify-center text-[#291715] active:scale-90 transition-all cursor-pointer"
                  aria-label="Toggle Wishlist"
                >
                  <Heart size={16} className={isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'} />
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm border border-[#e8bcb7]/20 shadow flex items-center justify-center text-[#291715] active:scale-90 transition-all cursor-pointer"
                  aria-label="Share product"
                >
                  <Share2 size={16} className="text-gray-600" />
                </button>
              </div>

              {copied && (
                <div className="absolute top-16 right-3 bg-gray-900/90 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg z-20 animate-bounce">
                  Link copied!
                </div>
              )}

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
                    className={`w-16 h-16 md:w-18 md:h-18 rounded-xl overflow-hidden border transition-all shrink-0 ${activeImageIndex === index
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

            {/* Color Selector (Rendered below main images gallery on both desktop & mobile) */}
            {hasColorVariants && product.variants && product.variants.length > 0 && (
              <div className="pt-3 pb-1 border-t border-gray-100 mt-2">
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
          </div>

          {/* Flipkart Signature Buy/Add Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCartClick}
              disabled={activeSizeStock <= 0}
              id="add-to-cart-detail-btn"
              className={`flex-1 text-white py-4 px-4 rounded-sm font-bold text-xs uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                activeSizeStock <= 0
                  ? 'bg-gray-400 cursor-not-allowed opacity-60'
                  : 'bg-[#ff9f00] hover:bg-[#e08c00] active:scale-95'
              }`}
            >
              <ShoppingCart size={16} />
              {activeSizeStock <= 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button
              onClick={() => {
                if (activeSizeStock <= 0) return;
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
              disabled={activeSizeStock <= 0}
              className={`flex-1 text-white py-4 px-4 rounded-sm font-bold text-xs uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                activeSizeStock <= 0
                  ? 'bg-gray-400 cursor-not-allowed opacity-60'
                  : 'bg-[#fb641b] hover:bg-[#e0540d] active:scale-95'
              }`}
            >
              {activeSizeStock <= 0 ? 'Sold Out' : 'Buy Now'}
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
              {reviews.length > 0 ? (
                <>
                  <span className="bg-[#388e3c] text-white text-xs font-bold px-2 py-0.5 rounded-sm flex items-center gap-0.5">
                    {parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))} <span className="text-[8px]">★</span>
                  </span>
                  <span className="text-xs text-gray-400 font-bold">
                    ({reviews.length} Ratings & {reviews.length} Reviews)
                  </span>
                </>
              ) : (
                <span className="text-xs text-gray-400 font-bold">
                  No ratings or reviews yet
                </span>
              )}
            </div>
          </div>

          {/* Pricing Row */}
          <div className="flex items-baseline gap-3 p-4 bg-gray-50 border border-gray-200 rounded-sm relative">
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
            
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {activeSizeStock <= 0 ? (
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md">
                  Out of Stock
                </span>
              ) : activeSizeStock <= 3 ? (
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md animate-pulse">
                  Only {activeSizeStock} left!
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                  In Stock
                </span>
              )}
            </div>
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


            {/* Size Selector */}
            {hasSizeVariants && sizes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Select Size: <span className="text-primary font-black">{selectedSize}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => alert("Size Chart:\nXS: 34 inch / 86 cm\nS: 36 inch / 91 cm\nM: 38 inch / 96 cm\nL: 40 inch / 101 cm\nXL: 42 inch / 106 cm\nXXL: 44 inch / 111 cm")}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Size Chart
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {sizes.map((size) => {
                    const sizeObj = product.sizes?.find((s) => s.size === size);
                    const sizeStock = sizeObj ? sizeObj.stock : 0;
                    const isOutOfStock = sizeStock <= 0;
                    const isSelected = selectedSize === size;

                    return (
                      <button
                        key={size}
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[44px] h-10 px-3.5 flex items-center justify-center text-xs font-bold rounded-lg border transition-all cursor-pointer select-none ${
                          isSelected
                            ? 'border-primary bg-primary text-white shadow-sm active:scale-95'
                            : isOutOfStock
                            ? 'border-gray-250 bg-gray-50/50 text-gray-300 line-through cursor-not-allowed'
                            : 'border-gray-200 bg-white text-gray-800 hover:border-primary hover:text-primary active:scale-95'
                        }`}
                        title={isOutOfStock ? `${size} (Out of Stock)` : `${size} (${sizeStock} left)`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 pt-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Quantity</span>
              <div className="flex items-center border border-gray-300 rounded-sm bg-white overflow-hidden h-9">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className={`px-3 py-1 text-gray-500 font-bold text-sm select-none ${quantity <= 1 ? 'opacity-30 cursor-not-allowed' : 'hover:text-primary cursor-pointer'}`}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="px-3 text-xs font-bold text-gray-900 w-10 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(Math.min(activeSizeStock, 5), quantity + 1))}
                  className={`px-3 py-1 text-gray-500 font-bold text-sm select-none ${quantity >= Math.min(activeSizeStock, 5) ? 'opacity-30 cursor-not-allowed' : 'hover:text-primary cursor-pointer'}`}
                  disabled={quantity >= Math.min(activeSizeStock, 5)}
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
            {loadingReviews ? (
              <div className="text-center py-8 text-xs text-gray-500 font-semibold">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-500 font-semibold border border-dashed border-gray-200 bg-gray-50/50 rounded-2xl">
                No reviews yet. Be the first to share your thoughts!
              </div>
            ) : (
              reviews.map((review) => {
                const initial = review.userName?.[0]?.toUpperCase() || '?';
                return (
                  <div key={review.id} className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 flex gap-4">
                    {/* User Avatar Circle */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-[#ff9f00] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm select-none">
                      {initial}
                    </div>

                    {/* Review Content */}
                    <div className="flex-grow min-w-0 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <h5 className="font-bold text-xs text-gray-900 flex items-center gap-2 flex-wrap">
                            {review.userName}
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded-full select-none">
                              ✓ Verified Buyer
                            </span>
                          </h5>
                          <span className="text-[10px] text-gray-400 font-medium mt-0.5 block">{review.date}</span>
                        </div>

                        {/* Star Rating Display */}
                        <div className="flex gap-0.5 items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={12}
                              className={star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Comment text */}
                      <p className="text-xs text-gray-600 leading-relaxed font-sans pr-2">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Write a review */}
          <div className="lg:col-span-5">
            {user ? (
              <div className="bg-white p-6 rounded-sm border border-gray-200 shadow-sm">
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
                    disabled={submittingReview}
                    className={`w-full bg-primary hover:bg-[#1254b0] text-white py-2.5 rounded-sm font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                      submittingReview ? 'opacity-65 cursor-not-allowed' : ''
                    }`}
                  >
                    {submittingReview ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send size={12} />
                        Submit Feedback
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-sm border border-gray-200 shadow-sm text-center py-10 space-y-4">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mx-auto">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <h4 className="font-sans font-bold text-sm text-gray-900">Write a Review</h4>
                <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                  You must be signed in to write a review. Share your feedback with other buyers!
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await signInWithGoogle();
                    } catch (err) {
                      console.error('Sign-in failed', err);
                    }
                  }}
                  className="bg-primary hover:bg-[#9a000e] text-white text-xs font-bold px-6 py-2.5 rounded-sm transition-colors cursor-pointer shadow-sm"
                >
                  Sign In with Google
                </button>
              </div>
            )}
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











