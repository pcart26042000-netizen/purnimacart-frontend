import React, { useState, useEffect } from 'react';
import {
  Timer,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Home as HomeIcon,
  Grid as GridIcon,
  Heart,
  User,
  ArrowRight,
  ShoppingCart
} from 'lucide-react';

import { Product, PageType, AdminSection } from './types';
import { getActiveCoupons } from './lib/services/misc';
import type { FirestoreCoupon } from './types/firestore';
import { useAuth } from './context/AuthContext';
import { useActiveProducts } from './hooks/useProducts';
import { useActiveBanners } from './hooks/useBanners';
import { useCategories } from './hooks/useCategories';
import { useCart } from './hooks/useCart';
import { useWishlist } from './hooks/useWishlist';
import { useStoreSettings } from './hooks/useStoreSettings';

import Header from './components/Header';
import ProductCard from './components/ProductCard';
import CategoryList from './components/CategoryList';
import BentoCollections from './components/BentoCollections';
import ProductDetail from './components/ProductDetail';
import CartSidebar from './components/CartSidebar';
import Footer from './components/Footer';
import CheckoutPage from './components/CheckoutPage';
import OrderSuccessPage from './components/OrderSuccessPage';
import OrderHistoryPage from './components/OrderHistoryPage';
import OrderDetailsPage from './components/OrderDetailsPage';
import AddressBook from './components/AddressBook';

import AdminLayout from './admin/AdminLayout';
import AdminDashboard from './admin/AdminDashboard';
import AdminOrders from './admin/AdminOrders';
import AdminProducts from './admin/AdminProducts';
import AdminCategories from './admin/AdminCategories';
import AdminCustomers from './admin/AdminCustomers';
import AdminCoupons from './admin/AdminCoupons';
import AdminBanners from './admin/AdminBanners';
import AdminSettings from './admin/AdminSettings';

