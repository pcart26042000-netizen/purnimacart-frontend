import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertCircle,
  Home as HomeIcon,
  Grid as GridIcon,
  Heart,
  User,
  ArrowRight,
  ShoppingCart,
  Package
} from 'lucide-react';

import { Product, PageType, AdminSection } from './types';
import { getActiveCoupons } from './lib/services/misc';
import type { FirestoreCoupon } from './types/firestore';
import { useAuth } from './context/AuthContext';
import { useActiveProducts } from './hooks/useProducts';
import { useActiveBanners } from './hooks/useBanners';
import { useActiveBrandDeals } from './hooks/useBrandDeals';
import { useCategories } from './hooks/useCategories';
import { useCart } from './hooks/useCart';
import { useWishlist } from './hooks/useWishlist';
import { useStoreSettings } from './hooks/useStoreSettings';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './lib/firebase';

import Header from './components/Header';
import ProductCard from './components/ProductCard';
import ProductDetail from './components/ProductDetail';
import CartSidebar from './components/CartSidebar';
import Footer from './components/Footer';
import CheckoutPage from './components/CheckoutPage';
import OrderSuccessPage from './components/OrderSuccessPage';
import OrderHistoryPage from './components/OrderHistoryPage';
import OrderDetailsPage from './components/OrderDetailsPage';
import AddressBook from './components/AddressBook';
import { PrivacyPolicyPage, TermsConditionsPage, RefundReturnPolicyPage, ShippingPolicyPage, CancellationPolicyPage, ContactPage } from './components/PolicyPages';
import dealSoundbar from './deal_soundbar.png';
import dealPrinter from './deal_printer.png';
import dealHeadphones from './deal_headphones.png';
import dealToyLaptop from './deal_toy_laptop.png';
import singleCollectionBanner from './single_collection_banner.png';

import AdminLayout from './admin/AdminLayout';
import AdminDashboard from './admin/AdminDashboard';
import AdminOrders from './admin/AdminOrders';
import AdminProducts from './admin/AdminProducts';
import AdminCategories from './admin/AdminCategories';
import AdminCustomers from './admin/AdminCustomers';
import AdminCoupons from './admin/AdminCoupons';
import AdminBanners from './admin/AdminBanners';
import AdminBrandDeals from './admin/AdminBrandDeals';
import AdminSettings from './admin/AdminSettings';

