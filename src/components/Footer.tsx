import React from 'react';
import { ArrowRight, CreditCard, Facebook, Instagram, Mail, MapPin, MessageCircle, Phone, ShieldCheck, Youtube } from 'lucide-react';
import { PageType } from '../types';

interface FooterProps {
  onSelectCategory: (categoryId: string) => void;
  setCurrentPage: (page: PageType) => void;
}

export default function Footer({ onSelectCategory, setCurrentPage }: FooterProps) {
  const goHome = () => setCurrentPage('home');
  const goCategory = (categoryId: string) => {
    onSelectCategory(categoryId);
    setCurrentPage('category');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goPage = (page: PageType) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-20 border-t border-[#ead6d2] bg-[#fff8f7] text-[#291715]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="space-y-4 lg:col-span-1">
            <div>
              <h2 className="text-2xl font-black tracking-tight">PurnimaCart</h2>
              <p className="mt-2 text-sm text-[#5e3f3b] leading-6">
                Your trusted multi-category e-commerce store serving customers across India with secure payments, fast delivery, and quality products.
              </p>
            </div>

            <div className="space-y-2 text-sm text-[#5e3f3b]">
              <p className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0" /><span>Purnima store, Jalpaiguri Kadamtala, Jalpaiguri 735101, West Bengal, India</span></p>
              <p className="flex gap-2"><Mail size={16} className="mt-0.5 shrink-0" /><a href="mailto:Support.pcart@gmail.com" className="hover:text-primary">Support.pcart@gmail.com</a></p>
              <p className="flex gap-2"><Phone size={16} className="mt-0.5 shrink-0" /><a href="tel:+919332961712" className="hover:text-primary">+91 93329 61712</a></p>
              <p className="flex gap-2"><MessageCircle size={16} className="mt-0.5 shrink-0" /><a href="https://wa.me/919332961712" target="_blank" rel="noreferrer" className="hover:text-primary">WhatsApp support</a></p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#291715] mb-4">Quick Links</h3>
            <ul className="space-y-3 text-sm text-[#5e3f3b]">
              <li><button onClick={goHome} className="hover:text-primary transition-colors text-left cursor-pointer">Home</button></li>
              <li><button onClick={() => goCategory('all')} className="hover:text-primary transition-colors text-left cursor-pointer">Shop Categories</button></li>
              <li><button onClick={() => goPage('offers')} className="hover:text-primary transition-colors text-left cursor-pointer">Offers</button></li>
              <li><button onClick={() => goPage('wishlist')} className="hover:text-primary transition-colors text-left cursor-pointer">Wishlist</button></li>
              <li><button onClick={() => goPage('my-orders')} className="hover:text-primary transition-colors text-left cursor-pointer">Track Order</button></li>
              <li><button onClick={() => goPage('contact')} className="hover:text-primary transition-colors text-left cursor-pointer">Contact Us</button></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#291715] mb-4">Customer Service</h3>
            <ul className="space-y-3 text-sm text-[#5e3f3b]">
              <li><button onClick={() => goPage('faq')} className="hover:text-primary transition-colors text-left cursor-pointer">Help Center</button></li>
              <li><button onClick={() => goPage('shipping-policy')} className="hover:text-primary transition-colors text-left cursor-pointer">Shipping & Delivery Policy</button></li>
              <li><button onClick={() => goPage('cancellation-policy')} className="hover:text-primary transition-colors text-left cursor-pointer">Cancellation Policy</button></li>
              <li><button onClick={() => goPage('refund-return-policy')} className="hover:text-primary transition-colors text-left cursor-pointer">Refund & Return Policy</button></li>
              <li><button onClick={() => goPage('faq')} className="hover:text-primary transition-colors text-left cursor-pointer">FAQ</button></li>
              <li><button onClick={() => goPage('contact')} className="hover:text-primary transition-colors text-left cursor-pointer">Support</button></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#291715] mb-4">Legal Pages</h3>
            <ul className="space-y-3 text-sm text-[#5e3f3b]">
              <li><button onClick={() => goPage('privacy-policy')} className="hover:text-primary transition-colors text-left cursor-pointer">Privacy Policy</button></li>
              <li><button onClick={() => goPage('terms-conditions')} className="hover:text-primary transition-colors text-left cursor-pointer">Terms & Conditions</button></li>
              <li><button onClick={() => goPage('refund-return-policy')} className="hover:text-primary transition-colors text-left cursor-pointer">Refund & Return Policy</button></li>
              <li><button onClick={() => goPage('shipping-policy')} className="hover:text-primary transition-colors text-left cursor-pointer">Shipping & Delivery Policy</button></li>
              <li><button onClick={() => goPage('cancellation-policy')} className="hover:text-primary transition-colors text-left cursor-pointer">Cancellation Policy</button></li>
              <li><button onClick={() => goPage('cookie-policy')} className="hover:text-primary transition-colors text-left cursor-pointer">Cookie Policy</button></li>
              <li><button onClick={() => goPage('about-us')} className="hover:text-primary transition-colors text-left cursor-pointer">About Us</button></li>
            </ul>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#291715] mb-4">Newsletter</h3>
              <p className="text-sm text-[#5e3f3b] mb-4">
                Subscribe for product updates, offers, and new arrival alerts.
              </p>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="space-y-3"
              >
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full rounded-xl border border-[#e6d3ce] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-[#9a000e] transition-colors"
                >
                  Subscribe <ArrowRight size={16} />
                </button>
              </form>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#291715] mb-4">Accepted Payments</h3>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-white border border-[#ead6d2] px-3 py-1 inline-flex items-center gap-1"><ShieldCheck size={12} /> Razorpay</span>
                <span className="rounded-full bg-white border border-[#ead6d2] px-3 py-1 inline-flex items-center gap-1"><CreditCard size={12} /> UPI</span>
                <span className="rounded-full bg-white border border-[#ead6d2] px-3 py-1">Cards</span>
                <span className="rounded-full bg-white border border-[#ead6d2] px-3 py-1">Net Banking</span>
                <span className="rounded-full bg-white border border-[#ead6d2] px-3 py-1">Wallets</span>
                <span className="rounded-full bg-white border border-[#ead6d2] px-3 py-1">COD</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#291715] mb-4">Social Links</h3>
              <div className="flex flex-wrap gap-3 text-sm text-[#5e3f3b]">
                <a href="https://instagram.com/" target="_blank" rel="noreferrer" className="hover:text-primary inline-flex items-center gap-1"><Instagram size={15} /> Instagram</a>
                <a href="https://facebook.com/" target="_blank" rel="noreferrer" className="hover:text-primary inline-flex items-center gap-1"><Facebook size={15} /> Facebook</a>
                <a href="https://youtube.com/" target="_blank" rel="noreferrer" className="hover:text-primary inline-flex items-center gap-1"><Youtube size={15} /> YouTube</a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#ead6d2] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-sm text-[#5e3f3b]">
            © 2026 PurnimaCart. All Rights Reserved.
          </p>
          <p className="text-sm text-[#5e3f3b]">
            Free delivery above ₹499. Orders below ₹499 attract a ₹15 shipping charge.
          </p>
        </div>
      </div>
    </footer>
  );
}