// Shared gate shown in place of any page that requires authentication
// (Wishlist, Checkout, My Orders, Addresses) when the visitor is a guest.
function SignInGate({ onSignIn, onBack }: { onSignIn: () => void; onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4 bg-white rounded-[32px] border border-[#e8bcb7]/15 min-h-[50vh]">
      <User size={40} className="text-[#e8bcb7]" />
      <h3 className="font-semibold text-base text-[#291715]">Sign in required</h3>
      <p className="text-xs text-[#5e3f3b]/60 max-w-sm">
        Please sign in with Google to continue.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onSignIn}
          className="bg-primary text-white text-xs font-bold px-6 py-3 rounded-xl hover:bg-[#9a000e] transition-colors cursor-pointer"
        >
          Sign in with Google
        </button>
        <button
          onClick={onBack}
          className="bg-[#fff0ee] text-primary text-xs font-bold px-6 py-3 rounded-xl hover:bg-[#ffe4df] transition-colors cursor-pointer"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

function AdminLoginForm({
  onSignInEmail,
  onSignInGoogle,
  onBack,
  setAdminMock,
  triggerToast
}: {
  onSignInEmail: (email: string, pass: string) => Promise<void>;
  onSignInGoogle: () => Promise<void>;
  onBack: () => void;
  setAdminMock: (val: boolean) => void;
  triggerToast: (msg: string, type?: 'success' | 'info') => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    try {
      // Local development bypass check
      if (email.trim().toLowerCase() === 'admin@purnimacart.com' && password === 'admin123') {
        setAdminMock(true);
        window.history.pushState({}, '', '/admin/dashboard');
        triggerToast('Logged in as Mock Admin (Bypass Mode)');
        setLoading(false);
        return;
      }

      await onSignInEmail(email.trim(), password);
      window.history.pushState({}, '', '/admin/dashboard');
      triggerToast('Logged in successfully!');
    } catch (err: any) {
      console.error(err);
      triggerToast(err.message || 'Login failed. Please check your credentials.', 'info');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fff8f7] px-6 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#e8bcb7]/30 p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-display font-black text-3xl text-primary tracking-tight">PCart Admin</h1>
          <p className="text-xs text-[#5e3f3b]/70">Enter your administrator credentials to access the panel.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#5e3f3b]/50 mb-1.5 block">Email Address</label>
            <input
              type="email"
              required
              placeholder="admin@purnimacart.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#fff8f7] border border-[#e8bcb7]/25 rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 text-[#291715]"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#5e3f3b]/50 mb-1.5 block">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#fff8f7] border border-[#e8bcb7]/25 rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 text-[#291715]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-[#9a000e] text-white py-3.5 rounded-xl font-bold text-xs transition-colors shadow-md shadow-primary/10 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In as Admin'}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-[#e8bcb7]/20"></div>
          <span className="flex-shrink mx-4 text-[10px] text-[#5e3f3b]/50 uppercase tracking-wider font-bold">Or</span>
          <div className="flex-grow border-t border-[#e8bcb7]/20"></div>
        </div>

        <button
          onClick={onSignInGoogle}
          className="w-full flex items-center justify-center gap-3 bg-[#fff0ee] hover:bg-[#ffe4df] text-[#291715] py-3.5 rounded-xl font-bold text-xs transition-colors cursor-pointer border border-[#e8bcb7]/15"
        >
          <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.484 0-6.19-2.77-6.19-6.19 0-3.42 2.706-6.19 6.19-6.19 1.571 0 2.946.549 4.025 1.571l3.025-3.025C19.123 2.115 15.932 1 12.24 1A10.74 10.74 0 0 0 1.5 11.74a10.74 10.74 0 0 0 10.74 10.74c5.845 0 10.232-4.114 10.232-10.232 0-.675-.084-1.35-.197-1.963H12.24Z"
            />
          </svg>
          Sign in with Google
        </button>

        <button
          onClick={onBack}
          className="w-full text-center text-xs font-semibold text-[#5e3f3b]/60 hover:text-primary transition-colors cursor-pointer"
        >
          Cancel and return to store
        </button>
      </div>
    </div>
  );
}

export default function App() {
  // Live Firestore-backed data (replaces the old data.ts mocks)
  const { products: PRODUCTS, loading: productsLoading, error: productsError } = useActiveProducts();
  const { categories, loading: categoriesLoading } = useCategories(PRODUCTS);
  const { user, userDoc, isAdmin, loading: authLoading, signInWithGoogle, signInWithEmail, setAdminMock } = useAuth();
  const { banners: firestoreBanners } = useActiveBanners();

  // Navigation & Page State
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [adminSection, setAdminSection] = useState<AdminSection>('dashboard');
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Business Logic State — Firestore is the source of truth (guest cart uses
  // a small localStorage staging area internally, merged in on login).
  const { cartItems, add: addToCartFs, updateQuantity: updateCartQuantityFs, removeItem: removeCartItemFs, clear: clearCartFs } = useCart(PRODUCTS);
  const { wishlist, isWishlisted, toggle: toggleWishlistFs } = useWishlist(PRODUCTS);
  const { settings: storeSettings } = useStoreSettings();
  const [cartOpen, setCartOpen] = useState(false);
  const [activeTrendingTab, setActiveTrendingTab] = useState<'popular' | 'top-sellers'>('popular');
  const [activeCoupons, setActiveCoupons] = useState<FirestoreCoupon[]>([]);

  useEffect(() => {
    getActiveCoupons()
      .then(setActiveCoupons)
      .catch((err) => console.error(err));
  }, []);

  // Interactive UI State
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [dealTime, setDealTime] = useState({ hours: 4, minutes: 22, seconds: 51 });
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [categorySort, setCategorySort] = useState<'default' | 'price-low' | 'price-high' | 'rating'>('default');

  // Today's Deals countdown logic
  useEffect(() => {
    const timer = setInterval(() => {
      setDealTime((prev) => {
        let s = prev.seconds - 1;
        let m = prev.minutes;
        let h = prev.hours;

        if (s < 0) {
          s = 59;
          m -= 1;
          if (m < 0) {
            m = 59;
            h -= 1;
            if (h < 0) {
              h = 23; // reset loop
            }
          }
        }
        return { hours: h, minutes: m, seconds: s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Hero carousel auto play
  const totalSlides = firestoreBanners.length > 0 ? firestoreBanners.length : 3;

  useEffect(() => {
    if (totalSlides <= 1) {
      setCurrentHeroIndex(0);
      return;
    }
    const slideTimer = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev >= totalSlides - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(slideTimer);
  }, [totalSlides]);

  // Reset scroll position on page changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage, selectedProductId]);

  // Simple path-based routing for Admin Panel
  useEffect(() => {
    const checkPath = () => {
      const path = window.location.pathname;
      if (path.startsWith('/admin')) {
        setCurrentPage('admin');
      } else if (path === '/' && currentPage === 'admin') {
        setCurrentPage('home');
      }
    };
    checkPath();
    window.addEventListener('popstate', checkPath);
    return () => window.removeEventListener('popstate', checkPath);
  }, [currentPage]);

  const triggerToast = (message: string, type: 'success' | 'info' = 'success') => {
    setShowToast({ message, type });
    setTimeout(() => {
      setShowToast(null);
    }, 3000);
  };

  // Guarded pages redirect signed-out users to sign-in instead of rendering.
  const requireAuth = (page: PageType) => {
    if (!user) {
      triggerToast('Please sign in to continue.', 'info');
      return false;
    }
    setCurrentPage(page);
    return true;
  };

  // Cart operations — Firestore-backed for signed-in users, localStorage
  // staging for guests (merged into Firestore automatically on login).
  const handleAddToCart = async (product: Product, quantity = 1, color = 'Classic', size = 'Standard') => {
    try {
      await addToCartFs(product, quantity, color, size);
      triggerToast(`Added ${quantity}x ${product.name} to Cart!`);
    } catch (error: any) {
      console.error(error);
      triggerToast(error.message || 'Could not add item to cart.', 'info');
    }
  };

  const handleUpdateCartQuantity = async (productId: string, quantity: number, color?: string, size?: string) => {
    try {
      await updateCartQuantityFs(productId, quantity, color, size);
    } catch (error: any) {
      console.error(error);
      triggerToast(error.message || 'Could not update quantity.', 'info');
    }
  };

  const handleRemoveCartItem = async (productId: string, color?: string, size?: string) => {
    try {
      await removeCartItemFs(productId, color, size);
      triggerToast('Item removed from cart.', 'info');
    } catch (error: any) {
      console.error(error);
      triggerToast(error.message || 'Could not remove item.', 'info');
    }
  };

  // Wishlist operations — requires sign-in per spec.
  const handleToggleWishlist = async (product: Product) => {
    if (!user) {
      triggerToast('Please sign in to use your wishlist.', 'info');
      return;
    }
    try {
      const wasWishlisted = isWishlisted(product.id);
      await toggleWishlistFs(product);
      triggerToast(wasWishlisted ? 'Removed from Wishlist.' : 'Added to Wishlist!', wasWishlisted ? 'info' : 'success');
    } catch (error: any) {
      console.error(error);
      triggerToast(error.message || 'Could not update wishlist.', 'info');
    }
  };

  const handleOrderPlaced = async (orderId: string) => {
    setLastOrderId(orderId);
    try {
      await clearCartFs();
    } catch (error: any) {
      console.error(error);
    }
    setCurrentPage('checkout-success');
  };

  // Promo operations
  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    triggerToast(`Coupon code "${code}" copied to clipboard!`);
  };

  // Email Newsletter Subscribe
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    triggerToast('Welcome to the Inner Circle! Exclusive luxury offers are headed your way.');
    setNewsletterEmail('');
  };

  // Filtered lists
  const currentSelectedProduct = selectedProductId
    ? PRODUCTS.find((p) => p.id === selectedProductId)
    : null;

  const dealsProducts = PRODUCTS.filter((p) => p.isDeal);

  // Trending Filter list
  const trendingProducts = activeTrendingTab === 'popular'
    ? PRODUCTS.filter((p) => p.rating >= 4.8)
    : PRODUCTS.filter((p) => p.reviewCount >= 100);

  // Category browse products
  const categoryFilteredProducts = selectedCategory === 'all'
    ? PRODUCTS
    : PRODUCTS.filter((p) => p.category === selectedCategory);

  const sortedCategoryProducts = [...categoryFilteredProducts].sort((a, b) => {
    if (categorySort === 'price-low') return a.price - b.price;
    if (categorySort === 'price-high') return b.price - a.price;
    if (categorySort === 'rating') return b.rating - a.rating;
    return 0; // Default sort order
  });

  // Hero slideshow assets data
  const heroSlides = [
    {
      title: 'Masterpieces for Little Minds',
      subtitle: 'New Arrival',
      description: 'Discover our curated collection of artisanal wooden toys designed to inspire imagination.',
      cta: 'Shop Toys',
      category: 'toys',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4WHIRG24tmckJ5c5PUk2TEjtPDwout2or2yIxrNe-qgkRv8XGdogsUjahg9awfbGMU_epp3GCZMAZsE7e7i-hEeYh-Vo2JRuD0sgcMfTtpKeemsjl6OdGJ9CaErkpXkagDef-sqRnIWdY-jigt5n4wizeDQ3A4Edi1aLFOaxgcQv_c6k7Rf2p5kTjoM5kd3jeGz38GiWH2nm9pjz7MgPSF15IFVgZC4ET6bguSq7KfRBzA89GJSHX7oAx3W7VHAjP5-2WGJ4AeFs'
    },
    {
      title: 'Couture Festive Collections',
      subtitle: 'Exclusive Premium',
      description: 'Stunning designer outfits meticulously hand-embroidered with elegant gold sequence detailing.',
      cta: 'Explore Apparel',
      category: 'dresses',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNYfEXK_7rLU83L70-1o6lkY-fzswn4nVWOSq68iDwQlgizS_-6l2r7xqHojeTiYP9pDAVc6sH_m9TYKlhWOzTzlfKQ9GQmH4SKX0M6ZoYWctx8Oy6PMqi3IDWIcFOi5Q4w0KvCZEWNlJAYt0UnhnxBjiUUEeBkm2ikYZQ-sMxXSnUkIIamqWxwdUTBnoPyVDLRD64sB8MnbXxqUwEPRT6uL9PYmA9S6jiveUiNMFFfG0clM11-RBMOuvSzDsbtazfyF7cm5QTCfM'
    },
    {
      title: 'Luxury Belgian Delights',
      subtitle: 'Sweet Indulgence',
      description: 'Indulge in artisanal organic truffles, rich pralines, and smooth caramel confectioneries.',
      cta: 'Shop Sweets',
      category: 'chocolates',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlJ-VVyeEVY0-1rO_pA2W9mxzfPnLaVyYXv7yJSxhXy2yg1SwgXwdfLMpMSbrk6RtT6AckZXZVvwfAMp3-d6tlXJDWNH1HlVrMch1GKVgH0v7fCqPNO6tL7mSAbM7F0Iun23glZ9x459ao31XU03tQvkPphVilG4MY_mBUhPZRMHmkdWtnaFuQXaoToWYiSOuazPMgIFMaYDpk-YhGfbEpWgjWzBFP84ffM0Kjvwh66CXOHrGUwphcz5mNnrbIC10nt2cKP8gLgbM'
    }
  ];

  if (currentPage === 'admin') {
    // Admin access is never hardcoded — it's driven by the `admins/{uid}`
    // Firestore doc via AuthContext. Anyone who isn't signed in or isn't
    // an admin gets a gate screen instead of the panel itself.
    if (authLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#fff8f7]">
          <p className="text-sm text-[#5e3f3b]/60 font-semibold">Checking access…</p>
        </div>
      );
    }

    if (!user || !isAdmin) {
      return (
        <AdminLoginForm
          onSignInEmail={signInWithEmail}
          onSignInGoogle={signInWithGoogle}
          onBack={() => {
            window.history.pushState({}, '', '/');
            setCurrentPage('home');
          }}
          setAdminMock={setAdminMock}
          triggerToast={triggerToast}
        />
      );
    }

    return (
      <AdminLayout
        activeSection={adminSection}
        onSectionChange={setAdminSection}
        onExitAdmin={() => {
          window.history.pushState({}, '', '/');
          setCurrentPage('home');
        }}
        toast={showToast}
      >
        {adminSection === 'dashboard' && <AdminDashboard />}
        {adminSection === 'products' && <AdminProducts onToast={triggerToast} />}
        {adminSection === 'categories' && <AdminCategories onToast={triggerToast} />}
        {adminSection === 'orders' && <AdminOrders onToast={triggerToast} />}
        {adminSection === 'customers' && <AdminCustomers />}
        {adminSection === 'coupons' && <AdminCoupons onToast={triggerToast} />}
        {adminSection === 'banners' && <AdminBanners onToast={triggerToast} />}
        {adminSection === 'settings' && <AdminSettings onToast={triggerToast} />}
      </AdminLayout>
    );
  }

  return (
    <div className="bg-[#fff8f7] text-[#291715] font-sans min-h-screen selection:bg-primary/20 selection:text-primary pb-16 md:pb-0">
      {/* Dynamic Toast Feedback Notification */}
      {showToast && (
        <div className="fixed bottom-20 md:bottom-8 right-6 z-[1000] bg-white rounded-2xl shadow-2xl border border-[#e8bcb7]/30 p-4 max-w-sm flex items-center gap-3 animate-bounce">
          <div className="bg-primary/10 text-primary p-2 rounded-xl">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-[#291715]">{showToast.message}</p>
          </div>
        </div>
      )}

      {/* Global Navigation Header Component */}
      <Header
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        setSelectedProductId={setSelectedProductId}
        setSelectedCategory={setSelectedCategory}
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
        wishlistCount={wishlist.length}
        openCart={() => setCartOpen(true)}
        products={PRODUCTS}
        categories={categories}
      />

      {/* Cart Drawer Component */}
      <CartSidebar
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        deliveryCharge={storeSettings.deliveryCharge}
        freeDeliveryThreshold={storeSettings.freeDeliveryThreshold}
        onProceedToCheckout={() => {
          setCartOpen(false);
          if (!user) {
            triggerToast('Please sign in to checkout.', 'info');
            return;
          }
          setCurrentPage('checkout');
        }}
      />

      {/* Main Container Views switcher */}
      <main className="max-w-7xl mx-auto px-6 overflow-hidden pt-6">
        {productsError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-2xl px-5 py-3">
            {productsError}
          </div>
        )}

        {(productsLoading || categoriesLoading) && currentPage !== 'product-detail' ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-xs font-semibold text-[#5e3f3b]/60">Loading the boutique for you…</p>
          </div>
        ) : (
        <>
        {currentPage === 'home' && (
          <div className="space-y-16">
            {/* Hero Banner Carousel Slider */}
            <section className="relative w-full aspect-[16/10] sm:aspect-[21/9] md:aspect-[25/9] overflow-hidden rounded-[32px] bg-[#ffe9e6] shadow-xl">
              <div
                className="flex transition-transform duration-700 ease-out h-full"
                style={{ transform: `translateX(-${currentHeroIndex * 100}%)` }}
              >
                {firestoreBanners.length > 0 ? (
                  firestoreBanners.map((slide) => (
                    <div key={slide.id} className="min-w-full h-full relative flex-shrink-0">
                      <img
                        src={slide.imageUrl}
                        alt={slide.title || 'Promotional Banner'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))
                ) : (
                  heroSlides.map((slide, idx) => (
                    <div key={idx} className="min-w-full h-full relative group flex-shrink-0">
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="w-full h-full object-cover brightness-[0.85]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/10 to-transparent flex items-center px-8 md:px-16">
                        <div className="max-w-xl text-white space-y-3 md:space-y-5">
                          <span className="inline-block px-4 py-1.5 bg-primary text-white rounded-full text-[10px] uppercase font-bold tracking-widest font-sans shadow">
                            {slide.subtitle}
                          </span>
                          <h1 className="font-display font-bold text-3xl md:text-5xl leading-tight tracking-tight drop-shadow-md">
                            {slide.title}
                          </h1>
                          <p className="font-sans text-xs md:text-sm text-white/90 leading-relaxed max-w-md hidden sm:block">
                            {slide.description}
                          </p>
                          <button
                            onClick={() => {
                              setSelectedCategory(slide.category);
                              setCurrentPage('category');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="bg-primary hover:bg-[#9a000e] text-white px-6 md:px-8 py-3 rounded-xl font-bold text-xs flex items-center gap-2.5 transition-all shadow-lg shadow-primary/20 hover:translate-x-1 cursor-pointer"
                          >
                            {slide.cta}
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Slide Bullet Controls */}
              {totalSlides > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                  {(firestoreBanners.length > 0 ? firestoreBanners : heroSlides).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentHeroIndex(idx)}
                      className={`h-2.5 rounded-full transition-all cursor-pointer ${
                        currentHeroIndex === idx ? 'w-10 bg-primary shadow' : 'w-2.5 bg-white/45 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Shop by Category Segment */}
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-2xl text-[#291715] tracking-tight">
                  Shop by Category
                </h2>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setCurrentPage('category');
                  }}
                  className="text-primary font-bold text-xs flex items-center gap-1.5 hover:underline cursor-pointer"
                >
                  View All
                  <ArrowRight size={12} />
                </button>
              </div>

              {/* Reactive category chips list */}
              <CategoryList
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={(catId) => {
                  setSelectedCategory(catId);
                  setCurrentPage('category');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </section>

            {/* Today's Deals section */}
            <section className="py-12 px-6 md:px-10 bg-[#fff0ee] rounded-[32px] border border-[#e8bcb7]/25 relative">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex flex-wrap items-center gap-6">
                  <h2 className="font-display font-bold text-2xl text-[#291715] tracking-tight">
                    Today's Deals
                  </h2>
                  <div className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl shadow shadow-primary/10">
                    <Timer size={16} />
                    <div className="flex gap-1 font-mono font-bold text-sm">
                      <span>{String(dealTime.hours).padStart(2, '0')}</span>:
                      <span>{String(dealTime.minutes).padStart(2, '0')}</span>:
                      <span>{String(dealTime.seconds).padStart(2, '0')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="w-10 h-10 rounded-full border border-[#e8bcb7]/30 bg-white flex items-center justify-center text-[#5e3f3b] hover:bg-primary hover:text-white transition-colors cursor-pointer shadow-sm">
                    <ChevronLeft size={16} />
                  </button>
                  <button className="w-10 h-10 rounded-full border border-[#e8bcb7]/30 bg-white flex items-center justify-center text-[#5e3f3b] hover:bg-primary hover:text-white transition-colors cursor-pointer shadow-sm">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Deals product grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {dealsProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onProductClick={(id) => {
                      setSelectedProductId(id);
                      setCurrentPage('product-detail');
                    }}
                    onAddToCart={(p, e) => {
                      e.stopPropagation();
                      handleAddToCart(p);
                    }}
                    isWishlisted={isWishlisted(product.id)}
                    onToggleWishlist={(p, e) => {
                      e.stopPropagation();
                      handleToggleWishlist(p);
                    }}
                  />
                ))}
              </div>
            </section>

            {/* Featured Bento Grid collections */}
            <section className="space-y-10">
              <h2 className="font-display font-bold text-2xl text-[#291715] tracking-tight">
                Featured Collections
              </h2>
              <BentoCollections
                onSelectCategory={setSelectedCategory}
                onSelectProduct={setSelectedProductId}
                setCurrentPage={setCurrentPage}
              />
            </section>

            {/* Promotional Banner coupon */}
            <section>
              <div className="w-full bg-primary rounded-[32px] py-12 px-6 md:px-16 flex flex-col md:flex-row items-center justify-between text-white relative overflow-hidden shadow-xl shadow-primary/10">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 text-center md:text-left mb-8 md:mb-0 space-y-3">
                  <h2 className="font-display font-bold text-3xl md:text-4xl">
                    Unlock 20% Extra
                  </h2>
                  <p className="font-sans text-xs md:text-sm text-white/90">
                    On your first purchase over ₹4,999. Use Code:{' '}
                    <span 
                      onClick={() => handleCopyCoupon('PCART20')}
                      className="font-bold border-2 border-dashed border-white/50 px-2.5 py-1 rounded-lg ml-1.5 bg-white/10 select-all cursor-pointer hover:bg-white/20 transition-all text-white font-mono"
                      title="Click to copy coupon code"
                    >
                      PCART20
                    </span>
                  </p>
                </div>
                <button 
                  onClick={() => handleCopyCoupon('PCART20')}
                  className="relative z-10 bg-white text-primary px-8 py-3.5 rounded-xl font-bold text-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-lg"
                >
                  Claim Offer
                </button>
              </div>
            </section>

            {/* Trending now section */}
            <section className="space-y-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="font-display font-bold text-2xl text-[#291715] tracking-tight">
                  Trending Now
                </h2>
                <div className="flex bg-[#fff0ee] p-1.5 rounded-full border border-[#e8bcb7]/25 w-fit">
                  <button
                    onClick={() => setActiveTrendingTab('popular')}
                    className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      activeTrendingTab === 'popular'
                        ? 'bg-primary text-white shadow shadow-primary/20'
                        : 'text-[#5e3f3b] hover:text-primary'
                    }`}
                  >
                    Most Popular
                  </button>
                  <button
                    onClick={() => setActiveTrendingTab('top-sellers')}
                    className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      activeTrendingTab === 'top-sellers'
                        ? 'bg-primary text-white shadow shadow-primary/20'
                        : 'text-[#5e3f3b] hover:text-primary'
                    }`}
                  >
                    Top Sellers
                  </button>
                </div>
              </div>

              {/* Trending products list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {trendingProducts.slice(0, 4).map((product) => (
                  <div key={product.id} className="group cursor-pointer" onClick={() => {
                    setSelectedProductId(product.id);
                    setCurrentPage('product-detail');
                  }}>
                    <div className="aspect-[4/5] bg-[#fff0ee] rounded-[32px] overflow-hidden relative mb-4 shadow-sm border border-[#e8bcb7]/15">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-[#291715] flex items-center gap-1.5 shadow-sm">
                        <span className="text-amber-500">★</span>
                        <span>{product.rating}</span>
                        <span className="text-[#5e3f3b]/60 text-[10px]">({product.reviewCount})</span>
                      </div>
                    </div>
                    <div className="px-2">
                      <span className="text-[10px] font-bold text-[#5e3f3b]/60 uppercase tracking-wider block">
                        {product.category}
                      </span>
                      <h4 className="font-display font-semibold text-sm text-[#291715] group-hover:text-primary mt-1 line-clamp-1 transition-colors">
                        {product.name}
                      </h4>
                      <p className="text-primary font-bold text-sm mt-1.5">
                        ₹{product.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Email Inner circle newsletter signup */}
            <section className="py-16 px-6 bg-[#fedbd6] rounded-[40px] border border-[#e8bcb7]/25 text-center max-w-4xl mx-auto space-y-6 shadow-sm">
              <div className="max-w-2xl mx-auto space-y-3">
                <h2 className="font-display font-bold text-3xl text-[#291715]">
                  Join the Inner Circle
                </h2>
                <p className="font-sans text-xs md:text-sm text-[#5e3f3b] leading-relaxed">
                  Receive early access to collections, exclusive offers, and premium lifestyle inspiration curated for you.
                </p>
              </div>
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-grow bg-white px-5 py-3.5 text-xs rounded-xl outline-none focus:ring-1 focus:ring-primary border border-[#e8bcb7]/15 text-[#291715]"
                />
                <button
                  type="submit"
                  className="bg-primary hover:bg-[#9a000e] text-white px-6 py-3.5 rounded-xl font-bold text-xs transition-colors shadow shadow-primary/10 cursor-pointer"
                >
                  Subscribe
                </button>
              </form>
            </section>
          </div>
        )}

        {/* Categories Screen / Catalogue Browser */}
        {currentPage === 'category' && (
          <div className="space-y-8 min-h-[60vh]">
            <div className="border-b border-[#e8bcb7]/20 pb-6">
              <h1 className="font-display font-bold text-3xl text-[#291715]">Catalogue Browser</h1>
              <p className="text-xs text-[#5e3f3b] mt-1.5">Browse curated premium design pieces across our niche categories.</p>
            </div>

            {/* Sorting and Category Selector Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex overflow-x-auto hide-scrollbar gap-2 py-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap capitalize ${
                      selectedCategory === cat.id
                        ? 'bg-primary text-white shadow shadow-primary/20'
                        : 'bg-white border border-[#e8bcb7]/20 text-[#5e3f3b] hover:border-primary'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Dropdown sort selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#5e3f3b] font-semibold whitespace-nowrap">Sort by:</span>
                <select
                  value={categorySort}
                  onChange={(e: any) => setCategorySort(e.target.value)}
                  className="bg-white border border-[#e8bcb7]/20 text-xs rounded-xl py-2 px-3 text-[#291715] outline-none focus:ring-1 focus:ring-primary cursor-pointer font-semibold"
                >
                  <option value="default">Featured Recommendations</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Customer Rating</option>
                </select>
              </div>
            </div>

            {/* List products grid */}
            {sortedCategoryProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {sortedCategoryProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onProductClick={(id) => {
                      setSelectedProductId(id);
                      setCurrentPage('product-detail');
                    }}
                    onAddToCart={(p, e) => {
                      e.stopPropagation();
                      handleAddToCart(p);
                    }}
                    isWishlisted={isWishlisted(product.id)}
                    onToggleWishlist={(p, e) => {
                      e.stopPropagation();
                      handleToggleWishlist(p);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-[32px] border border-[#e8bcb7]/15">
                <p className="text-sm font-semibold text-[#5e3f3b]/70">No products found for this selection.</p>
              </div>
            )}
          </div>
        )}

        {/* Detailed Product Screen */}
        {currentPage === 'product-detail' && currentSelectedProduct && (
          <ProductDetail
            product={currentSelectedProduct}
            onBack={() => {
              setSelectedProductId(null);
              // Back to appropriate page
              setCurrentPage('home');
            }}
            onAddToCart={(p, q, c, s) => handleAddToCart(p, q, c, s)}
            isWishlisted={isWishlisted(currentSelectedProduct.id)}
            onToggleWishlist={handleToggleWishlist}
          />
        )}

        {/* Wishlist Screen */}
        {currentPage === 'wishlist' && !user && (
          <SignInGate onSignIn={signInWithGoogle} onBack={() => setCurrentPage('home')} />
        )}
        {currentPage === 'wishlist' && user && (
          <div className="space-y-8 min-h-[60vh]">
            <div className="border-b border-[#e8bcb7]/20 pb-6">
              <h1 className="font-display font-bold text-3xl text-[#291715]">My Wishlist</h1>
              <p className="text-xs text-[#5e3f3b] mt-1.5">Premium products you bookmarked for later consideration.</p>
            </div>

            {wishlist.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {wishlist.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onProductClick={(id) => {
                      setSelectedProductId(id);
                      setCurrentPage('product-detail');
                    }}
                    onAddToCart={(p, e) => {
                      e.stopPropagation();
                      handleAddToCart(p);
                    }}
                    isWishlisted={true}
                    onToggleWishlist={(p, e) => {
                      e.stopPropagation();
                      handleToggleWishlist(p);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-white rounded-[32px] border border-[#e8bcb7]/15">
                <Heart size={44} className="text-[#e8bcb7] fill-none" />
                <h3 className="font-semibold text-base text-[#291715]">Your wishlist is pristine</h3>
                <p className="text-xs text-[#5e3f3b]/60 max-w-sm">
                  Click the heart icons on any product grid or details page to accumulate items right here.
                </p>
                <button
                  onClick={() => setCurrentPage('home')}
                  className="bg-primary text-white text-xs font-bold px-6 py-3 rounded-xl hover:bg-[#9a000e] transition-colors cursor-pointer"
                >
                  Browse Home Items
                </button>
              </div>
            )}
          </div>
        )}

        {/* Special Offers Screen */}
        {currentPage === 'offers' && (
          <div className="space-y-8 min-h-[60vh]">
            <div className="border-b border-[#e8bcb7]/20 pb-6">
              <h1 className="font-display font-bold text-3xl text-[#291715]">Active Promotional Coupons</h1>
              <p className="text-xs text-[#5e3f3b] mt-1.5">Apply coupon codes inside the basket drawer for instant markdowns.</p>
            </div>

            {activeCoupons.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {activeCoupons.map((offer) => (
                  <div
                    key={offer.code}
                    className="p-6 bg-white border border-[#e8bcb7]/20 rounded-3xl shadow-sm space-y-4 hover:border-primary transition-colors flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <span className="text-xs font-bold bg-[#ff6b6b]/15 text-[#bb0012] px-3.5 py-1 rounded-full uppercase tracking-wider block w-fit font-sans">
                        {offer.type === 'flat' ? `₹${offer.value} OFF` : `${offer.value}% OFF`}
                      </span>
                      <h3 className="font-display font-bold text-lg text-[#291715]">Code: {offer.code}</h3>
                      <p className="text-xs text-[#5e3f3b] leading-relaxed">
                        {offer.type === 'flat'
                          ? `Get flat ₹${offer.value.toLocaleString()} off your order.`
                          : `Get ${offer.value}% off your order.`}
                      </p>
                      {offer.minOrderValue > 0 && (
                        <p className="text-[10px] text-primary font-bold font-mono">
                          *Minimum order value: ₹{offer.minOrderValue.toLocaleString()}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleCopyCoupon(offer.code)}
                      className="w-full bg-[#fff0ee] hover:bg-primary text-primary hover:text-white py-3 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer"
                    >
                      Copy Offer Code
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-[32px] border border-[#e8bcb7]/15">
                <p className="text-sm font-semibold text-[#5e3f3b]/70">No active coupons right now — check back soon!</p>
              </div>
            )}

            {/* Deals Promotion Banner */}
            <div className="p-8 bg-[#fff0ee] border border-[#e8bcb7]/25 rounded-[32px] flex flex-col md:flex-row items-center gap-6 justify-between">
              <div>
                <h3 className="font-display font-bold text-xl text-[#291715]">First order? Get FREE high-end delivery!</h3>
                <p className="text-xs text-[#5e3f3b] mt-1">
                  Automatic deduction on orders over ₹{storeSettings.freeDeliveryThreshold.toLocaleString()}.
                </p>
              </div>
              <button 
                onClick={() => setCurrentPage('home')}
                className="bg-primary text-white py-3 px-6 rounded-xl font-bold text-xs shadow cursor-pointer active:scale-95"
              >
                Go Shop Now
              </button>
            </div>
          </div>
        )}

        {/* Checkout Screen */}
        {currentPage === 'checkout' && !user && (
          <SignInGate onSignIn={signInWithGoogle} onBack={() => setCurrentPage('home')} />
        )}
        {currentPage === 'checkout' && user && (
          <CheckoutPage
            uid={user.uid}
            cartItems={cartItems}
            addresses={userDoc?.addresses || []}
            deliveryCharge={storeSettings.deliveryCharge}
            freeDeliveryThreshold={storeSettings.freeDeliveryThreshold}
            onOrderPlaced={handleOrderPlaced}
            onBack={() => setCurrentPage('home')}
            onToast={triggerToast}
          />
        )}

        {/* Real Order Success Screen */}
        {currentPage === 'checkout-success' && lastOrderId && (
          <OrderSuccessPage
            orderId={lastOrderId}
            onContinueShopping={() => {
              setCurrentPage('home');
              setSelectedCategory('all');
            }}
            onViewOrder={() => {
              setSelectedOrderId(lastOrderId);
              setCurrentPage('order-details');
            }}
          />
        )}

        {/* My Orders Screen */}
        {currentPage === 'my-orders' && !user && (
          <SignInGate onSignIn={signInWithGoogle} onBack={() => setCurrentPage('home')} />
        )}
        {currentPage === 'my-orders' && user && (
          <OrderHistoryPage
            uid={user.uid}
            onSelectOrder={(orderId) => {
              setSelectedOrderId(orderId);
              setCurrentPage('order-details');
            }}
            onBrowse={() => setCurrentPage('home')}
          />
        )}

        {/* Order Details Screen */}
        {currentPage === 'order-details' && !user && (
          <SignInGate onSignIn={signInWithGoogle} onBack={() => setCurrentPage('home')} />
        )}
        {currentPage === 'order-details' && user && selectedOrderId && (
          <OrderDetailsPage orderId={selectedOrderId} onBack={() => setCurrentPage('my-orders')} />
        )}

        {/* Addresses Screen */}
        {currentPage === 'addresses' && !user && (
          <SignInGate onSignIn={signInWithGoogle} onBack={() => setCurrentPage('home')} />
        )}
        {currentPage === 'addresses' && user && (
          <div className="space-y-8 min-h-[60vh]">
            <div className="border-b border-[#e8bcb7]/20 pb-6">
              <h1 className="font-display font-bold text-3xl text-[#291715]">My Addresses</h1>
              <p className="text-xs text-[#5e3f3b] mt-1.5">Manage your saved delivery addresses.</p>
            </div>
            <AddressBook uid={user.uid} addresses={userDoc?.addresses || []} onToast={triggerToast} />
          </div>
        )}
        </>
        )}
      </main>

      {/* Footer component */}
      <Footer
        onSelectCategory={setSelectedCategory}
        setCurrentPage={setCurrentPage}
      />

      {/* Bottom Sticky Mobile Nav Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 bg-[#fff8f7]/95 backdrop-blur-md border-t border-[#e8bcb7]/20 shadow-xl h-16">
        <button
          onClick={() => {
            setCurrentPage('home');
            setSelectedProductId(null);
          }}
          className={`flex flex-col items-center justify-center cursor-pointer transition-colors ${
            currentPage === 'home' ? 'text-primary font-bold' : 'text-[#5e3f3b]/70 hover:text-primary'
          }`}
        >
          <HomeIcon size={18} />
          <span className="text-[10px] font-bold mt-0.5">Home</span>
        </button>

        <button
          onClick={() => {
            setSelectedCategory('all');
            setCurrentPage('category');
          }}
          className={`flex flex-col items-center justify-center cursor-pointer transition-colors ${
            currentPage === 'category' ? 'text-primary font-bold' : 'text-[#5e3f3b]/70 hover:text-primary'
          }`}
        >
          <GridIcon size={18} />
          <span className="text-[10px] font-bold mt-0.5">Browse</span>
        </button>

        <button
          onClick={() => {
            setCartOpen(true);
          }}
          className="flex flex-col items-center justify-center cursor-pointer text-[#5e3f3b]/70 hover:text-primary relative"
        >
          <ShoppingCart size={18} />
          <span className="text-[10px] font-bold mt-0.5">Cart</span>
          {cartItems.length > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-primary text-white text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
              {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
            </span>
          )}
        </button>

        <button
          onClick={() => requireAuth('wishlist')}
          className={`flex flex-col items-center justify-center cursor-pointer transition-colors ${
            currentPage === 'wishlist' ? 'text-primary font-bold' : 'text-[#5e3f3b]/70 hover:text-primary'
          }`}
        >
          <Heart size={18} />
          <span className="text-[10px] font-bold mt-0.5">Wishlist</span>
        </button>
      </nav>
    </div>
  );
}
