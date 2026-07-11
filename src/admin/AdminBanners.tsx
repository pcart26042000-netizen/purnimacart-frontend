import React, { useState } from 'react';
import { Plus, Pencil, Trash2, X, ImagePlus, GalleryHorizontal, Clock } from 'lucide-react';
import type { FirestoreBanner } from '../types/firestore';
import { useAdminBanners } from './hooks/useAdminBanners';
import { createBanner, updateBanner, deleteBanner, isBannerLive, type BannerInput } from '../lib/services/misc';
import { openCloudinaryUploadWidget } from '../lib/cloudinary';
import { LoadingBlock, ErrorBlock, EmptyState } from './components/LoadingState';
import ConfirmDialog from './components/ConfirmDialog';
import Toggle from './components/Toggle';

interface AdminBannersProps {
  onToast: (message: string, type?: 'success' | 'info') => void;
}

type BannerFormState = { title: string; imageUrl: string; isActive: boolean; startDate: string; endDate: string };

function BannerFormModal({
  initial,
  nextOrder,
  onClose,
  onSaved,
  onToast,
}: {
  initial: FirestoreBanner | null;
  nextOrder: number;
  onClose: () => void;
  onSaved: () => void;
  onToast: (message: string, type?: 'success' | 'info') => void;
}) {
  const [form, setForm] = useState<BannerFormState>(
    initial
      ? {
          title: initial.title || '',
          imageUrl: initial.imageUrl,
          isActive: initial.isActive,
          startDate: initial.startDate ? initial.startDate.toDate().toISOString().slice(0, 10) : '',
          endDate: initial.endDate ? initial.endDate.toDate().toISOString().slice(0, 10) : '',
        }
      : { title: '', imageUrl: '', isActive: true, startDate: '', endDate: '' }
  );
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof BannerFormState>(key: K, value: BannerFormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleUploadImage = () => {
    openCloudinaryUploadWidget({
      multiple: false,
      folder: 'purnimacart/banners',
      cropping: true,
      croppingAspectRatio: 2.77,
      croppingShowDimensions: true,
      onSuccess: (result) => set('imageUrl', result.secureUrl),
      onError: (message) => onToast(message, 'info'),
    });
  };

  const isValid = !!form.imageUrl && (!form.startDate || !form.endDate || form.startDate <= form.endDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      onToast('Upload an image, and make sure the start date is before the end date.', 'info');
      return;
    }
    setSaving(true);
    try {
      const payload: BannerInput = {
        imageUrl: form.imageUrl,
        title: form.title.trim(),
        order: initial?.order ?? nextOrder,
        isActive: form.isActive,
        startDate: form.startDate ? new Date(`${form.startDate}T00:00:00`) : null,
        endDate: form.endDate ? new Date(`${form.endDate}T23:59:59`) : null,
      };
      if (initial) {
        await updateBanner(initial.id, payload);
        onToast('Banner updated.');
      } else {
        await createBanner(payload);
        onToast('Banner created.');
      }
      onSaved();
    } catch (error: any) {
      console.error(error);
      onToast(error.message || 'Could not save banner.', 'info');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 animate-[fadeIn_0.15s_ease-out]" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-[slideUp_0.2s_ease-out]">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-[#e8bcb7]/15 flex items-center justify-between z-10">
          <h3 className="font-display font-bold text-base text-[#291715]">{initial ? 'Edit Banner' : 'Add Banner'}</h3>
          <button type="button" onClick={onClose} className="text-[#5e3f3b]/50 hover:text-primary cursor-pointer" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-2 block">Image</label>
            {form.imageUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-[#e8bcb7]/20 aspect-[25/9]">
                <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={handleUploadImage} className="absolute inset-0 bg-black/40 text-white opacity-0 hover:opacity-100 flex items-center justify-center text-xs font-bold transition-opacity cursor-pointer">
                  Replace image
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleUploadImage}
                className="w-full aspect-[25/9] rounded-xl border-2 border-dashed border-[#e8bcb7]/40 flex flex-col items-center justify-center gap-1.5 text-[#5e3f3b]/50 hover:border-primary hover:text-primary transition-colors cursor-pointer"
              >
                <ImagePlus size={20} />
                <span className="text-[11px] font-bold">Upload banner image</span>
              </button>
            )}
            <p className="text-[10px] text-gray-400 font-bold mt-1.5 leading-normal">
              Recommended: 1500 x 540 px (Aspect ratio: 25:9). The built-in cropping tool will open automatically to crop your image to this ratio.
            </p>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-1.5 block">Internal Label (optional)</label>
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Diwali Sale banner"
              className="w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-1.5 block">Starts (optional)</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => set('startDate', e.target.value)}
                className="w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-1.5 block">Ends (optional)</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => set('endDate', e.target.value)}
                className="w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <Toggle checked={form.isActive} onChange={(v) => set('isActive', v)} label="Active" />
        </div>
        <div className="sticky bottom-0 bg-white border-t border-[#e8bcb7]/15 px-6 py-4 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="text-xs font-bold text-[#5e3f3b] px-4 py-2.5 rounded-xl hover:bg-[#fff0ee] cursor-pointer">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !isValid}
            className="bg-primary text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-[#9a000e] transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Banner'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminBanners({ onToast }: AdminBannersProps) {
  const { banners, loading, error } = useAdminBanners();
  const [formTarget, setFormTarget] = useState<FirestoreBanner | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FirestoreBanner | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleToggleActive = async (banner: FirestoreBanner) => {
    try {
      await updateBanner(banner.id, { isActive: !banner.isActive });
      onToast(banner.isActive ? 'Banner disabled.' : 'Banner enabled.');
    } catch (err: any) {
      onToast(err.message || 'Could not update banner.', 'info');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteBanner(deleteTarget.id);
      onToast('Banner deleted.');
      setDeleteTarget(null);
    } catch (err: any) {
      onToast(err.message || 'Could not delete banner.', 'info');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingBlock label="Loading banners…" />;
  if (error) return <ErrorBlock message={error} />;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          onClick={() => setFormTarget('new')}
          className="flex items-center gap-2 bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#9a000e] transition-colors cursor-pointer"
        >
          <Plus size={15} /> Add Banner
        </button>
      </div>

      {banners.length === 0 ? (
        <EmptyState icon={GalleryHorizontal} title="No banners yet" description="Add a banner to showcase promotions on the homepage." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {banners.map((b) => {
            const live = isBannerLive(b);
            return (
              <div key={b.id} className="bg-white rounded-2xl border border-[#e8bcb7]/20 shadow-sm overflow-hidden">
                <div className="relative aspect-[25/9] bg-[#fff0ee]">
                  <img src={b.imageUrl} alt={b.title || 'Banner'} className="w-full h-full object-cover" />
                  <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${live ? 'bg-emerald-500 text-white' : 'bg-black/50 text-white'}`}>
                    {live ? 'Live' : b.isActive ? 'Scheduled' : 'Inactive'}
                  </span>
                </div>
                <div className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#291715] truncate">{b.title || 'Untitled banner'}</p>
                    {(b.startDate || b.endDate) && (
                      <p className="text-[10px] text-[#5e3f3b]/60 flex items-center gap-1 mt-0.5">
                        <Clock size={10} />
                        {b.startDate ? b.startDate.toDate().toLocaleDateString('en-IN') : 'Anytime'} – {b.endDate ? b.endDate.toDate().toLocaleDateString('en-IN') : 'Ongoing'}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Toggle checked={b.isActive} onChange={() => handleToggleActive(b)} />
                    <button onClick={() => setFormTarget(b)} className="w-7 h-7 rounded-lg hover:bg-[#fff0ee] text-[#5e3f3b] inline-flex items-center justify-center cursor-pointer" aria-label="Edit">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setDeleteTarget(b)} className="w-7 h-7 rounded-lg hover:bg-red-50 text-[#5e3f3b] hover:text-red-600 inline-flex items-center justify-center cursor-pointer" aria-label="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {formTarget && (
        <BannerFormModal
          initial={formTarget === 'new' ? null : formTarget}
          nextOrder={banners.length}
          onClose={() => setFormTarget(null)}
          onSaved={() => setFormTarget(null)}
          onToast={onToast}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this banner?"
        description="This banner will be permanently removed from the homepage."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
