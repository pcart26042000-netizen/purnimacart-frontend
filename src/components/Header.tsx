import React, { useEffect, useRef, useState } from 'react';
import { Search, Bell, ShoppingCart, User, Heart, LayoutDashboard, Package, LogOut, MapPin, Mic } from 'lucide-react';
import { PageType, Product, Category } from '../types';
import SearchOverlay from './SearchOverlay';
import CategoryList from './CategoryList';
import { useAuth } from '../context/AuthContext';
import logoImg from '../logo.png';

const DeliveryScooterIcon = () => (
  <div className="relative flex items-center justify-center shrink-0">
    <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5.5 h-5.5">
      {/* Speed lines */}
      <path d="M6 18H14M4 24H12M8 30H16" stroke="var(--brand-primary)" strokeWidth="3" strokeLinecap="round"/>
      {/* Scooter body */}
      <path d="M19 32C19 25.3726 24.3726 20 31 20H33.5L37 13H42" stroke="var(--brand-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Scooter front shield */}
      <path d="M38 20L40 32H35" stroke="var(--brand-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Wheels */}
      <circle cx="21" cy="35" r="4" fill="none" stroke="#291715" strokeWidth="3"/>
      <circle cx="37" cy="35" r="4" fill="none" stroke="#291715" strokeWidth="3"/>
      {/* Clock on top / back */}
      <circle cx="26" cy="14" r="6" fill="var(--brand-primary)" stroke="white" strokeWidth="1.5"/>
      <path d="M26 11V14H29" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  </div>
);

interface HeaderProps {
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;
  setSelectedProductId: (id: string | null) => void;
  setSelectedCategory: (category: string) => void;
  cartCount: number;
  wishlistCount: number;
  openCart: () => void;
  products: Product[];
  categories: Category[];
  selectedCategory: string;
  isFiveMinActive: boolean;
  onFiveMinClick: () => void;
  onAddToCart: (product: Product, color: string | undefined, price: number | undefined, e: React.MouseEvent) => void;
  onToggleWishlist: (product: Product, e: React.MouseEvent) => void;
  isWishlisted: (id: string) => boolean;
}

