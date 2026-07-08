import React, { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, X, ImagePlus, Layers } from 'lucide-react';
import type { FirestoreCategory } from '../types/firestore';
import { useAdminCategories } from './hooks/useAdminCategories';
import { useAdminProducts } from './hooks/useAdminProducts';
import { createCategory, updateCategory, deleteCategory, categoryHasProducts } from '../lib/services/categories';
import { countProductsByCategory } from '../lib/services/products';
import { openCloudinaryUploadWidget } from '../lib/cloudinary';
import { LoadingBlock, ErrorBlock, EmptyState } from './components/LoadingState';
import ConfirmDialog from './components/ConfirmDialog';
import Toggle from './components/Toggle';

interface AdminCategoriesProps {
  onToast: (message: string, type?: 'success' | 'info') => void;
}

type CategoryFormState = { name: string; slug: string; image: string; isActive: boolean };

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function CategoryFormModal({
  initial,
  nextOrder,
  onClose,
  onSaved,
  onToast,
}: {
  initial: FirestoreCategory | null;
  nextOrder: number;
  onClose: () => void;
  onSaved: () => void;
  onToast: (message: string, type?: 'success' | 'info') => void;
}) {
  const [form, setForm] = useState<CategoryFormState>(
    initial ? { name: initial.name, slug: initial.slug, image: initial.image, isActive: initial.isActive } : { name: '', slug: '', image: '', isActive: true }
  );
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!!initial);

  const set = <K extends keyof CategoryFormState>(key: K, value: CategoryFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleNameChange = (name: string) => {
    set('name', name);
    if (!slugTouched) set('slug', slugify(name));
  };

  const handleUploadImage = () => {
    openCloudinaryUploadWidget({
      multiple: false,
      folder: 'purnimacart/categories',
      onSuccess: (result) => set('image', result.secureUrl),
      onError: (message) => onToast(message, 'info'),
    });
  };

  const isValid = form.name.trim() && form.slug.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), slug: slugify(form.slug), image: form.image, isActive: form.isActive };
      if (initial) {
        await updateCategory(initial.id, payload);
        onToast('Category updated.');
      } else {
        await createCategory({ ...payload, order: nextOrder });
        onToast('Category created.');
      }
      onSaved();
    } catch (error: any) {
      console.error(error);
      onToast(error.message || 'Could not save category.', 'info');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 animate-[fadeIn_0.15s_ease-out]" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full animate-[slideUp_0.2s_ease-out]">
        <div className="px-6 py-4 border-b border-[#e8bcb7]/15 flex items-center justify-between">
          <h3 className="font-display font-bold text-base text-[#291715]">{initial ? 'Edit Category' : 'Add Category'}</h3>
          <button type="button" onClick={onClose} className="text-[#5e3f3b]/50 hover:text-primary cursor-pointer" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex justify-center">
            <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#e8bcb7]/20 bg-[#fff0ee] flex items-center justify-center">
              {form.image ? (
                <img src={form.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <ImagePlus size={22} className="text-[#5e3f3b]/30" />
              )}
              <button
                type="button"
                onClick={handleUploadImage}
                className="absolute inset-0 bg-black/40 text-white opacity-0 hover:opacity-100 flex items-center justify-center text-[10px] font-bold transition-opacity cursor-pointer"
              >
                Upload
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-1.5 block">Name</label>
            <input
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-1.5 block">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => { setSlugTouched(true); set('slug', e.target.value); }}
              className="w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs font-mono outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>
          <Toggle checked={form.isActive} onChange={(v) => set('isActive', v)} label="Active (visible in store)" />
        </div>
        <div className="px-6 py-4 border-t border-[#e8bcb7]/15 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="text-xs font-bold text-[#5e3f3b] px-4 py-2.5 rounded-xl hover:bg-[#fff0ee] cursor-pointer">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !isValid}
            className="bg-primary text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-[#9a000e] transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Category'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminCategories({ onToast }: AdminCategoriesProps) {
  const { categories, loading, error } = useAdminCategories();
  const { products } = useAdminProducts();
  const [formTarget, setFormTarget] = useState<FirestoreCategory | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FirestoreCategory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  const productCounts = useMemo(() => countProductsByCategory(products), [products]);

  const requestDelete = async (category: FirestoreCategory) => {
    const hasProducts = await categoryHasProducts(category.slug);
    if (hasProducts) {
      setBlockedMessage(`"${category.name}" still has products assigned to it. Move or delete those products first.`);
      return;
    }
    setDeleteTarget(category);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCategory(deleteTarget.id);
      onToast('Category deleted.');
      setDeleteTarget(null);
    } catch (error: any) {
      console.error(error);
      onToast(error.message || 'Could not delete category.', 'info');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingBlock label="Loading categories…" />;
  if (error) return <ErrorBlock message={error} />;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          onClick={() => setFormTarget('new')}
          className="flex items-center gap-2 bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#9a000e] transition-colors cursor-pointer"
        >
          <Plus size={15} /> Add Category
        </button>
      </div>

      {categories.length === 0 ? (
        <EmptyState icon={Layers} title="No categories yet" description="Add your first category to start organizing products." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-[#e8bcb7]/20 p-4 shadow-sm flex items-center gap-3">
              <img
                src={c.image || 'https://placehold.co/80x80/fff0ee/bb0012?text=PC'}
                alt={c.name}
                className="w-12 h-12 rounded-xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#291715] truncate">{c.name}</p>
                <p className="text-[10px] font-mono text-primary font-bold select-all mt-0.5" title="Category Link ID (slug)">
                  ID: {c.slug}
                </p>
                <p className="text-[10px] text-[#5e3f3b]/50 mt-0.5">{productCounts[c.slug] || 0} products</p>
                <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${c.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-[#5e3f3b]/10 text-[#5e3f3b]/60'}`}>
                  {c.isActive ? 'Active' : 'Hidden'}
                </span>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button onClick={() => setFormTarget(c)} className="w-7 h-7 rounded-lg hover:bg-[#fff0ee] text-[#5e3f3b] inline-flex items-center justify-center cursor-pointer" aria-label="Edit">
                  <Pencil size={13} />
                </button>
                <button onClick={() => requestDelete(c)} className="w-7 h-7 rounded-lg hover:bg-red-50 text-[#5e3f3b] hover:text-red-600 inline-flex items-center justify-center cursor-pointer" aria-label="Delete">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formTarget && (
        <CategoryFormModal
          initial={formTarget === 'new' ? null : formTarget}
          nextOrder={categories.length}
          onClose={() => setFormTarget(null)}
          onSaved={() => setFormTarget(null)}
          onToast={onToast}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this category?"
        description={`"${deleteTarget?.name}" will be permanently removed. This can't be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={!!blockedMessage}
        title="Can't delete this category"
        description={blockedMessage || ''}
        confirmLabel="Got it"
        tone="default"
        onConfirm={() => setBlockedMessage(null)}
        onCancel={() => setBlockedMessage(null)}
      />
    </div>
  );
}
