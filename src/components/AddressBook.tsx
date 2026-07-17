import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Pencil, Trash2, CheckCircle2, X, Star } from 'lucide-react';
import type { Address } from '../types/firestore';
import { addAddress, updateAddress, deleteAddress, setDefaultAddress, validateAddress, type AddressInput } from '../lib/services/addresses';

interface AddressBookProps {
  uid: string;
  addresses: Address[];
  selectable?: boolean;
  selectedId?: string | null;
  onSelect?: (address: Address) => void;
  onToast: (message: string, type?: 'success' | 'info') => void;
}

const EMPTY_FORM: AddressInput = {
  label: 'Home',
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  landmark: '',
  city: '',
  district: '',
  state: '',
  country: 'India',
  pincode: '',
  isDefault: false,
};

export default function AddressBook({ uid, addresses, selectable, selectedId, onSelect, onToast }: AddressBookProps) {
  const [formOpen, setFormOpen] = useState(addresses.length === 0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressInput>(EMPTY_FORM);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (addresses.length === 0) {
      setFormOpen(true);
    }
  }, [addresses.length]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setErrors([]);
    setFormOpen(true);
  };

  const openEdit = (address: Address) => {
    setForm({
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 || '',
      landmark: address.landmark || '',
      city: address.city,
      district: address.district || '',
      state: address.state,
      country: address.country || 'India',
      pincode: address.pincode,
      isDefault: address.isDefault,
    });
    setEditingId(address.id);
    setErrors([]);
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateAddress(form);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateAddress(uid, editingId, form);
        onToast('Address updated.');
      } else {
        await addAddress(uid, form);
        onToast('Address added.');
      }
      setFormOpen(false);
    } catch (error: any) {
      console.error(error);
      onToast(error.message || 'Could not save address.', 'info');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    setDeletingId(addressId);
    try {
      await deleteAddress(uid, addressId);
      onToast('Address removed.', 'info');
    } catch (error: any) {
      console.error(error);
      onToast(error.message || 'Could not remove address.', 'info');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await setDefaultAddress(uid, addressId);
      onToast('Default address updated.');
    } catch (error: any) {
      console.error(error);
      onToast(error.message || 'Could not update default address.', 'info');
    }
  };

  return (
    <div className="space-y-4">
      {addresses.length === 0 && !formOpen && (
        <div className="flex flex-col items-center justify-center py-10 text-center gap-3 bg-white rounded-3xl border border-[#e8bcb7]/15">
          <MapPin size={32} className="text-[#e8bcb7]" />
          <p className="text-xs font-semibold text-[#5e3f3b]/70">No saved addresses yet.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {addresses.map((address) => (
          <div
            key={address.id}
            onClick={() => selectable && onSelect?.(address)}
            className={`p-5 rounded-2xl border transition-all relative ${
              selectable ? 'cursor-pointer' : ''
            } ${
              selectable && selectedId === address.id
                ? 'border-primary bg-[#fff0ee] shadow-sm'
                : 'border-[#e8bcb7]/20 bg-white hover:border-primary/40'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#fff0ee] text-primary px-2.5 py-1 rounded-full">
                {address.label}
              </span>
              <div className="flex items-center gap-2">
                {address.isDefault && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                    <Star size={11} className="fill-emerald-500 text-emerald-500" /> Default
                  </span>
                )}
                {selectable && selectedId === address.id && (
                  <CheckCircle2 size={16} className="text-primary" />
                )}
              </div>
            </div>
            <p className="text-sm font-bold text-[#291715]">{address.fullName}</p>
            <p className="text-xs text-[#5e3f3b] mt-1 leading-relaxed">
              {address.line1}
              {address.line2 ? `, ${address.line2}` : ''}
              {address.landmark ? `, Near ${address.landmark}` : ''}
              <br />
              {address.city}
              {address.district ? `, ${address.district}` : ''}, {address.state} - {address.pincode}
              <br />
              {address.country}
            </p>
            <p className="text-xs text-[#5e3f3b]/70 mt-1">Phone: {address.phone}</p>

            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#e8bcb7]/10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(address);
                }}
                className="text-[11px] font-bold text-[#5e3f3b] hover:text-primary flex items-center gap-1 cursor-pointer"
              >
                <Pencil size={12} /> Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(address.id);
                }}
                disabled={deletingId === address.id}
                className="text-[11px] font-bold text-[#5e3f3b] hover:text-primary flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Trash2 size={12} /> {deletingId === address.id ? 'Removing…' : 'Delete'}
              </button>
              {!address.isDefault && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetDefault(address.id);
                  }}
                  className="text-[11px] font-bold text-[#5e3f3b] hover:text-primary cursor-pointer"
                >
                  Set Default
                </button>
              )}
            </div>
          </div>
        ))}

        {!formOpen && (
          <button
            onClick={openAdd}
            className="p-5 rounded-2xl border border-dashed border-[#e8bcb7]/40 flex flex-col items-center justify-center gap-2 text-[#5e3f3b]/70 hover:border-primary hover:text-primary transition-colors cursor-pointer min-h-[140px]"
          >
            <Plus size={20} />
            <span className="text-xs font-bold">Add New Address</span>
          </button>
        )}
      </div>

      {formOpen && (
        <form
          onSubmit={handleSave}
          className="bg-white border border-[#e8bcb7]/20 rounded-2xl p-5 space-y-3 relative"
        >
          <button
            type="button"
            onClick={() => setFormOpen(false)}
            className="absolute top-4 right-4 text-[#5e3f3b]/50 hover:text-primary cursor-pointer"
          >
            <X size={16} />
          </button>
          <h4 className="font-display font-bold text-sm text-[#291715]">
            {editingId ? 'Edit Address' : 'Add New Address'}
          </h4>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1">
              {errors.map((err) => (
                <p key={err} className="text-[11px] text-red-600 font-semibold">{err}</p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="col-span-2 sm:col-span-1 bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="Home">Home</option>
              <option value="Work">Work</option>
              <option value="Other">Other</option>
            </select>
            <input
              placeholder="Full Name"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              placeholder="Phone Number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              placeholder="Address Line 1"
              value={form.line1}
              onChange={(e) => setForm({ ...form, line1: e.target.value })}
              className="col-span-2 bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              placeholder="Address Line 2 (optional)"
              value={form.line2}
              onChange={(e) => setForm({ ...form, line2: e.target.value })}
              className="col-span-2 bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              placeholder="Landmark (optional)"
              value={form.landmark}
              onChange={(e) => setForm({ ...form, landmark: e.target.value })}
              className="col-span-2 bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              placeholder="District (optional)"
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
              className="bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              placeholder="State"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              placeholder="Pincode"
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              className="bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              placeholder="Country"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
            <label className="col-span-2 flex items-center gap-2 text-xs font-semibold text-[#5e3f3b] cursor-pointer">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                className="accent-primary"
              />
              Set as default address
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-primary hover:bg-[#9a000e] text-white text-xs font-bold px-6 py-3 rounded-xl transition-colors cursor-pointer disabled:opacity-60"
          >
            {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Save Address'}
          </button>
        </form>
      )}
    </div>
  );
}