export default function Header({
  currentPage,
  setCurrentPage,
  setSelectedProductId,
  setSelectedCategory,
  cartCount,
  wishlistCount,
  openCart,
  products,
  categories,
  selectedCategory,
  isFiveMinActive,
  onFiveMinClick,
  onAddToCart,
  onToggleWishlist,
  isWishlisted,
}: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [startVoiceSearchOnOpen, setStartVoiceSearchOnOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { user, isAdmin, signInWithGoogle, signOut } = useAuth();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (page: PageType) => {
    setCurrentPage(page);
    setSelectedProductId(null);
    if (page === 'category') {
      setSelectedCategory('all');
    }
  };

  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
    setCurrentPage('product-detail');
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentPage('category');
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google sign-in failed', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setProfileMenuOpen(false);
      if (currentPage === 'admin') {
        setCurrentPage('home');
      }
    } catch (err) {
      console.error('Sign-out failed', err);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 text-white shadow-[0_18px_40px_var(--brand-header-shadow)] transition-all" style={{ background: `linear-gradient(to bottom, var(--brand-header-start), var(--brand-header-mid), var(--brand-header-end))` }}>
        {/* Row 1: Logo + Icon actions */}
        <div className="flex items-center justify-between w-full px-4 md:px-6 max-w-7xl mx-auto h-[60px] md:h-16 gap-3">
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2 hover:opacity-95 cursor-pointer"
            id="brand-logo"
          >
            <img src={logoImg} alt="PCart" className="h-9 md:h-8 w-auto rounded-sm object-contain border border-white/20" />
            <div className="flex flex-col items-start leading-none shrink-0">
              <span className="font-sans text-lg md:text-lg font-black italic tracking-tight text-white flex items-center">
                P<span className="text-white">Cart</span>
              </span>
              <span className="text-[10px] font-bold italic text-white/90 flex items-center gap-0.5 mt-0.5 self-end">
                Explore <span className="text-white font-black">Plus</span>
              </span>
            </div>
          </button>

          {/* Desktop inline search */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8 items-center gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex-1 h-9 flex items-center justify-between bg-white rounded-sm px-4 text-left text-xs text-gray-400 shadow-sm outline-none transition-all cursor-pointer"
            >
              <span className="truncate">Search for products, brands and more</span>
              <Search size={16} className="text-[var(--brand-primary)] shrink-0" />
            </button>

            <button
              type="button"
              onClick={onFiveMinClick}
              className={`h-9 shrink-0 bg-white rounded-sm px-3.5 flex items-center gap-1.5 border transition-all active:scale-95 shadow-sm hover:shadow cursor-pointer ${
                isFiveMinActive
                  ? 'border-green-500 text-green-600 bg-green-50/50'
                  : 'border-white/20 text-[var(--brand-primary)]'
              }`}
            >
              <DeliveryScooterIcon />
              <div className="flex flex-col items-start leading-none text-left select-none">
                <span className={`text-[10px] font-black tracking-tighter ${isFiveMinActive ? 'text-green-700' : 'text-[var(--brand-primary)]'}`}>5 MIN</span>
                <span className="text-[7px] font-bold text-gray-500 tracking-wider">DELIVERY</span>
              </div>
            </button>
          </div>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-4 text-white font-bold text-xs shrink-0">
            <button
              onClick={() => handleNavClick('home')}
              className={`hover:bg-white/10 hover:text-white px-3 py-1.5 rounded-sm transition-all duration-300 cursor-pointer uppercase tracking-wider ${
                currentPage === 'home' ? 'bg-white/15 text-white font-black shadow-inner' : 'text-white/80'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('category')}
              className={`hover:bg-white/10 hover:text-white px-3 py-1.5 rounded-sm transition-all duration-300 cursor-pointer uppercase tracking-wider ${
                currentPage === 'category' ? 'bg-white/15 text-white font-black shadow-inner' : 'text-white/80'
              }`}
            >
              Categories
            </button>
          </nav>

          {/* Icon actions - shared mobile & desktop */}
          <div className="flex items-center gap-1 md:gap-3 text-white shrink-0">
            {/* Mobile search trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            <button
              onClick={() => handleNavClick('wishlist')}
              className="relative w-10 h-10 hidden sm:flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              title="Wishlist"
              id="wishlist-header-btn"
            >
              <Heart size={20} className={currentPage === 'wishlist' ? 'fill-white text-white' : ''} />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-white text-[var(--brand-primary)] text-[10px] font-black rounded-full flex items-center justify-center border border-[var(--brand-primary)] shadow-sm">
                  {wishlistCount}
                </span>
              )}
            </button>

            <button
              className="relative w-10 h-10 hidden sm:flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              aria-label="Notifications"
            >
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-white rounded-full ring-1 ring-primary" />
            </button>

            <button
              onClick={openCart}
              className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              title="Shopping Cart"
              id="cart-header-btn"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-white text-[var(--brand-primary)] text-[10px] font-black rounded-full flex items-center justify-center border border-[var(--brand-primary)] shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Login button / Profile menu */}
            {!user ? (
              <button
                onClick={handleSignIn}
                className="bg-white text-[var(--brand-primary)] font-bold text-xs px-5 py-1.5 rounded-sm hover:bg-gray-100 shadow-sm transition-colors cursor-pointer"
              >
                Login
              </button>
            ) : (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileMenuOpen((v) => !v)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all cursor-pointer overflow-hidden ${
                    profileMenuOpen ? 'bg-white/10' : ''
                  }`}
                  aria-label="Account menu"
                >
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'Account'} className="w-full h-full object-cover" />
                  ) : (
                    <User size={20} />
                  )}
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 text-gray-800 animate-slide-up">
                    <div className="px-4 py-2 border-b border-gray-100 mb-1">
                      <p className="text-xs font-bold text-gray-900 truncate">{user.displayName || 'Account'}</p>
                      <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        handleNavClick('wishlist');
                      }}
                      className="sm:hidden w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                    >
                      <Heart size={15} /> Wishlist
                    </button>
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        handleNavClick('my-orders');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                    >
                      <Package size={15} /> My Orders
                    </button>
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        handleNavClick('addresses');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                    >
                      <MapPin size={15} /> My Addresses
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          handleNavClick('admin');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                      >
                        <LayoutDashboard size={15} /> Admin Panel
                      </button>
                    )}
                    <div className="h-px bg-gray-100 my-1" />
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Always-visible mobile search bar with Mic icon */}
        <div className="md:hidden px-4 pb-3.5 flex items-center gap-2.5">
          <div
            className="flex-1 h-11 flex items-center justify-between bg-white text-gray-400 rounded-full px-4 text-left text-xs active:scale-[0.99] transition-all shadow-sm border border-transparent"
          >
            <button
              onClick={() => {
                setStartVoiceSearchOnOpen(false);
                setSearchOpen(true);
              }}
              className="flex-grow flex items-center gap-3 text-left focus:outline-none h-full cursor-pointer"
            >
              <Search size={18} className="text-gray-500 shrink-0" />
              <span className="truncate text-gray-500 text-[11px] sm:text-xs font-semibold">Search products, categories...</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setStartVoiceSearchOnOpen(true);
                setSearchOpen(true);
              }}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer flex items-center justify-center"
            >
              <Mic size={18} className="text-gray-500 shrink-0" />
            </button>
          </div>

          <button
            type="button"
            onClick={onFiveMinClick}
            className={`h-11 shrink-0 bg-white rounded-xl px-3 flex items-center gap-2 border transition-all active:scale-95 shadow-sm cursor-pointer ${
              isFiveMinActive
                ? 'border-green-500 text-green-600 bg-green-50/50'
                : 'border-white/20 text-[var(--brand-primary)]'
            }`}
          >
            <DeliveryScooterIcon />
            <div className="flex flex-col items-start leading-none text-left select-none">
              <span className={`text-[10px] font-black tracking-tighter ${isFiveMinActive ? 'text-green-700' : 'text-[var(--brand-primary)]'}`}>5 MIN</span>
              <span className="text-[7px] font-bold text-gray-500 tracking-wider">DELIVERY</span>
            </div>
          </button>
        </div>

      </header>

      {/* Connected categories bar, only visible when on homepage */}
      {currentPage === 'home' && (
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 mt-4">
          <CategoryList
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={(categoryId) => {
              setSelectedCategory(categoryId);
              setCurrentPage('category');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      )}

      <SearchOverlay
        isOpen={searchOpen}
        initialVoiceSearch={startVoiceSearchOnOpen}
        products={products}
        categories={categories}
        onClose={() => setSearchOpen(false)}
        onSelectProduct={handleProductSelect}
        onSelectCategory={handleCategorySelect}
        onAddToCart={onAddToCart}
        onToggleWishlist={onToggleWishlist}
        isWishlisted={isWishlisted}
        isFiveMinActive={isFiveMinActive}
      />
    </>
  );
}


