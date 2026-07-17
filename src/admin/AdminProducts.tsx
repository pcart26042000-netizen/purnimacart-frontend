import React, { useMemo, useState } from 'react';
import { Search, Plus, Pencil, Trash2, X, ImagePlus, Star } from 'lucide-react';
import type { FirestoreProduct, ProductVariant, ReturnWindow } from '../types/firestore';
import { useAdminProducts } from './hooks/useAdminProducts';
import { useAdminCategories } from './hooks/useAdminCategories';
import { createProduct, updateProduct, deleteProduct, countProductsByCategory, searchProductsLocal } from '../lib/services/products';
import { openCloudinaryUploadWidget } from '../lib/cloudinary';
import { LoadingBlock, ErrorBlock, EmptyState } from './components/LoadingState';
import ConfirmDialog from './components/ConfirmDialog';
import Pagination from './components/Pagination';
import Toggle from './components/Toggle';

const PAGE_SIZE = 8;
const RETURN_WINDOWS: ReturnWindow[] = ['none', '1-day', '3-day', '7-day'];

interface AdminProductsProps {
  onToast: (message: string, type?: 'success' | 'info') => void;
}

type ProductFormState = {
  name: string;
  description: string;
  categorySlug: string;
  price: string;
  offerPrice: string;
  stock: string;
  sku: string;
  brand: string;
  tags: string;
  returnWindow: ReturnWindow;
  isActive: boolean;
  isFeatured: boolean;
  isFiveMinBadge: boolean;
  images: string[];
  variants: ProductVariant[];
  hasSizes: boolean;
  sizes: { size: string; stock: number }[];
};

const EMPTY_FORM: ProductFormState = {
  name: '',
  description: '',
  categorySlug: '',
  price: '',
  offerPrice: '',
  stock: '0',
  sku: '',
  brand: '',
  tags: '',
  returnWindow: '7-day',
  isActive: true,
  isFeatured: false,
  isFiveMinBadge: false,
  images: [],
  variants: [],
  hasSizes: false,
  sizes: [],
};

function toFormState(p: FirestoreProduct): ProductFormState {
  return {
    name: p.name,
    description: p.description,
    categorySlug: p.categorySlug,
    price: String(p.price),
    offerPrice: p.offerPrice != null ? String(p.offerPrice) : '',
    stock: String(p.stock),
    sku: p.sku,
    brand: p.brand || '',
    tags: p.tags.join(', '),
    returnWindow: p.returnWindow,
    isActive: p.isActive,
    isFeatured: !!p.isFeatured,
    isFiveMinBadge: !!p.isFiveMinBadge,
    images: p.images,
    variants: p.variants || [],
    hasSizes: !!p.hasSizes,
    sizes: p.sizes || [],
  };
}

