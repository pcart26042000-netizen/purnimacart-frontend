import React, { useEffect, useState } from 'react';
import { Save, Store, Truck, Percent, Share2, MapPin } from 'lucide-react';
import type { StoreSettings } from '../types/firestore';
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

