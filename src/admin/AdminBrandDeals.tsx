import React, { useState } from 'react';
import { Plus, Pencil, Trash2, X, ImagePlus, Sparkles } from 'lucide-react';
import type { FirestoreBrandDeal } from '../types/firestore';
import { useAdminBrandDeals } from './hooks/useAdminBrandDeals';
import { createBrandDeal, updateBrandDeal, deleteBrandDeal, type BrandDealInput } from '../lib/services/misc';
import { openCloudinaryUploadWidget } from '../lib/cloudinary';
import { LoadingBlock, ErrorBlock, EmptyState } from './components/LoadingState';
import ConfirmDialog from './components/ConfirmDialog';
import Toggle from './components/Toggle';

interface AdminBrandDealsProps {
  onToast: (message: string, type?: 'success' | 'info') => void;
}

type DealFormState = {
  title: string;
  brandName: string;
  discountText: string;
  link: string;
  imageUrl: string;
  isActive: boolean;
  order: string;
};

function DealFormModal({
  initial,
  nextOrder,
  onClose,
  onSaved,
  onToast,
}: {
  initial: FirestoreBrandDeal | null;
  nextOrder: number;
  onClose: () => void;
  onSaved: () => void;
  onToast: (message: string, type?: 'success' | 'info') => void;
}) {
  const [form, setForm] = useState<DealFormState>(
    initial
      ? {
          title: initial.title,
          brandName: initial.brandName,
          discountText: initial.discountText,
          link: initial.link,
          imageUrl: initial.imageUrl,
          isActive: initial.isActive,
          order: String(initial.order),
        }
      : {
          title: '',
          brandName: '',
          discountText: '',
          link: '',
          imageUrl: '',
          isActive: true,
          order: String(nextOrder),
        }
  );
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof DealFormState>(key: K, value: DealFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleUploadImage = () => {
    openCloudinaryUploadWidget({
      multiple: false,
      folder: 'purnimacart/brand-deals',
      cropping: true,
      croppingAspectRatio: 0.8, // 4:5 portrait aspect ratio
      croppingShowDimensions: true,
      onSuccess: (result) => set('imageUrl', result.secureUrl),
      onError: (message) => onToast(message, 'info'),
    });
  };

  const isValid =
    !!form.imageUrl &&
    !!form.title.trim() &&
    !!form.brandName.trim() &&
    !!form.discountText.trim() &&
    !!form.link.trim() &&
    !isNaN(Number(form.order));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      onToast('Please fill out all fields and upload a portrait image.', 'info');
      return;
    }
    setSaving(true);
    try {
      const payload: BrandDealInput = {
        imageUrl: form.imageUrl,
        title: form.title.trim(),
        brandName: form.brandName.trim(),
        discountText: form.discountText.trim(),
        link: form.link.trim(),
        order: Number(form.order),
        isActive: form.isActive,
      };
      if (initial) {
        await updateBrandDeal(initial.id, payload);
        onToast('Brand deal updated.');
      } else {
        await createBrandDeal(payload);
        onToast('Brand deal created.');
      }
      onSaved();
    } catch (error: any) {
      console.error(error);
      onToast(error.message || 'Could not save brand deal.', 'info');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 animate-[fadeIn_0.15s_ease-out]" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-[slideUp_0.2s_ease-out]"
      >
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-[#e8bcb7]/15 flex items-center justify-between z-10">
          <h3 className="font-display font-bold text-base text-[#291715]">
            {initial ? 'Edit Brand Deal' : 'Add Brand Deal'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#5e3f3b]/50 hover:text-primary cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Portrait Image Upload */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-2 block">
              Portrait Image
            </label>
            {form.imageUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-[#e8bcb7]/20 aspect-[4/5] max-w-[180px] mx-auto">
                <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={handleUploadImage}
                  className="absolute inset-0 bg-black/40 text-white opacity-0 hover:opacity-100 flex items-center justify-center text-xs font-bold transition-opacity cursor-pointer"
                >
                  Replace image
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleUploadImage}
                className="w-full aspect-[4/5] max-w-[180px] mx-auto rounded-xl border-2 border-dashed border-[#e8bcb7]/40 flex flex-col items-center justify-center gap-1.5 text-[#5e3f3b]/50 hover:border-primary hover:text-primary transition-colors cursor-pointer"
              >
                <ImagePlus size={20} />
                <span className="text-[11px] font-bold">Upload portrait image</span>
              </button>
            )}
            <p className="text-[10px] text-gray-400 font-bold mt-2 text-center leading-normal">
              Recommended aspect ratio: 4:5 (portrait crop). The built-in cropper will help you crop to this format automatically.
            </p>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-1.5 block">
              Celebrity/Collection Name
            </label>
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Hrithik Roshan"
              className="w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-1.5 block">
              Brand Name
            </label>
            <input
              value={form.brandName}
              onChange={(e) => set('brandName', e.target.value)}
              placeholder="e.g. ARROW"
              className="w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-1.5 block">
              Discount Banner Text
            </label>
            <input
              value={form.discountText}
              onChange={(e) => set('discountText', e.target.value)}
              placeholder="e.g. Min. 60% Off"
              className="w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-1.5 block">
              Target Link (Category Slug)
            </label>
            <input
              value={form.link}
              onChange={(e) => set('link', e.target.value)}
              placeholder="e.g. shirts"
              className="w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-1.5 block">
                Sort Order
              </label>
              <input
                type="number"
                value={form.order}
                onChange={(e) => set('order', e.target.value)}
                className="w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-3 block">
                Active Status
              </label>
              <Toggle checked={form.isActive} onChange={(checked) => set('isActive', checked)} />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-[#e8bcb7]/15 px-6 py-4 flex justify-end gap-3 z-10">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-[#5e3f3b] px-4 py-2.5 rounded-xl hover:bg-[#fff0ee] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !isValid}
            className="bg-primary text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-[#9a000e] transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Deal'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminBrandDeals({ onToast }: AdminBrandDealsProps) {
  const { deals, loading, error } = useAdminBrandDeals();
  const [formTarget, setFormTarget] = useState<FirestoreBrandDeal | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FirestoreBrandDeal | null>(null);
  const [deleting, setDeleting] = useState(false);

  const nextOrder = (deals[deals.length - 1]?.order ?? 0) + 1;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBrandDeal(deleteTarget.id);
      onToast('Brand deal deleted.');
      setDeleteTarget(null);
    } catch (error: any) {
      console.error(error);
      onToast(error.message || 'Could not delete brand deal.', 'info');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (deal: FirestoreBrandDeal, active: boolean) => {
    try {
      await updateBrandDeal(deal.id, { isActive: active });
      onToast(active ? 'Brand deal activated.' : 'Brand deal hidden.');
    } catch (error: any) {
      console.error(error);
      onToast(error.message || 'Could not update status.', 'info');
    }
  };

  if (loading) return <LoadingBlock label="Loading brand deals…" />;
  if (error) return <ErrorBlock message={error} />;

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-[#291715]">Best For You / Brand Deals</h2>
          <p className="text-xs text-[#5e3f3b]/60 mt-0.5">
            Manage the scrollable "Best For You" cards displayed on the storefront home page.
          </p>
        </div>
        <button
          onClick={() => setFormTarget('new')}
          className="flex items-center gap-2 bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#9a000e] transition-colors cursor-pointer shrink-0"
        >
          <Plus size={15} /> Add Brand Deal
        </button>
      </div>

      {deals.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No brand deals found"
          description="Create your first brand deal or celebrity collection card to display on the storefront home page."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-[#e8bcb7]/20 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-[#5e3f3b]/50 border-b border-[#e8bcb7]/15">
                  <th className="px-5 py-3.5 font-bold">Deal Card</th>
                  <th className="px-5 py-3.5 font-bold">Details</th>
                  <th className="px-5 py-3.5 font-bold">Discount</th>
                  <th className="px-5 py-3.5 font-bold">Target Category</th>
                  <th className="px-5 py-3.5 font-bold">Order</th>
                  <th className="px-5 py-3.5 font-bold">Active</th>
                  <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8bcb7]/10">
                {deals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-[#fff8f7] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="w-12 h-15 rounded-lg border border-[#e8bcb7]/15 overflow-hidden shrink-0 bg-gray-50">
                        <img src={deal.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#291715]">
                      <div className="font-semibold">{deal.title}</div>
                      <div className="text-[10px] text-[#5e3f3b]/60 mt-0.5 font-mono uppercase">
                        Brand: {deal.brandName}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      <span className="bg-[#ffd11a]/20 text-[#8a6d00] font-extrabold px-2.5 py-0.5 rounded-full text-[10px] uppercase">
                        {deal.discountText}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#5e3f3b]/70 font-semibold">{deal.link}</td>
                    <td className="px-5 py-3.5 text-xs font-bold text-[#291715]">{deal.order}</td>
                    <td className="px-5 py-3.5">
                      <Toggle checked={deal.isActive} onChange={(checked) => handleToggleActive(deal, checked)} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setFormTarget(deal)}
                          className="w-8 h-8 rounded-lg hover:bg-[#fff0ee] text-[#5e3f3b] inline-flex items-center justify-center cursor-pointer"
                          aria-label="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(deal)}
                          className="w-8 h-8 rounded-lg hover:bg-red-50 text-[#5e3f3b] hover:text-red-600 inline-flex items-center justify-center cursor-pointer"
                          aria-label="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {formTarget && (
        <DealFormModal
          initial={formTarget === 'new' ? null : formTarget}
          nextOrder={nextOrder}
          onClose={() => setFormTarget(null)}
          onSaved={() => setFormTarget(null)}
          onToast={onToast}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this brand deal?"
        description={`"${deleteTarget?.brandName} x ${deleteTarget?.title}" will be permanently removed. This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