function ProductFormModal({
  initial,
  categories,
  onClose,
  onSaved,
  onToast,
}: {
  initial: FirestoreProduct | null;
  categories: { slug: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
  onToast: (message: string, type?: 'success' | 'info') => void;
}) {
  const [form, setForm] = useState<ProductFormState>(initial ? toFormState(initial) : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleUploadImages = () => {
    openCloudinaryUploadWidget({
      multiple: true,
      maxFiles: 6,
      folder: 'purnimacart/products',
      onSuccess: (result) => setForm((f) => ({ ...f, images: [...f.images, result.secureUrl] })),
      onError: (message) => onToast(message, 'info'),
    });
    setUploading(true);
    setTimeout(() => setUploading(false), 500);
  };

  const removeImage = (url: string) => set('images', form.images.filter((i) => i !== url));

  const addVariant = () => set('variants', [...form.variants, { color: '', image: '', price: undefined, stock: Number(form.stock) || 1 }]);
  const updateVariant = (idx: number, patch: Partial<ProductVariant>) =>
    set('variants', form.variants.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
  const removeVariant = (idx: number) => set('variants', form.variants.filter((_, i) => i !== idx));

  const addSize = () => set('sizes', [...form.sizes, { size: '', stock: 1 }]);
  const updateSize = (idx: number, patch: Partial<{ size: string; stock: number }>) =>
    set('sizes', form.sizes.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  const removeSize = (idx: number) => set('sizes', form.sizes.filter((_, i) => i !== idx));

  const handleUploadVariantImage = (idx: number) => {
    openCloudinaryUploadWidget({
      multiple: false,
      folder: 'purnimacart/variants',
      onSuccess: (result) => {
        updateVariant(idx, { image: result.secureUrl });
      },
      onError: (message) => onToast(message, 'info'),
    });
  };

  const isValid =
    form.name.trim() &&
    form.categorySlug &&
    form.sku.trim() &&
    Number(form.price) >= 0 &&
    Number(form.stock) >= 0 &&
    form.images.length > 0 &&
    (!form.offerPrice || Number(form.offerPrice) <= Number(form.price));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      onToast('Fill in name, category, SKU, a valid price/stock, and at least one image.', 'info');
      return;
    }
    setSaving(true);
    try {
      const computedStock = form.hasSizes
        ? form.sizes.reduce((acc, s) => acc + (Number(s.stock) || 0), 0)
        : Number(form.stock);

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        categorySlug: form.categorySlug,
        price: Number(form.price),
        offerPrice: form.offerPrice ? Number(form.offerPrice) : null,
        images: form.images,
        stock: computedStock,
        sku: form.sku.trim(),
        brand: form.brand.trim(),
        variants: form.variants.filter((v) => v.color),
        hasSizes: form.hasSizes,
        sizes: form.hasSizes ? form.sizes.filter((s) => s.size) : [],
        returnWindow: form.returnWindow,
        rating: initial?.rating ?? 0,
        reviewCount: initial?.reviewCount ?? 0,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        isFiveMinBadge: form.isFiveMinBadge,
      };
      if (initial) {
        await updateProduct(initial.id, payload);
        onToast('Product updated.');
      } else {
        await createProduct(payload as Omit<FirestoreProduct, 'id' | 'createdAt'>);
        onToast('Product created.');
      }
      onSaved();
    } catch (error: any) {
      console.error(error);
      onToast(error.message || 'Could not save product.', 'info');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 animate-[fadeIn_0.15s_ease-out]" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-[slideUp_0.2s_ease-out]"
      >
        <div className="sticky top-0 bg-white border-b border-[#e8bcb7]/15 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="font-display font-bold text-base text-[#291715]">{initial ? 'Edit Product' : 'Add Product'}</h3>
          <button type="button" onClick={onClose} className="text-[#5e3f3b]/50 hover:text-primary cursor-pointer" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Images */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-2 block">Images</label>
            <div className="flex flex-wrap gap-3">
              {form.images.map((url) => (
                <div key={url} className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#e8bcb7]/20 group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleUploadImages}
                disabled={uploading}
                className="w-16 h-16 rounded-xl border-2 border-dashed border-[#e8bcb7]/40 flex items-center justify-center text-[#5e3f3b]/50 hover:border-primary hover:text-primary transition-colors cursor-pointer"
              >
                <ImagePlus size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-1.5 block">Name</label>
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className="w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-1.5 block">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={3}
                className="w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-1.5 block">Category</label>
              <select
                value={form.categorySlug}
                onChange={(e) => set('categorySlug', e.target.value)}
                className="w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                required
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-1.5 block">SKU</label>
              <input
                value={form.sku}
                onChange={(e) => set('sku', e.target.value)}
                className="w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-1.5 block">Price (₹)</label>
              <input
                type="number" min="0" step="0.01"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                className="w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-1.5 block">Offer Price (₹, optional)</label>
              <input
                type="number" min="0" step="0.01"
                value={form.offerPrice}
                onChange={(e) => set('offerPrice', e.target.value)}
                className="w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-1.5 block">Stock</label>
              <input
                type="number" min="0" step="1"
                value={form.stock}
                onChange={(e) => set('stock', e.target.value)}
                className="w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-1.5 block">Brand</label>
              <input
                value={form.brand}
                onChange={(e) => set('brand', e.target.value)}
                className="w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-1.5 block">Return Window</label>
              <select
                value={form.returnWindow}
                onChange={(e) => set('returnWindow', e.target.value as ReturnWindow)}
                className="w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
              >
                {RETURN_WINDOWS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-1.5 block">Tags (comma separated)</label>
              <input
                value={form.tags}
                onChange={(e) => set('tags', e.target.value)}
                placeholder="new, bestseller, cotton"
                className="w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Variants */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50">Variants (optional)</label>
              <button type="button" onClick={addVariant} className="text-[11px] font-bold text-primary hover:underline cursor-pointer">
                + Add variant
              </button>
            </div>
            {form.variants.length > 0 && (
              <div className="space-y-3">
                {form.variants.map((v, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-[#fff8f7]/50 p-3 rounded-xl border border-[#e8bcb7]/15">
                    {/* Variant Image Upload/Preview */}
                    <div className="shrink-0">
                      {v.image ? (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#e8bcb7]/20 group">
                          <img src={v.image} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => updateVariant(idx, { image: '' })}
                            className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer text-[10px] font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleUploadVariantImage(idx)}
                          className="w-12 h-12 rounded-lg border-2 border-dashed border-[#e8bcb7]/35 flex flex-col items-center justify-center text-[#5e3f3b]/50 hover:border-primary hover:text-primary transition-colors cursor-pointer"
                          title="Upload variant image"
                        >
                          <ImagePlus size={14} />
                          <span className="text-[8px] font-bold mt-0.5">Image</span>
                        </button>
                      )}
                    </div>

                    {/* Color Input */}
                    <div className="flex-1 min-w-0">
                      <input
                        placeholder="Color Name"
                        value={v.color || ''}
                        onChange={(e) => updateVariant(idx, { color: e.target.value })}
                        className="w-full bg-white border border-[#e8bcb7]/20 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary font-semibold text-[#291715]"
                        required
                      />
                    </div>

                    {/* Price Override (Optional) */}
                    <div className="w-24">
                      <input
                        type="number" min="0" step="0.01"
                        placeholder="Price (₹)"
                        value={v.price !== undefined ? v.price : ''}
                        onChange={(e) => updateVariant(idx, { price: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full bg-white border border-[#e8bcb7]/20 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary text-[#291715]"
                      />
                    </div>

                    {/* Stock Input */}
                    <div className="w-20">
                      <input
                        type="number" min="0" step="1"
                        placeholder="Stock"
                        value={v.stock ?? 0}
                        onChange={(e) => updateVariant(idx, { stock: Number(e.target.value) })}
                        className="w-full bg-white border border-[#e8bcb7]/20 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary text-[#291715]"
                        required
                      />
                    </div>

                    {/* Remove Button */}
                    <button 
                      type="button" 
                      onClick={() => removeVariant(idx)} 
                      className="text-[#5e3f3b]/40 hover:text-red-500 cursor-pointer shrink-0"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Sizes Customizer */}
          <div className="border-t border-[#e8bcb7]/15 pt-4">
            <Toggle
              checked={form.hasSizes}
              onChange={(v) => {
                set('hasSizes', v);
                if (v && form.sizes.length === 0) {
                  set('sizes', [
                    { size: 'XS', stock: 10 },
                    { size: 'S', stock: 10 },
                    { size: 'M', stock: 10 },
                    { size: 'L', stock: 10 },
                    { size: 'XL', stock: 10 },
                    { size: 'XXL', stock: 10 }
                  ]);
                }
              }}
              label="Enable Size Options (for Clothing/Apparel)"
            />
            
            {form.hasSizes && (
              <div className="mt-3 bg-[#fff8f7]/40 p-4 rounded-2xl border border-[#e8bcb7]/15 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wide text-[#5e3f3b]">Configure Sizes</label>
                  <button type="button" onClick={addSize} className="text-[10px] font-bold bg-primary text-white px-2.5 py-1 rounded-lg hover:bg-[#9a000e] cursor-pointer">
                    + Add Size Option
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {form.sizes.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-[#e8bcb7]/10">
                      <div className="flex-1">
                        <input
                          placeholder="e.g. XS, S, M, L, XL"
                          value={s.size}
                          onChange={(e) => updateSize(idx, { size: e.target.value.toUpperCase() })}
                          className="w-full bg-[#fff8f7] border border-[#e8bcb7]/15 rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary font-bold text-[#291715]"
                          required
                        />
                      </div>
                      <div className="w-20">
                        <input
                          type="number" min="0" step="1"
                          placeholder="Stock"
                          value={s.stock}
                          onChange={(e) => updateSize(idx, { stock: Number(e.target.value) })}
                          className="w-full bg-[#fff8f7] border border-[#e8bcb7]/15 rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary text-[#291715] font-semibold"
                          required
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeSize(idx)} 
                        className="text-[#5e3f3b]/40 hover:text-red-500 cursor-pointer px-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                
                {form.sizes.length > 0 && (
                  <p className="text-[10px] text-[#5e3f3b]/70 font-semibold italic mt-1 bg-white p-2 rounded-lg border border-dashed border-[#e8bcb7]/20">
                    * Total item stock will be dynamically computed as the sum of all configurations: <strong>{form.sizes.reduce((acc, s) => acc + (Number(s.stock) || 0), 0)}</strong>.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <Toggle checked={form.isActive} onChange={(v) => set('isActive', v)} label="Active (visible in store)" />
            <Toggle checked={form.isFeatured} onChange={(v) => set('isFeatured', v)} label="Featured" />
            <Toggle checked={form.isFiveMinBadge} onChange={(v) => set('isFiveMinBadge', v)} label="5 Min Badge" />
          </div>
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
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminProducts({ onToast }: AdminProductsProps) {
  const { products, loading, error } = useAdminProducts();
  const { categories } = useAdminCategories();
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [formTarget, setFormTarget] = useState<FirestoreProduct | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FirestoreProduct | null>(null);
  const [deleting, setDeleting] = useState(false);

  const productCounts = useMemo(() => countProductsByCategory(products), [products]);

  const filtered = useMemo(() => {
    let result = searchProductsLocal(products, query);
    if (categoryFilter !== 'all') result = result.filter((p) => p.categorySlug === categoryFilter);
    return result;
  }, [products, query, categoryFilter]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      onToast('Product deleted.');
      setDeleteTarget(null);
    } catch (error: any) {
      console.error(error);
      onToast(error.message || 'Could not delete product.', 'info');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingBlock label="Loading products…" />;
  if (error) return <ErrorBlock message={error} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-1 gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5e3f3b]/40" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search products, tags…"
              className="w-full h-10 bg-white border border-[#e8bcb7]/20 rounded-xl pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="h-10 bg-white border border-[#e8bcb7]/20 rounded-xl px-3 text-xs outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name} ({productCounts[c.slug] || 0})</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setFormTarget('new')}
          className="flex items-center gap-2 bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#9a000e] transition-colors cursor-pointer shrink-0"
        >
          <Plus size={15} /> Add Product
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ImagePlus} title="No products found" description="Try a different search, or add your first product." />
      ) : (
        <div className="bg-white rounded-2xl border border-[#e8bcb7]/20 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-[#5e3f3b]/50 border-b border-[#e8bcb7]/15">
                  <th className="px-5 py-3.5 font-bold">Product</th>
                  <th className="px-5 py-3.5 font-bold">Category</th>
                  <th className="px-5 py-3.5 font-bold">Price</th>
                  <th className="px-5 py-3.5 font-bold">Stock</th>
                  <th className="px-5 py-3.5 font-bold">Status</th>
                  <th className="px-5 py-3.5 font-bold">5 Min</th>
                  <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8bcb7]/10">
                {paged.map((p) => (
                  <tr key={p.id} className="hover:bg-[#fff8f7] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img src={p.images[0] || 'https://placehold.co/80x80/fff0ee/bb0012?text=PC'} alt={p.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#291715] flex items-center gap-1">
                            {p.name}
                            {p.isFeatured && <Star size={11} className="fill-amber-400 text-amber-400 shrink-0" />}
                          </p>
                          <p className="text-[10px] text-[#5e3f3b]/50 font-mono">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#5e3f3b]/70 text-xs capitalize">{p.categorySlug}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-xs font-bold text-[#291715]">₹{(p.offerPrice ?? p.price).toLocaleString('en-IN')}</p>
                      {p.offerPrice != null && <p className="text-[10px] text-[#5e3f3b]/40 line-through">₹{p.price.toLocaleString('en-IN')}</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-bold ${p.stock <= 5 ? 'text-amber-600' : 'text-[#291715]'}`}>{p.stock}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${p.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-[#5e3f3b]/10 text-[#5e3f3b]/60'}`}>
                        {p.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${p.isFiveMinBadge ? 'bg-green-50 text-green-700' : 'bg-[#5e3f3b]/10 text-[#5e3f3b]/60'}`}>
                        {p.isFiveMinBadge ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => setFormTarget(p)} className="w-8 h-8 rounded-lg hover:bg-[#fff0ee] text-[#5e3f3b] inline-flex items-center justify-center cursor-pointer" aria-label="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(p)} className="w-8 h-8 rounded-lg hover:bg-red-50 text-[#5e3f3b] hover:text-red-600 inline-flex items-center justify-center cursor-pointer" aria-label="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
        </div>
      )}

      {formTarget && (
        <ProductFormModal
          initial={formTarget === 'new' ? null : formTarget}
          categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
          onClose={() => setFormTarget(null)}
          onSaved={() => setFormTarget(null)}
          onToast={onToast}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this product?"
        description={`"${deleteTarget?.name}" will be permanently removed from the catalog. This can't be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}


