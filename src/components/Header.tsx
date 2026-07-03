import React, { useEffect, useRef, useState } from 'react';
import { Search, Bell, ShoppingCart, User, Heart, LayoutDashboard, Package, LogOut, LogIn, MapPin } from 'lucide-react';
import { PageType, Product, Category } from '../types';
import SearchOverlay from './SearchOverlay';
import { useAuth } from '../context/AuthContext';

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
}: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
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
    if (page === 'admin') {
      window.history.pushState({}, '', '/admin/dashboard');
    } else if (page === 'home') {
      window.history.pushState({}, '', '/');
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
      <header className="sticky top-0 z-40 bg-[#fff8f7]/90 backdrop-blur-xl border-b border-[#e8bcb7]/30 shadow-sm transition-all">
        {/* Row 1: Logo + Icon actions */}
        <div className="flex items-center justify-between w-full px-4 md:px-6 max-w-7xl mx-auto h-16 md:h-20 gap-3">
          <button
            onClick={() => handleNavClick('home')}
            className="font-display text-xl md:text-3xl font-black text-primary tracking-tight shrink-0 hover:opacity-90 transition-opacity cursor-pointer"
            id="brand-logo"
          >
            PCart
          </button>

          {/* Desktop inline search */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full h-12 flex items-center gap-3 bg-[#fff0ee] rounded-full px-5 text-left text-sm text-[#5e3f3b]/60 hover:bg-[#ffe9e6] focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer"
            >
              <Search size={17} className="shrink-0" />
              <span className="truncate">Search for luxury toys, fashion, and more...</span>
            </button>
          </div>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-6 text-[#5e3f3b] font-medium text-sm shrink-0">
            <button
              onClick={() => handleNavClick('home')}
              className={`hover:text-primary transition-colors cursor-pointer pb-1 ${
                currentPage === 'home' ? 'text-primary font-bold border-b-2 border-primary' : ''
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('category')}
              className={`hover:text-primary transition-colors cursor-pointer pb-1 ${
                currentPage === 'category' ? 'text-primary font-bold border-b-2 border-primary' : ''
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => handleNavClick('offers')}
              className={`hover:text-primary transition-colors cursor-pointer pb-1 ${
                currentPage === 'offers' ? 'text-primary font-bold border-b-2 border-primary' : ''
              }`}
            >
              Offers
            </button>
          </nav>

          {/* Icon actions - shared mobile & desktop */}
          <div className="flex items-center gap-0.5 md:gap-2 text-[#5e3f3b] shrink-0">
            {/* Mobile search trigger (icon only, row 2 below carries the real bar too) */}
            <button
              onClick={() => setSearchOpen(true)}
              className="md:hidden w-11 h-11 flex items-center justify-center rounded-full hover:bg-[#fff0ee] active:scale-95 transition-all cursor-pointer"
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            <button
              onClick={() => handleNavClick('wishlist')}
              className="relative w-11 h-11 hidden sm:flex items-center justify-center rounded-full hover:bg-[#fff0ee] active:scale-95 transition-all cursor-pointer"
              title="Wishlist"
              id="wishlist-header-btn"
            >
              <Heart size={20} className={currentPage === 'wishlist' ? 'fill-primary text-primary' : ''} />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            <button
              className="relative w-11 h-11 hidden sm:flex items-center justify-center rounded-full hover:bg-[#fff0ee] active:scale-95 transition-all cursor-pointer"
              aria-label="Notifications"
            >
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full ring-2 ring-[#fff8f7]" />
            </button>

            <button
              onClick={openCart}
              className="relative w-11 h-11 flex items-center justify-center rounded-full hover:bg-[#fff0ee] active:scale-95 transition-all cursor-pointer"
              title="Shopping Cart"
              id="cart-header-btn"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-md">
                  {cartCount}
                </span>
              )}
            </button>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileMenuOpen((v) => !v)}
                className={`w-11 h-11 flex items-center justify-center rounded-full hover:bg-[#fff0ee] active:scale-95 transition-all cursor-pointer overflow-hidden ${
                  profileMenuOpen ? 'bg-[#fff0ee] text-primary' : ''
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
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#e8bcb7]/25 py-2 z-50 animate-[slideUp_0.15s_ease-out]">
                  {user && (
                    <div className="px-4 py-2.5 border-b border-[#e8bcb7]/15 mb-1">
                      <p className="text-xs font-bold text-[#291715] truncate">{user.displayName || 'Account'}</p>
                      <p className="text-[11px] text-[#5e3f3b]/60 truncate">{user.email}</p>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleNavClick('wishlist');
                    }}
                    className="sm:hidden w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#291715] hover:bg-[#fff0ee] transition-colors cursor-pointer text-left"
                  >
                    <Heart size={16} /> Wishlist
                  </button>
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleNavClick('my-orders');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#291715] hover:bg-[#fff0ee] transition-colors cursor-pointer text-left"
                  >
                    <Package size={16} /> My Orders
                  </button>
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleNavClick('addresses');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#291715] hover:bg-[#fff0ee] transition-colors cursor-pointer text-left"
                  >
                    <MapPin size={16} /> My Addresses
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        handleNavClick('admin');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#291715] hover:bg-[#fff0ee] transition-colors cursor-pointer text-left"
                    >
                      <LayoutDashboard size={16} /> Admin Panel
                    </button>
                  )}
                  <div className="h-px bg-[#e8bcb7]/20 my-1.5" />
                  {user ? (
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#5e3f3b]/70 hover:bg-[#fff0ee] transition-colors cursor-pointer text-left"
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        handleSignIn();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-[#fff0ee] transition-colors cursor-pointer text-left"
                    >
                      <LogIn size={16} /> Sign in with Google
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Always-visible mobile search bar */}
        <div className="md:hidden px-4 pb-3">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full h-12 flex items-center gap-3 bg-[#fff0ee] rounded-2xl px-4 text-left text-sm text-[#5e3f3b]/60 active:scale-[0.99] transition-all cursor-pointer"
          >
            <Search size={17} className="shrink-0" />
            <span className="truncate">Search products, brands and categories</span>
          </button>
        </div>
      </header>

      <SearchOverlay
        isOpen={searchOpen}
        products={products}
        categories={categories}
        onClose={() => setSearchOpen(false)}
        onSelectProduct={handleProductSelect}
        onSelectCategory={handleCategorySelect}
      />
    </>
  );
}