const DEFAULT_FIVE_MIN_PINCODE = '732101';
function normalizePincode(value: string) {
  return value.replace(/\D/g, '').slice(0, 6);
}

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
  onBack,
  triggerToast
}: {
  onSignInEmail: (email: string, pass: string) => Promise<void>;
  onBack: () => void;
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--brand-soft-surface)] px-6 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[var(--brand-soft-border)] p-8 shadow-xl space-y-6">
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
              className="w-full bg-[var(--brand-soft-surface)] border border-[#e8bcb7]/25 rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 text-[#291715]"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#5e3f3b]/50 mb-1.5 block">Password</label>
            <input
              type="password"
              required
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[var(--brand-soft-surface)] border border-[#e8bcb7]/25 rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 text-[#291715]"
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

        <button
          onClick={onBack}
          className="w-full text-center text-xs font-semibold text-[#5e3f3b]/60 hover:text-primary transition-colors cursor-pointer pt-2"
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
  const { deals: activeBrandDeals } = useActiveBrandDeals();

  // WhatsApp Profile Completion States
  const [whatsAppName, setWhatsAppName] = useState('');
  const [whatsAppPhone, setWhatsAppPhone] = useState('');
  const [whatsAppReceiveDeals, setWhatsAppReceiveDeals] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // Auto-fill name if userDoc is available but name is empty in our state
  useEffect(() => {
    if (userDoc && !whatsAppName) {
      setWhatsAppName(userDoc.name || user?.displayName || '');
    }
  }, [userDoc, user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const cleanPhone = whatsAppPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      setPhoneError('Please enter a valid 10 to 15 digit WhatsApp number.');
      return;
    }
    
    setPhoneError('');
    setProfileSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: whatsAppName.trim(),
        whatsapp: cleanPhone,
        receiveDeals: whatsAppReceiveDeals
      });
      triggerToast('Profile completed successfully! Welcome, buddy!');
    } catch (err) {
      console.error('Error saving WhatsApp profile details:', err);
      triggerToast('Failed to save profile. Please try again.', 'info');
    } finally {
      setProfileSaving(false);
    }
  };

  const showProfileModal = !!(user && userDoc && !isAdmin && !userDoc.whatsapp);

  // Navigation & Page State
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [adminSection, setAdminSection] = useState<AdminSection>('dashboard');
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Business Logic State â€” Firestore is the source of truth (guest cart uses
  // a small localStorage staging area internally, merged in on login).
  const { cartItems, add: addToCartFs, updateQuantity: updateCartQuantityFs, removeItem: removeCartItemFs, clear: clearCartFs } = useCart(PRODUCTS);
  const { wishlist, isWishlisted, toggle: toggleWishlistFs } = useWishlist(PRODUCTS);
  const { settings: storeSettings } = useStoreSettings();
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCoupons, setActiveCoupons] = useState<FirestoreCoupon[]>([]);
  const [fiveMinPincode, setFiveMinPincode] = useState<string>(() => localStorage.getItem('pcart_five_min_pincode') || '');
  const [showFiveMinModal, setShowFiveMinModal] = useState<boolean>(false);
  const serviceableFiveMinPincode = normalizePincode(storeSettings.fiveMinDeliveryPincode || DEFAULT_FIVE_MIN_PINCODE);
  const isFiveMinActive = !!storeSettings.fiveMinDeliveryAvailable && fiveMinPincode === serviceableFiveMinPincode;

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    if (isFiveMinActive) {
      root.dataset.appTheme = 'five-min';
    } else {
      delete root.dataset.appTheme;
    }

    return () => {
      if (root.dataset.appTheme === 'five-min') {
        delete root.dataset.appTheme;
      }
    };
  }, [isFiveMinActive]);

  const handleFiveMinActivate = (pincode: string) => {
    setFiveMinPincode(pincode);
    localStorage.setItem('pcart_five_min_pincode', pincode);
  };

  const handleFiveMinDeactivate = () => {
    setFiveMinPincode('');
    localStorage.removeItem('pcart_five_min_pincode');
  };

  const handleFiveMinClick = () => {
    if (!storeSettings.fiveMinDeliveryAvailable) {
      triggerToast('5-Minute Delivery is currently unavailable. Please check back later!', 'info');
      return;
    }
    setShowFiveMinModal(true);
  };
  // Interactive UI State
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [categorySort, setCategorySort] = useState<'default' | 'price-low' | 'price-high' | 'rating'>('default');

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

  // Path-based and query deep-link routing for Admin Panel and product shares
  useEffect(() => {
    const checkPath = () => {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const prodId = params.get('product');

      if (path.startsWith('/admin')) {
        setCurrentPage('admin');
      } else if (prodId) {
        setSelectedProductId(prodId);
        setCurrentPage('product-detail');
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

  // Cart operations â€” Firestore-backed for signed-in users, localStorage
  // staging for guests (merged into Firestore automatically on login).
  const handleAddToCart = async (product: Product, quantity = 1, color = 'Classic', size = 'Standard', priceOverride?: number, imageOverride?: string) => {
    try {
      const existing = cartItems.find(
        (item) =>
          item.product.id === product.id &&
          (item.selectedColor || 'Classic') === color &&
          (item.selectedSize || 'Standard') === size
      );
      const currentQty = existing ? existing.quantity : 0;
      if (currentQty + quantity > 5) {
        triggerToast(`You can only add a maximum of 5 quantities of this product.`, 'info');
        return;
      }

      // Check stock limit for selected size variant
      if (product.hasSizes && size) {
        const sizeObj = product.sizes?.find((s) => s.size === size);
        const maxStock = sizeObj ? sizeObj.stock : 0;
        if (currentQty + quantity > maxStock) {
          triggerToast(`Only ${maxStock} items left in stock for size ${size}.`, 'info');
          return;
        }
      }

      const modifiedProduct = {
        ...product,
        price: priceOverride !== undefined ? priceOverride : product.price,
        image: imageOverride || product.image,
      };
      await addToCartFs(modifiedProduct, quantity, color, size);
      triggerToast(`Added ${quantity}x ${product.name} to Cart!`);
    } catch (error: any) {
      console.error(error);
      triggerToast(error.message || 'Could not add item to cart.', 'info');
    }
  };

  const handleBuyNow = async (product: Product, quantity = 1, color = 'Classic', size = 'Standard', priceOverride?: number, imageOverride?: string) => {
    try {
      const existing = cartItems.find(
        (item) =>
          item.product.id === product.id &&
          (item.selectedColor || 'Classic') === color &&
          (item.selectedSize || 'Standard') === size
      );
      const currentQty = existing ? existing.quantity : 0;
      if (currentQty + quantity > 5) {
        triggerToast(`You can only order a maximum of 5 quantities of this product.`, 'info');
        return;
      }

      // Check stock limit for selected size variant
      if (product.hasSizes && size) {
        const sizeObj = product.sizes?.find((s) => s.size === size);
        const maxStock = sizeObj ? sizeObj.stock : 0;
        if (currentQty + quantity > maxStock) {
          triggerToast(`Only ${maxStock} items left in stock for size ${size}.`, 'info');
          return;
        }
      }

      const modifiedProduct = {
        ...product,
        price: priceOverride !== undefined ? priceOverride : product.price,
        image: imageOverride || product.image,
      };
      await addToCartFs(modifiedProduct, quantity, color, size);
      setCurrentPage('checkout');
    } catch (error: any) {
      console.error(error);
      triggerToast(error.message || 'Could not process Buy Now.', 'info');
    }
  };

  const handleUpdateCartQuantity = async (productId: string, quantity: number, color?: string, size?: string) => {
    try {
      if (quantity > 5) {
        triggerToast('You can only order a maximum of 5 quantities of this product.', 'info');
        return;
      }

      // Check stock limit for selected size variant
      const product = PRODUCTS.find((p) => p.id === productId);
      if (product && product.hasSizes && size) {
        const sizeObj = product.sizes?.find((s) => s.size === size);
        const maxStock = sizeObj ? sizeObj.stock : 0;
        if (quantity > maxStock) {
          triggerToast(`Only ${maxStock} items left in stock for size ${size}.`, 'info');
          return;
        }
      }

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

  // Wishlist operations â€” requires sign-in per spec.
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
  const relatedProducts = currentSelectedProduct
    ? PRODUCTS.filter((p) => p.category === currentSelectedProduct.category && p.id !== currentSelectedProduct.id)
    : [];

  const trendingProducts = PRODUCTS;

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
    // Admin access is never hardcoded â€” it's driven by the `admins/{uid}`
    // Firestore doc via AuthContext. Anyone who isn't signed in or isn't
    // an admin gets a gate screen instead of the panel itself.
    if (authLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-soft-surface)]">
          <p className="text-sm text-[#5e3f3b]/60 font-semibold">Checking accessâ€¦</p>
        </div>
      );
    }

    if (!user || !isAdmin) {
      return (
        <AdminLoginForm
          onSignInEmail={signInWithEmail}
          onBack={() => {
            window.history.pushState({}, '', '/');
            setCurrentPage('home');
          }}
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
        {adminSection === 'brand-deals' && <AdminBrandDeals onToast={triggerToast} />}
        {adminSection === 'settings' && <AdminSettings onToast={triggerToast} />}
      </AdminLayout>
    );
  }

  return (
    <div className="bg-[var(--brand-soft-surface)] text-[#291715] font-sans min-h-screen selection:bg-primary/20 selection:text-primary pb-[92px] md:pb-0">
      {/* Dynamic Toast Feedback Notification */}
      {showToast && (
        <div className="fixed bottom-[96px] md:bottom-8 right-6 z-[1000] bg-white rounded-2xl shadow-2xl border border-[var(--brand-soft-border)] p-4 max-w-sm flex items-center gap-3 animate-bounce">
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
        selectedCategory={selectedCategory}
        isFiveMinActive={isFiveMinActive}
        onFiveMinClick={handleFiveMinClick}
        onAddToCart={(product, color, price, e) => {
          e?.stopPropagation();
          handleAddToCart(product, 1, color || 'Classic', 'Standard', price);
        }}
        onToggleWishlist={(product, e) => {
          e?.stopPropagation();
          handleToggleWishlist(product);
        }}
        isWishlisted={isWishlisted}
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
        isFiveMinActive={isFiveMinActive}
        fiveMinMinOrderValue={storeSettings.fiveMinMinOrderValue}
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
            <p className="text-xs font-semibold text-[#5e3f3b]/60">Loading the boutique for youâ€¦</p>
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

            {/* Best For You scrollable Brand Deals section */}
            {activeBrandDeals.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="font-display font-bold text-2xl text-[#291715] tracking-tight">
                    Best For You
                  </h2>
                </div>

                <div className="flex overflow-x-auto gap-5 pb-4 hide-scrollbar snap-x snap-mandatory -mx-6 px-6">
                  {activeBrandDeals.map((deal) => (
                    <div
                      key={deal.id}
                      onClick={() => {
                        setSelectedCategory(deal.link || 'all');
                        setCurrentPage('category');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="min-w-[200px] sm:min-w-[240px] aspect-[4/5] rounded-[32px] overflow-hidden relative cursor-pointer group shadow-md hover:shadow-lg transition-all duration-300 snap-start shrink-0 flex flex-col justify-end"
                    >
                      {/* Image background */}
                      <img
                        src={deal.imageUrl}
                        alt={deal.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        loading="lazy"
                      />
                      
                      {/* Dark gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10 group-hover:via-black/45 transition-colors duration-300" />

                      {/* Content overlays */}
                      <div className="relative z-10 p-5 flex flex-col items-center text-center space-y-2">
                        {/* Brand Badge */}
                        <div className="bg-white px-3 py-1 rounded-sm shadow-sm max-h-7 flex items-center justify-center max-w-[120px] select-none">
                          <span className="text-[10px] font-black text-black tracking-wider uppercase truncate">
                            {deal.brandName}
                          </span>
                        </div>

                        {/* X label */}
                        <div className="text-[10px] font-extrabold text-white/70 tracking-widest uppercase">
                          X
                        </div>

                        {/* Celebrity/Collection Title */}
                        <h4 className="text-sm sm:text-base font-extrabold text-white tracking-tight drop-shadow-md">
                          {deal.title}
                        </h4>
                      </div>

                      {/* Yellow bottom discount banner */}
                      <div className="relative z-10 w-full bg-[#ffd11a] hover:bg-[#e6b800] text-[#1a1100] py-2.5 text-center text-xs font-black uppercase tracking-wider select-none transition-colors border-t border-black/5">
                        {deal.discountText}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Trending now section */}
            <section className="space-y-10">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display font-bold text-2xl text-[#291715] tracking-tight">
                  Trending Now
                </h2>
              </div>

              {/* Trending products list */}
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                {trendingProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onProductClick={(id) => {
                      setSelectedProductId(id);
                      setCurrentPage('product-detail');
                    }}
                    onAddToCart={(p, color, price, e) => {
                      e.stopPropagation();
                      handleAddToCart(p, 1, color || 'Classic', 'Standard', price);
                    }}
                    isWishlisted={isWishlisted(product.id)}
                    onToggleWishlist={(p, e) => {
                      e.stopPropagation();
                      handleToggleWishlist(p);
                    }}
                    isFiveMinActive={isFiveMinActive}
                  />
                ))}
              </div>
            </section>

            {/* 4-Item Deal Showcase Grid Section */}
            <section className="bg-white border border-[#e8bcb7]/25 rounded-[32px] p-6 sm:p-8 max-w-4xl mx-auto shadow-sm space-y-6">
              <h2 className="font-display font-extrabold text-xl sm:text-2xl text-[#291715] tracking-tight">
                {storeSettings.dealShowcaseTitle !== undefined && storeSettings.dealShowcaseTitle !== ''
                  ? storeSettings.dealShowcaseTitle
                  : 'Lowest Prices in the Year'}
              </h2>

              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                {/* Item 1 */}
                <div
                  onClick={() => {
                    const cat = (storeSettings.dealItem1Link || 'accessories').trim().toLowerCase();
                    if (cat) {
                      setSelectedCategory(cat);
                      setCurrentPage('category');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="flex flex-col group cursor-pointer"
                >
                  <div className="w-full aspect-square rounded-2xl bg-gray-50 flex items-center justify-center p-4 border border-gray-100 overflow-hidden relative">
                    <img
                      src={storeSettings.dealItem1Image || dealSoundbar}
                      alt={storeSettings.dealItem1Title || 'Soundbars'}
                      className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    {(storeSettings.dealItem1Badge !== undefined ? storeSettings.dealItem1Badge : 'Up to 80% Off') && (
                      <div className="absolute bottom-0 left-0 right-0 bg-[#9073fa] text-white py-1.5 text-center text-[10px] sm:text-xs font-black tracking-wide uppercase">
                        {storeSettings.dealItem1Badge !== undefined ? storeSettings.dealItem1Badge : 'Up to 80% Off'}
                      </div>
                    )}
                  </div>
                  <span className="mt-3 text-xs sm:text-sm font-bold text-gray-855 text-center tracking-tight group-hover:text-primary transition-colors truncate">
                    {storeSettings.dealItem1Title !== undefined ? storeSettings.dealItem1Title : 'Soundbars'}
                  </span>
                </div>

                {/* Item 2 */}
                <div
                  onClick={() => {
                    const cat = (storeSettings.dealItem2Link || 'accessories').trim().toLowerCase();
                    if (cat) {
                      setSelectedCategory(cat);
                      setCurrentPage('category');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="flex flex-col group cursor-pointer"
                >
                  <div className="w-full aspect-square rounded-2xl bg-gray-50 flex items-center justify-center p-4 border border-gray-100 overflow-hidden relative">
                    <img
                      src={storeSettings.dealItem2Image || dealPrinter}
                      alt={storeSettings.dealItem2Title || 'Multi Function Printers'}
                      className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    {(storeSettings.dealItem2Badge !== undefined ? storeSettings.dealItem2Badge : 'Up to 20% Off') && (
                      <div className="absolute bottom-0 left-0 right-0 bg-[#9073fa] text-white py-1.5 text-center text-[10px] sm:text-xs font-black tracking-wide uppercase">
                        {storeSettings.dealItem2Badge !== undefined ? storeSettings.dealItem2Badge : 'Up to 20% Off'}
                      </div>
                    )}
                  </div>
                  <span className="mt-3 text-xs sm:text-sm font-bold text-gray-855 text-center tracking-tight group-hover:text-primary transition-colors truncate">
                    {storeSettings.dealItem2Title !== undefined ? storeSettings.dealItem2Title : 'Multi Function Printers'}
                  </span>
                </div>

                {/* Item 3 */}
                <div
                  onClick={() => {
                    const cat = (storeSettings.dealItem3Link || 'accessories').trim().toLowerCase();
                    if (cat) {
                      setSelectedCategory(cat);
                      setCurrentPage('category');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="flex flex-col group cursor-pointer"
                >
                  <div className="w-full aspect-square rounded-2xl bg-gray-50 flex items-center justify-center p-4 border border-gray-100 overflow-hidden relative">
                    <img
                      src={storeSettings.dealItem3Image || dealHeadphones}
                      alt={storeSettings.dealItem3Title || 'Headphones'}
                      className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    {(storeSettings.dealItem3Badge !== undefined ? storeSettings.dealItem3Badge : 'Up to 60% Off') && (
                      <div className="absolute bottom-0 left-0 right-0 bg-[#9073fa] text-white py-1.5 text-center text-[10px] sm:text-xs font-black tracking-wide uppercase">
                        {storeSettings.dealItem3Badge !== undefined ? storeSettings.dealItem3Badge : 'Up to 60% Off'}
                      </div>
                    )}
                  </div>
                  <span className="mt-3 text-xs sm:text-sm font-bold text-gray-855 text-center tracking-tight group-hover:text-primary transition-colors truncate">
                    {storeSettings.dealItem3Title !== undefined ? storeSettings.dealItem3Title : 'Headphones'}
                  </span>
                </div>

                {/* Item 4 */}
                <div
                  onClick={() => {
                    const cat = (storeSettings.dealItem4Link || 'toys').trim().toLowerCase();
                    if (cat) {
                      setSelectedCategory(cat);
                      setCurrentPage('category');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="flex flex-col group cursor-pointer"
                >
                  <div className="w-full aspect-square rounded-2xl bg-gray-50 flex items-center justify-center p-4 border border-gray-100 overflow-hidden relative">
                    <img
                      src={storeSettings.dealItem4Image || dealToyLaptop}
                      alt={storeSettings.dealItem4Title || 'Kids Laptops and Tablets'}
                      className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    {(storeSettings.dealItem4Badge !== undefined ? storeSettings.dealItem4Badge : 'Up to 70% Off') && (
                      <div className="absolute bottom-0 left-0 right-0 bg-[#9073fa] text-white py-1.5 text-center text-[10px] sm:text-xs font-black tracking-wide uppercase">
                        {storeSettings.dealItem4Badge !== undefined ? storeSettings.dealItem4Badge : 'Up to 70% Off'}
                      </div>
                    )}
                  </div>
                  <span className="mt-3 text-xs sm:text-sm font-bold text-gray-855 text-center tracking-tight group-hover:text-primary transition-colors truncate">
                    {storeSettings.dealItem4Title !== undefined ? storeSettings.dealItem4Title : 'Kids Laptops and Tablets'}
                  </span>
                </div>
              </div>
            </section>

            {/* Single Collection Banner Section (800x1200 px responsive aspect ratio) */}
            <section className="max-w-4xl mx-auto">
              <div
                onClick={() => {
                  const cat = (storeSettings.singleBannerCategory || 'dresses').trim().toLowerCase();
                  if (cat) {
                    setSelectedCategory(cat);
                    setCurrentPage('category');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="relative aspect-[2/3] sm:aspect-[3/2] w-full rounded-[32px] overflow-hidden border border-[#e8bcb7]/25 shadow-md group cursor-pointer"
              >
                <img
                  src={storeSettings.singleBannerImage || singleCollectionBanner}
                  alt={storeSettings.singleBannerTitle || 'Luxury Apparel'}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-102"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/60 via-black/30 to-transparent flex flex-col justify-end sm:justify-center p-8 sm:p-12 text-white">
                  <div className="max-w-md space-y-3 sm:space-y-4">
                    {(storeSettings.singleBannerSubtitle !== undefined ? storeSettings.singleBannerSubtitle : 'Exclusive Summer Collection') && (
                      <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-widest text-[#fedbd6] bg-primary/20 px-3 py-1 rounded-full border border-primary/25 w-fit block">
                        {storeSettings.singleBannerSubtitle !== undefined ? storeSettings.singleBannerSubtitle : 'Exclusive Summer Collection'}
                      </span>
                    )}
                    {(storeSettings.singleBannerTitle !== undefined ? storeSettings.singleBannerTitle : 'Luxury Apparel') && (
                      <h2 className="text-3xl sm:text-4xl font-display font-black tracking-tight leading-tight">
                        {storeSettings.singleBannerTitle !== undefined ? storeSettings.singleBannerTitle : 'Luxury Apparel'}
                      </h2>
                    )}
                    {(storeSettings.singleBannerCtaText !== undefined ? storeSettings.singleBannerCtaText : 'Shop Collection') && (
                      <button
                        type="button"
                        className="bg-primary hover:bg-[#9a000e] text-white px-6 py-3 rounded-xl font-bold text-xs transition-all shadow-lg shadow-primary/25 cursor-pointer w-fit flex items-center gap-2"
                      >
                        {storeSettings.singleBannerCtaText !== undefined ? storeSettings.singleBannerCtaText : 'Shop Collection'}
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
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
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                {sortedCategoryProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onProductClick={(id) => {
                      setSelectedProductId(id);
                      setCurrentPage('product-detail');
                    }}
                    onAddToCart={(p, color, price, e) => {
                      e.stopPropagation();
                      handleAddToCart(p, 1, color || 'Classic', 'Standard', price);
                    }}
                    isWishlisted={isWishlisted(product.id)}
                    onToggleWishlist={(p, e) => {
                      e.stopPropagation();
                      handleToggleWishlist(p);
                    }}
                    isFiveMinActive={isFiveMinActive}
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
            relatedProducts={relatedProducts}
            onSelectRelatedProduct={(id) => {
              setSelectedProductId(id);
              setCurrentPage('product-detail');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onBack={() => {
              setSelectedProductId(null);
              // Back to appropriate page
              setCurrentPage('home');
            }}
            onAddToCart={(p, q, c, s, price, img) => handleAddToCart(p, q, c || 'Classic', s || 'Standard', price, img)}
            onBuyNow={(p, q, c, s, price, img) => handleBuyNow(p, q, c || 'Classic', s || 'Standard', price, img)}
            isWishlisted={isWishlisted(currentSelectedProduct.id)}
            onToggleWishlist={handleToggleWishlist}
            isFiveMinActive={isFiveMinActive}
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
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                {wishlist.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onProductClick={(id) => {
                      setSelectedProductId(id);
                      setCurrentPage('product-detail');
                    }}
                    onAddToCart={(p, color, price, e) => {
                      e.stopPropagation();
                      handleAddToCart(p, 1, color || 'Classic', 'Standard', price);
                    }}
                    isWishlisted={true}
                    onToggleWishlist={(p, e) => {
                      e.stopPropagation();
                      handleToggleWishlist(p);
                    }}
                    isFiveMinActive={isFiveMinActive}
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
                <p className="text-sm font-semibold text-[#5e3f3b]/70">No active coupons right now â€” check back soon!</p>
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
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveCartItem}
            isFiveMinActive={isFiveMinActive}
            fiveMinMinOrderValue={storeSettings.fiveMinMinOrderValue}
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
        {currentPage === 'privacy-policy' && <PrivacyPolicyPage />}
        {currentPage === 'terms-conditions' && <TermsConditionsPage />}
        {currentPage === 'refund-return-policy' && <RefundReturnPolicyPage />}
        {currentPage === 'shipping-policy' && <ShippingPolicyPage />}
        {currentPage === 'cancellation-policy' && <CancellationPolicyPage />}
        {currentPage === 'contact' && <ContactPage />}
        </>
        )}
      </main>

      {/* Footer component */}
      <Footer
        onSelectCategory={setSelectedCategory}
        setCurrentPage={setCurrentPage}
      />

      {/* Bottom Sticky Mobile Nav Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 pt-2 pb-5 bg-[var(--brand-soft-surface)] backdrop-blur-md border-t border-[#e8bcb7]/20 shadow-xl h-[84px]">
        <button
          onClick={() => {
            setCurrentPage('home');
            setSelectedProductId(null);
          }}
          className={`flex flex-col items-center justify-center cursor-pointer transition-all duration-200 active:scale-95 ${
            currentPage === 'home' ? 'text-primary font-bold scale-105' : 'text-[#5e3f3b]/70 hover:text-primary'
          }`}
        >
          <HomeIcon size={22} />
          <span className="text-[11px] font-bold mt-1">Home</span>
        </button>

        <button
          onClick={() => {
            setSelectedCategory('all');
            setCurrentPage('category');
          }}
          className={`flex flex-col items-center justify-center cursor-pointer transition-all duration-200 active:scale-95 ${
            currentPage === 'category' ? 'text-primary font-bold scale-105' : 'text-[#5e3f3b]/70 hover:text-primary'
          }`}
        >
          <GridIcon size={22} />
          <span className="text-[11px] font-bold mt-1">Browse</span>
        </button>

        <button
          onClick={() => {
            setCartOpen(true);
          }}
          className="flex flex-col items-center justify-center cursor-pointer transition-all duration-200 active:scale-95 text-[#5e3f3b]/70 hover:text-primary relative"
        >
          <ShoppingCart size={22} />
          <span className="text-[11px] font-bold mt-1">Cart</span>
          {cartItems.length > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-primary text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center border border-white">
              {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
            </span>
          )}
        </button>

        <button
          onClick={() => requireAuth('wishlist')}
          className={`flex flex-col items-center justify-center cursor-pointer transition-all duration-200 active:scale-95 ${
            currentPage === 'wishlist' ? 'text-primary font-bold scale-105' : 'text-[#5e3f3b]/70 hover:text-primary'
          }`}
        >
          <Heart size={22} />
          <span className="text-[11px] font-bold mt-1">Wishlist</span>
        </button>

        <button
          onClick={() => requireAuth('my-orders')}
          className={`flex flex-col items-center justify-center cursor-pointer transition-all duration-200 active:scale-95 ${
            currentPage === 'my-orders' ? 'text-primary font-bold scale-105' : 'text-[#5e3f3b]/70 hover:text-primary'
          }`}
        >
          <Package size={22} />
          <span className="text-[11px] font-bold mt-1">Orders</span>
        </button>
      </nav>

      {/* 5 Min Delivery Modal */}
      <FiveMinDeliveryModal
        isOpen={showFiveMinModal}
        onClose={() => setShowFiveMinModal(false)}
        isFiveMinActive={isFiveMinActive}
        activePincode={fiveMinPincode}
        serviceablePincode={storeSettings.fiveMinDeliveryPincode || DEFAULT_FIVE_MIN_PINCODE}
        onActivate={handleFiveMinActivate}
        onDeactivate={handleFiveMinDeactivate}
        triggerToast={triggerToast}
      />

      {/* WhatsApp Profile Completion Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#e8bcb7]/15 p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-scale-up text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-phone-call">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-display font-black text-xl text-[#291715]">Hii Buddy! 👋</h3>
              <p className="text-xs text-[#5e3f3b]/70 leading-relaxed">
                Let's complete your profile to continue shopping. Enter your WhatsApp details to get the best deals and tracking updates directly on WhatsApp!
              </p>
            </div>

            <form onSubmit={handleProfileSave} className="space-y-4 text-left">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diya Sen"
                  value={whatsAppName}
                  onChange={(e) => setWhatsAppName(e.target.value)}
                  className="w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/20 text-[#291715]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={whatsAppPhone}
                  onChange={(e) => {
                    setWhatsAppPhone(e.target.value.replace(/\D/g, ''));
                    setPhoneError('');
                  }}
                  className="w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/20 text-[#291715]"
                />
                {phoneError && (
                  <p className="text-[10px] text-red-500 font-bold mt-1">{phoneError}</p>
                )}
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer pt-1.5 select-none">
                <input
                  type="checkbox"
                  checked={whatsAppReceiveDeals}
                  onChange={(e) => setWhatsAppReceiveDeals(e.target.checked)}
                  className="mt-0.5 rounded border-[#e8bcb7]/30 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                />
                <span className="text-[11px] font-semibold text-[#5e3f3b] leading-tight">
                  Yes, I want to receive the best deals and order alerts on WhatsApp!
                </span>
              </label>

              <button
                type="submit"
                disabled={profileSaving}
                className="w-full bg-primary hover:bg-[#9a000e] text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-red-500/10 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {profileSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save & Continue'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
function FiveMinDeliveryModal({
  isOpen,
  onClose,
  isFiveMinActive,
  activePincode,
  serviceablePincode,
  onActivate,
  onDeactivate,
  triggerToast,
}: {
  isOpen: boolean;
  onClose: () => void;
  isFiveMinActive: boolean;
  activePincode: string;
  serviceablePincode: string;
  onActivate: (pincode: string) => void;
  onDeactivate: () => void;
  triggerToast: (msg: string, type?: 'success' | 'info') => void;
}) {
  const [pincode, setPincode] = useState(activePincode);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPincode(activePincode);
      setErrorMsg('');
    }
  }, [isOpen, activePincode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = normalizePincode(pincode);
    const servicePin = normalizePincode(serviceablePincode || DEFAULT_FIVE_MIN_PINCODE);

    if (!entered) {
      setErrorMsg('Please enter a valid 6-digit pincode.');
      return;
    }

    if (entered === servicePin) {
      onActivate(entered);
      triggerToast(`Success! 5-Minute Delivery is active for pincode ${servicePin}.`);
      onClose();
      return;
    }

    setErrorMsg('We are coming soon to your area');
  };

  const handleDeactivate = () => {
    onDeactivate();
    triggerToast('5-Minute Delivery has been deactivated.', 'info');
    onClose();
  };

  const servicePin = normalizePincode(serviceablePincode || DEFAULT_FIVE_MIN_PINCODE);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-[var(--brand-soft-border)] p-6 md:p-8 max-w-sm w-full shadow-2xl relative animate-scale-up text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors text-sm font-semibold select-none cursor-pointer"
        >
          âœ•
        </button>

        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 18H14M4 24H12M8 30H16" stroke="#fb641b" strokeWidth="3" strokeLinecap="round" />
              <path d="M19 32C19 25.3726 24.3726 20 31 20H33.5L37 13H42" stroke="var(--brand-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M38 20L40 32H35" stroke="var(--brand-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="21" cy="35" r="4" fill="none" stroke="#291715" strokeWidth="3" />
              <circle cx="37" cy="35" r="4" fill="none" stroke="#291715" strokeWidth="3" />
              <circle cx="26" cy="14" r="6" fill="var(--brand-primary)" stroke="white" strokeWidth="1.5" />
              <path d="M26 11V14H29" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {isFiveMinActive ? (
          <div className="space-y-4">
            <h3 className="font-display font-bold text-lg text-[#291715]">5-Min Delivery Active!</h3>
            <p className="text-xs text-[#5e3f3b]/70 leading-relaxed">
              Superfast delivery is active for pincode <strong className="text-green-600">{servicePin}</strong>. Eligible products show the <strong className="text-green-600">5 Min</strong> badge.
            </p>
            <div className="rounded-2xl border border-green-200 bg-green-50/60 px-4 py-3 text-left text-xs text-green-800">
              Active pincode: <strong>{activePincode}</strong>
            </div>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleDeactivate}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm shadow-red-500/10"
              >
                Deactivate Fast Delivery
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeactivate();
                  setPincode('');
                  setErrorMsg('');
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Check Another Pincode
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-center">
            <h3 className="font-display font-bold text-lg text-[#291715]">5-Min Fast Delivery</h3>
            <p className="text-xs text-[#5e3f3b]/70 leading-relaxed">
              Enter your pincode to check if superfast 5-minute delivery is available in your area.
            </p>

            <div className="space-y-1.5">
              <input
                type="text"
                maxLength={6}
                required
                inputMode="numeric"
                pattern="\d*"
                placeholder="Enter Pincode"
                value={pincode}
                onChange={(e) => {
                  setPincode(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setErrorMsg('');
                }}
                className="w-full bg-[var(--brand-soft-surface)] border border-[var(--brand-soft-border)] rounded-2xl px-4 py-3 text-center text-lg font-bold tracking-widest outline-none focus:ring-2 focus:ring-primary/20 text-[#291715] placeholder:tracking-normal placeholder:text-xs placeholder:text-gray-400"
              />
              {errorMsg && (
                <p className="text-xs text-red-500 font-semibold animate-pulse">{errorMsg}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-red-500/10"
              >
                Submit
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}






