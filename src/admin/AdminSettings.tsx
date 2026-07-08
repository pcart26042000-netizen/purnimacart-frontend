import React, { useEffect, useState } from 'react';
import { Save, Store, Truck, Percent, Share2, MapPin, Image, ShoppingBag } from 'lucide-react';
import type { StoreSettings } from '../types/firestore';
import { openCloudinaryUploadWidget } from '../lib/cloudinary';
import { useAdminSettings } from './hooks/useAdminSettings';
import { LoadingBlock, ErrorBlock } from './components/LoadingState';
import Toggle from './components/Toggle';

interface AdminSettingsProps {
  onToast: (message: string, type?: 'success' | 'info') => void;
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e8bcb7]/20 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon size={15} />
        </span>
        <h3 className="font-display font-bold text-sm text-[#291715]">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

const inputClass = 'w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary';

export default function AdminSettings({ onToast }: AdminSettingsProps) {
  const { settings, loading, error, saving, save } = useAdminSettings();
  const [form, setForm] = useState<StoreSettings | null>(null);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  if (loading || !form) return <LoadingBlock label="Loading settings…" />;
  if (error) return <ErrorBlock message={error} />;

  const set = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => setForm((f) => (f ? { ...f, [key]: value } : f));
  const setSocial = (key: keyof StoreSettings['socialLinks'], value: string) =>
    setForm((f) => (f ? { ...f, socialLinks: { ...f.socialLinks, [key]: value } } : f));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    try {
      await save(form);
      onToast('Settings saved.');
    } catch (err: any) {
      onToast(err.message || 'Could not save settings.', 'info');
    }
  };

  const handleUploadDealItem1 = () => {
    openCloudinaryUploadWidget({
      multiple: false,
      folder: 'purnimacart/settings',
      onSuccess: (result) => set('dealItem1Image', result.secureUrl),
      onError: (message) => onToast(message, 'info'),
    });
  };

  const handleUploadDealItem2 = () => {
    openCloudinaryUploadWidget({
      multiple: false,
      folder: 'purnimacart/settings',
      onSuccess: (result) => set('dealItem2Image', result.secureUrl),
      onError: (message) => onToast(message, 'info'),
    });
  };

  const handleUploadDealItem3 = () => {
    openCloudinaryUploadWidget({
      multiple: false,
      folder: 'purnimacart/settings',
      onSuccess: (result) => set('dealItem3Image', result.secureUrl),
      onError: (message) => onToast(message, 'info'),
    });
  };

  const handleUploadDealItem4 = () => {
    openCloudinaryUploadWidget({
      multiple: false,
      folder: 'purnimacart/settings',
      onSuccess: (result) => set('dealItem4Image', result.secureUrl),
      onError: (message) => onToast(message, 'info'),
    });
  };

  const handleUploadSingleBanner = () => {
    openCloudinaryUploadWidget({
      multiple: false,
      folder: 'purnimacart/settings',
      onSuccess: (result) => set('singleBannerImage', result.secureUrl),
      onError: (message) => onToast(message, 'info'),
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
      <Section icon={Store} title="Store Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Store Name">
            <input value={form.storeName} onChange={(e) => set('storeName', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Store Email">
            <input type="email" value={form.storeEmail} onChange={(e) => set('storeEmail', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Store Phone">
            <input value={form.storePhone} onChange={(e) => set('storePhone', e.target.value)} className={inputClass} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Store Address">
              <textarea value={form.storeAddress} onChange={(e) => set('storeAddress', e.target.value)} rows={2} className={`${inputClass} resize-none`} />
            </Field>
          </div>
        </div>
      </Section>

      <Section icon={Truck} title="Shipping">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Delivery Charge (₹)">
            <input
              type="number" min="0"
              value={form.deliveryCharge}
              onChange={(e) => set('deliveryCharge', Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="Free Delivery Above (₹)">
            <input
              type="number" min="0"
              value={form.freeDeliveryThreshold}
              onChange={(e) => set('freeDeliveryThreshold', Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <div className="sm:col-span-2 flex flex-col gap-4 rounded-xl border border-[#e8bcb7]/15 bg-[#fff8f7] p-4">
            <Toggle
              checked={!!form.fiveMinDeliveryAvailable}
              onChange={(value) => set('fiveMinDeliveryAvailable', value)}
              label="Enable 5-Minute Delivery"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-1.5 block flex items-center gap-1.5">
                  <MapPin size={12} /> Serviceable Pincode
                </label>
                <input
                  value={form.fiveMinDeliveryPincode || ''}
                  onChange={(e) => set('fiveMinDeliveryPincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="732101"
                  className={inputClass}
                />
                <p className="mt-1.5 text-[10px] text-[#5e3f3b]/50">This is the pin users must enter to activate the 5-minute delivery badge.</p>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-1.5 block flex items-center gap-1.5">
                  <ShoppingBag size={12} /> 5-Min Min Order Value (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.fiveMinMinOrderValue || 0}
                  onChange={(e) => set('fiveMinMinOrderValue', Number(e.target.value))}
                  placeholder="500"
                  className={inputClass}
                />
                <p className="mt-1.5 text-[10px] text-[#5e3f3b]/50">The minimum cart subtotal required to checkout when 5-min delivery is active.</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section icon={Percent} title="Tax">
        <Field label="Tax Rate (%)">
          <input
            type="number" min="0" max="100" step="0.01"
            value={form.taxPercent}
            onChange={(e) => set('taxPercent', Number(e.target.value))}
            className={`${inputClass} max-w-[160px]`}
          />
        </Field>
      </Section>

      <Section icon={Share2} title="Social Links">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Instagram">
            <input value={form.socialLinks.instagram || ''} onChange={(e) => setSocial('instagram', e.target.value)} placeholder="https://instagram.com/…" className={inputClass} />
          </Field>
          <Field label="Facebook">
            <input value={form.socialLinks.facebook || ''} onChange={(e) => setSocial('facebook', e.target.value)} placeholder="https://facebook.com/…" className={inputClass} />
          </Field>
          <Field label="Twitter / X">
            <input value={form.socialLinks.twitter || ''} onChange={(e) => setSocial('twitter', e.target.value)} placeholder="https://x.com/…" className={inputClass} />
          </Field>
          <Field label="WhatsApp">
            <input value={form.socialLinks.whatsapp || ''} onChange={(e) => setSocial('whatsapp', e.target.value)} placeholder="+91…" className={inputClass} />
          </Field>
        </div>
      </Section>

      <Section icon={Image} title="Homepage Deal Grid Showcase (4 Banners)">
        <div className="space-y-4">
          <Field label="Section Header Title">
            <input
              value={form.dealShowcaseTitle || ''}
              onChange={(e) => set('dealShowcaseTitle', e.target.value)}
              placeholder="Lowest Prices of the Year"
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Item 1 */}
            <div className="space-y-4 border border-[#e8bcb7]/15 p-4 rounded-2xl bg-[#fffcfb]">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-150 pb-1.5">Item 1 (Top-Left)</h3>
              <Field label="Image">
                <div className="flex gap-2">
                  <input value={form.dealItem1Image || ''} onChange={(e) => set('dealItem1Image', e.target.value)} placeholder="https://cloudinary.com/…" className={`${inputClass} flex-grow`} />
                  <button
                    type="button"
                    onClick={handleUploadDealItem1}
                    className="bg-primary hover:bg-[#9a000e] text-white px-4 rounded-xl font-bold text-xs transition-colors cursor-pointer shrink-0"
                  >
                    Upload
                  </button>
                </div>
                {form.dealItem1Image && (
                  <div className="mt-2 relative w-20 aspect-square rounded-xl overflow-hidden border border-[#e8bcb7]/20 shadow-sm bg-white p-1">
                    <img src={form.dealItem1Image} alt="Item 1 preview" className="w-full h-full object-contain" />
                  </div>
                )}
              </Field>
              <Field label="Badge (e.g. Up to 80% Off)">
                <input value={form.dealItem1Badge || ''} onChange={(e) => set('dealItem1Badge', e.target.value)} placeholder="Up to 80% Off" className={inputClass} />
              </Field>
              <Field label="Title / Category Name">
                <input value={form.dealItem1Title || ''} onChange={(e) => set('dealItem1Title', e.target.value)} placeholder="Soundbars" className={inputClass} />
              </Field>
              <Field label="Link Category ID (e.g. accessories, toys)">
                <input value={form.dealItem1Link || ''} onChange={(e) => set('dealItem1Link', e.target.value)} placeholder="accessories" className={inputClass} />
              </Field>
            </div>

            {/* Item 2 */}
            <div className="space-y-4 border border-[#e8bcb7]/15 p-4 rounded-2xl bg-[#fffcfb]">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-150 pb-1.5">Item 2 (Top-Right)</h3>
              <Field label="Image">
                <div className="flex gap-2">
                  <input value={form.dealItem2Image || ''} onChange={(e) => set('dealItem2Image', e.target.value)} placeholder="https://cloudinary.com/…" className={`${inputClass} flex-grow`} />
                  <button
                    type="button"
                    onClick={handleUploadDealItem2}
                    className="bg-primary hover:bg-[#9a000e] text-white px-4 rounded-xl font-bold text-xs transition-colors cursor-pointer shrink-0"
                  >
                    Upload
                  </button>
                </div>
                {form.dealItem2Image && (
                  <div className="mt-2 relative w-20 aspect-square rounded-xl overflow-hidden border border-[#e8bcb7]/20 shadow-sm bg-white p-1">
                    <img src={form.dealItem2Image} alt="Item 2 preview" className="w-full h-full object-contain" />
                  </div>
                )}
              </Field>
              <Field label="Badge (e.g. Up to 20% Off)">
                <input value={form.dealItem2Badge || ''} onChange={(e) => set('dealItem2Badge', e.target.value)} placeholder="Up to 20% Off" className={inputClass} />
              </Field>
              <Field label="Title / Category Name">
                <input value={form.dealItem2Title || ''} onChange={(e) => set('dealItem2Title', e.target.value)} placeholder="Multi Function Printers" className={inputClass} />
              </Field>
              <Field label="Link Category ID (e.g. accessories, toys)">
                <input value={form.dealItem2Link || ''} onChange={(e) => set('dealItem2Link', e.target.value)} placeholder="accessories" className={inputClass} />
              </Field>
            </div>

            {/* Item 3 */}
            <div className="space-y-4 border border-[#e8bcb7]/15 p-4 rounded-2xl bg-[#fffcfb]">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-150 pb-1.5">Item 3 (Bottom-Left)</h3>
              <Field label="Image">
                <div className="flex gap-2">
                  <input value={form.dealItem3Image || ''} onChange={(e) => set('dealItem3Image', e.target.value)} placeholder="https://cloudinary.com/…" className={`${inputClass} flex-grow`} />
                  <button
                    type="button"
                    onClick={handleUploadDealItem3}
                    className="bg-primary hover:bg-[#9a000e] text-white px-4 rounded-xl font-bold text-xs transition-colors cursor-pointer shrink-0"
                  >
                    Upload
                  </button>
                </div>
                {form.dealItem3Image && (
                  <div className="mt-2 relative w-20 aspect-square rounded-xl overflow-hidden border border-[#e8bcb7]/20 shadow-sm bg-white p-1">
                    <img src={form.dealItem3Image} alt="Item 3 preview" className="w-full h-full object-contain" />
                  </div>
                )}
              </Field>
              <Field label="Badge (e.g. Up to 60% Off)">
                <input value={form.dealItem3Badge || ''} onChange={(e) => set('dealItem3Badge', e.target.value)} placeholder="Up to 60% Off" className={inputClass} />
              </Field>
              <Field label="Title / Category Name">
                <input value={form.dealItem3Title || ''} onChange={(e) => set('dealItem3Title', e.target.value)} placeholder="Headphones" className={inputClass} />
              </Field>
              <Field label="Link Category ID (e.g. accessories, toys)">
                <input value={form.dealItem3Link || ''} onChange={(e) => set('dealItem3Link', e.target.value)} placeholder="accessories" className={inputClass} />
              </Field>
            </div>

            {/* Item 4 */}
            <div className="space-y-4 border border-[#e8bcb7]/15 p-4 rounded-2xl bg-[#fffcfb]">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-150 pb-1.5">Item 4 (Bottom-Right)</h3>
              <Field label="Image">
                <div className="flex gap-2">
                  <input value={form.dealItem4Image || ''} onChange={(e) => set('dealItem4Image', e.target.value)} placeholder="https://cloudinary.com/…" className={`${inputClass} flex-grow`} />
                  <button
                    type="button"
                    onClick={handleUploadDealItem4}
                    className="bg-primary hover:bg-[#9a000e] text-white px-4 rounded-xl font-bold text-xs transition-colors cursor-pointer shrink-0"
                  >
                    Upload
                  </button>
                </div>
                {form.dealItem4Image && (
                  <div className="mt-2 relative w-20 aspect-square rounded-xl overflow-hidden border border-[#e8bcb7]/20 shadow-sm bg-white p-1">
                    <img src={form.dealItem4Image} alt="Item 4 preview" className="w-full h-full object-contain" />
                  </div>
                )}
              </Field>
              <Field label="Badge (e.g. Up to 70% Off)">
                <input value={form.dealItem4Badge || ''} onChange={(e) => set('dealItem4Badge', e.target.value)} placeholder="Up to 70% Off" className={inputClass} />
              </Field>
              <Field label="Title / Category Name">
                <input value={form.dealItem4Title || ''} onChange={(e) => set('dealItem4Title', e.target.value)} placeholder="Kids Laptops and Tablets" className={inputClass} />
              </Field>
              <Field label="Link Category ID (e.g. accessories, toys)">
                <input value={form.dealItem4Link || ''} onChange={(e) => set('dealItem4Link', e.target.value)} placeholder="toys" className={inputClass} />
              </Field>
            </div>
          </div>
        </div>
      </Section>

      <Section icon={Image} title="Homepage Single Collection Banner (800 × 1200 px)">
        <div className="space-y-4 border border-[#e8bcb7]/15 p-5 rounded-2xl bg-[#fffcfb]">
          <Field label="Banner Image">
            <div className="flex gap-2">
              <input value={form.singleBannerImage || ''} onChange={(e) => set('singleBannerImage', e.target.value)} placeholder="https://cloudinary.com/…" className={`${inputClass} flex-grow`} />
              <button
                type="button"
                onClick={handleUploadSingleBanner}
                className="bg-primary hover:bg-[#9a000e] text-white px-4 rounded-xl font-bold text-xs transition-colors cursor-pointer shrink-0"
              >
                Upload
              </button>
            </div>
            {form.singleBannerImage && (
              <div className="mt-2 relative w-20 aspect-[2/3] rounded-xl overflow-hidden border border-[#e8bcb7]/20 shadow-sm bg-white">
                <img src={form.singleBannerImage} alt="Single banner preview" className="w-full h-full object-cover" />
              </div>
            )}
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Banner Subtitle / Category Label">
              <input value={form.singleBannerSubtitle || ''} onChange={(e) => set('singleBannerSubtitle', e.target.value)} placeholder="Exclusive Summer Collection" className={inputClass} />
            </Field>
            <Field label="Banner Main Title">
              <input value={form.singleBannerTitle || ''} onChange={(e) => set('singleBannerTitle', e.target.value)} placeholder="Luxury Apparel" className={inputClass} />
            </Field>
            <Field label="CTA Button Text">
              <input value={form.singleBannerCtaText || ''} onChange={(e) => set('singleBannerCtaText', e.target.value)} placeholder="Shop Collection" className={inputClass} />
            </Field>
            <Field label="Target Category Link ID (e.g. dresses, toys)">
              <input value={form.singleBannerCategory || ''} onChange={(e) => set('singleBannerCategory', e.target.value)} placeholder="dresses" className={inputClass} />
            </Field>
          </div>
        </div>
      </Section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-[#9a000e] transition-colors cursor-pointer disabled:opacity-50"
        >
          <Save size={14} /> {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </form>
  );
}

