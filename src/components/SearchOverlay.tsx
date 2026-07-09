import React, { useEffect, useRef, useState } from 'react';
import { Search, X, ArrowLeft, Clock, TrendingUp, PackageSearch, ArrowUpRight, Mic } from 'lucide-react';
import { TRENDING_SEARCHES } from '../data';
import type { Product, Category } from '../types';

const RECENT_KEY = 'purnimacart_recent_searches';
const MAX_RECENT = 8;

function loadRecent(): string[] {
  try {
    const saved = localStorage.getItem(RECENT_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveRecent(list: string[]) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(list));
}

interface SearchOverlayProps {
  isOpen: boolean;
  initialQuery?: string;
  initialVoiceSearch?: boolean;
  products: Product[];
  categories: Category[];
  onClose: () => void;
  onSelectProduct: (id: string) => void;
  onSelectCategory: (categoryId: string) => void;
}

export default function SearchOverlay({
  isOpen,
  initialQuery = '',
  initialVoiceSearch = false,
  products,
  categories,
  onClose,
  onSelectProduct,
  onSelectCategory,
}: SearchOverlayProps) {
  const [query, setQuery] = useState(initialQuery);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState(false);

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice search is not supported in your browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setQuery(speechToText);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setRecent(loadRecent());
      requestAnimationFrame(() => inputRef.current?.focus());
      document.body.style.overflow = 'hidden';
      if (initialVoiceSearch) {
        startVoiceSearch();
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialQuery, initialVoiceSearch]);

  if (!isOpen) return null;

  const trimmed = query.trim();

  const liveResults = trimmed
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(trimmed.toLowerCase()) ||
          p.category.toLowerCase().includes(trimmed.toLowerCase()) ||
          p.tags.some((t) => t.toLowerCase().includes(trimmed.toLowerCase()))
      )
    : [];

  const matchedCategories = trimmed
    ? categories.filter((c) => c.name.toLowerCase().includes(trimmed.toLowerCase()) && c.id !== 'all')
    : [];

  const commitSearch = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    const next = [clean, ...recent.filter((r) => r.toLowerCase() !== clean.toLowerCase())].slice(0, MAX_RECENT);
    setRecent(next);
    saveRecent(next);
  };

  const handleProductPick = (id: string) => {
    commitSearch(query);
    onSelectProduct(id);
    onClose();
  };

  const handleCategoryPick = (categoryId: string) => {
    commitSearch(query || categoryId);
    onSelectCategory(categoryId);
    onClose();
  };

  const handleTermPick = (term: string) => {
    setQuery(term);
    commitSearch(term);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const clearRecent = () => {
    setRecent([]);
    saveRecent([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmed) return;
    commitSearch(trimmed);
    if (liveResults.length > 0) {
      handleProductPick(liveResults[0].id);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#fff8f7] flex flex-col animate-[fadeIn_0.15s_ease-out]">
      {/* Search input bar */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-4 py-3 border-b border-[#e8bcb7]/25 bg-white shrink-0"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close search"
          className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-[#5e3f3b] hover:bg-[#fff0ee] active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex-1 relative">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5e3f3b]/50" />
          <input
            ref={inputRef}
            type="text"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isListening ? "Listening... Speak now!" : "Search products, brands and categories"}
            className={`w-full h-12 bg-[#fff0ee] rounded-2xl pl-11 pr-11 text-sm text-[#291715] placeholder:text-[#5e3f3b]/50 outline-none focus:ring-2 focus:ring-primary/25 transition-all ${isListening ? 'ring-2 ring-primary/40' : ''}`}
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-[#5e3f3b]/50 hover:bg-white hover:text-primary transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={startVoiceSearch}
              aria-label="Voice search"
              className={`absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${isListening ? 'bg-primary text-white animate-pulse' : 'text-[#5e3f3b]/50 hover:bg-[#fff0ee]'}`}
            >
              <Mic size={15} />
            </button>
          )}
        </div>
      </form>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-5 max-w-3xl w-full mx-auto">
        {!trimmed ? (
          <div className="space-y-8">
            {/* Recent searches */}
            {recent.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#291715] uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={13} className="text-[#5e3f3b]/60" />
                    Recent Searches
                  </h3>
                  <button
                    onClick={clearRecent}
                    className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recent.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleTermPick(term)}
                      className="flex items-center gap-1.5 bg-white border border-[#e8bcb7]/25 rounded-full pl-3.5 pr-3 py-2 text-xs font-semibold text-[#5e3f3b] hover:border-primary hover:text-primary transition-colors cursor-pointer"
                    >
                      <Clock size={12} className="opacity-50" />
                      {term}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Trending searches */}
            <section className="space-y-3">
              <h3 className="text-xs font-bold text-[#291715] uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={13} className="text-primary" />
                Trending Searches
              </h3>
              <div className="flex flex-col divide-y divide-[#e8bcb7]/15 bg-white rounded-2xl border border-[#e8bcb7]/20 overflow-hidden">
                {TRENDING_SEARCHES.map((term, idx) => (
                  <button
                    key={term}
                    onClick={() => handleTermPick(term)}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-[#fff0ee] transition-colors text-left cursor-pointer"
                  >
                    <span className="text-xs font-bold text-[#5e3f3b]/40 w-4">{idx + 1}</span>
                    <TrendingUp size={15} className="text-primary/70 shrink-0" />
                    <span className="text-sm text-[#291715] font-medium flex-1">{term}</span>
                    <ArrowUpRight size={14} className="text-[#5e3f3b]/30" />
                  </button>
                ))}
              </div>
            </section>

            {/* Search by category */}
            <section className="space-y-3">
              <h3 className="text-xs font-bold text-[#291715] uppercase tracking-wider">
                Search by Category
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {categories.filter((c) => c.id !== 'all').map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryPick(cat.id)}
                    className="flex flex-col items-center justify-center gap-2 bg-white border border-[#e8bcb7]/20 rounded-2xl py-4 px-2 hover:border-primary hover:shadow-md transition-all cursor-pointer"
                  >
                    <span className="w-11 h-11 rounded-full bg-[#fff0ee] flex items-center justify-center text-gray-900 font-display font-bold text-sm">
                      {cat.name.charAt(0)}
                    </span>
                    <span className="text-xs font-semibold text-[#291715] text-center leading-tight">
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : liveResults.length > 0 || matchedCategories.length > 0 ? (
          <div className="space-y-6">
            {matchedCategories.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-xs font-bold text-[#5e3f3b]/60 uppercase tracking-wider px-1">
                  Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {matchedCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryPick(cat.id)}
                      className="bg-[#fff0ee] text-gray-900 rounded-full px-4 py-2 text-xs font-bold hover:bg-primary hover:text-white transition-colors cursor-pointer"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-2">
              <h3 className="text-xs font-bold text-[#5e3f3b]/60 uppercase tracking-wider px-1">
                Products ({liveResults.length})
              </h3>
              <div className="flex flex-col divide-y divide-[#e8bcb7]/15 bg-white rounded-2xl border border-[#e8bcb7]/20 overflow-hidden">
                {liveResults.slice(0, 20).map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductPick(product.id)}
                    className="flex items-center gap-4 p-3.5 hover:bg-[#fff0ee] transition-colors text-left cursor-pointer"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-14 h-14 rounded-xl object-cover bg-[#fff0ee] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#291715] truncate">{product.name}</p>
                      <p className="text-[11px] text-[#5e3f3b]/60 uppercase tracking-wider mt-0.5">
                        {product.category}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-primary">₹{product.price.toLocaleString()}</p>
                      {product.originalPrice && (
                        <p className="text-[11px] text-[#5e3f3b]/50 line-through">
                          ₹{product.originalPrice.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : (
          /* No results state */
          <div className="flex flex-col items-center justify-center text-center py-16 gap-4">
            <div className="w-16 h-16 rounded-full bg-[#fff0ee] flex items-center justify-center text-primary">
              <PackageSearch size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-bold text-base text-[#291715]">
                No results for "{trimmed}"
              </h3>
              <p className="text-xs text-[#5e3f3b]/60 max-w-xs">
                Check the spelling, try a shorter term, or explore what's trending instead.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              {TRENDING_SEARCHES.slice(0, 4).map((term) => (
                <button
                  key={term}
                  onClick={() => handleTermPick(term)}
                  className="bg-white border border-[#e8bcb7]/25 rounded-full px-4 py-2 text-xs font-semibold text-[#5e3f3b] hover:border-primary hover:text-primary transition-colors cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

