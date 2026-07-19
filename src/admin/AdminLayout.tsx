import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Users,
  Ticket,
  Image as ImageIcon,
  Settings,
  Menu,
  X,
  ArrowLeft,
  Bell,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { AdminSection } from '../types';

const NAV_ITEMS: { id: AdminSection; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'categories', label: 'Categories', icon: FolderTree },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'coupons', label: 'Coupons', icon: Ticket },
  { id: 'banners', label: 'Banner Manager', icon: ImageIcon },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface AdminLayoutProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  onExitAdmin: () => void;
  toast?: { message: string; type: 'success' | 'info' } | null;
  children: React.ReactNode;
}

export default function AdminLayout({ activeSection, onSectionChange, onExitAdmin, toast, children }: AdminLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const activeLabel = NAV_ITEMS.find((n) => n.id === activeSection)?.label ?? 'Dashboard';

  const SidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-5 h-16 shrink-0 border-b border-white/10">
        <span className="font-display font-black text-xl text-white tracking-tight">PCart</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 bg-white/10 px-2 py-0.5 rounded-full">
          Admin
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSectionChange(item.id);
                setMobileNavOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${active
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-white/65 hover:bg-white/10 hover:text-white'
                }`}
            >
              <Icon size={17} className="shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button
          onClick={onExitAdmin}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-white/65 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft size={17} />
          Back to Storefront
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f6f3f2] flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-[#1c1210] sticky top-0 h-screen">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex">
          <div
            className="absolute inset-0 bg-black/50 animate-[fadeIn_0.15s_ease-out]"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative w-72 max-w-[80%] h-full bg-[#1c1210] shadow-2xl animate-[slideUp_0.2s_ease-out]">
            <button
              onClick={() => setMobileNavOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center cursor-pointer"
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
            {SidebarContent}
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#e8bcb7]/20 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#fff0ee] text-[#291715] cursor-pointer"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-lg md:text-xl text-[#291715] truncate">{activeLabel}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button className="relative w-10 h-10 rounded-full hover:bg-[#fff0ee] flex items-center justify-center text-[#5e3f3b] cursor-pointer">
              <Bell size={18} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-primary rounded-full ring-2 ring-white" />
            </button>
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-display font-bold text-sm flex items-center justify-center">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-[1600px] w-full">{children}</main>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-2 bg-[#1c1210] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl animate-[slideUp_0.2s_ease-out]">
          {toast.type === 'success' ? (
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
          ) : (
            <Info size={15} className="text-amber-400 shrink-0" />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}
