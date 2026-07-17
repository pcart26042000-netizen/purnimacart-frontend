import React, { useMemo, useState } from 'react';
import { Search, Users, RefreshCw } from 'lucide-react';
import { useAdminCustomers } from './hooks/useAdminCustomers';
import { LoadingBlock, ErrorBlock, EmptyState } from './components/LoadingState';
import Pagination from './components/Pagination';

const PAGE_SIZE = 10;

export default function AdminCustomers() {
  const { customers, loading, error, refresh } = useAdminCustomers();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q));
  }, [customers, query]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return <LoadingBlock label="Loading customers…" />;
  if (error) return <ErrorBlock message={error} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5e3f3b]/40" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search by name or email"
            className="w-full h-10 bg-white border border-[#e8bcb7]/20 rounded-xl pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-1.5 text-xs font-bold text-[#5e3f3b] hover:text-primary transition-colors cursor-pointer w-fit"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No customers found" description="Anyone who signs in to the storefront shows up here." />
      ) : (
        <div className="bg-white rounded-2xl border border-[#e8bcb7]/20 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-[#5e3f3b]/50 border-b border-[#e8bcb7]/15">
                  <th className="px-5 py-3.5 font-bold">Customer</th>
                  <th className="px-5 py-3.5 font-bold">WhatsApp</th>
                  <th className="px-5 py-3.5 font-bold">Deals Opt-in</th>
                  <th className="px-5 py-3.5 font-bold">Joined</th>
                  <th className="px-5 py-3.5 font-bold">Orders</th>
                  <th className="px-5 py-3.5 font-bold">Lifetime Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8bcb7]/10">
                {paged.map((c) => (
                  <tr key={c.uid} className="hover:bg-[#fff8f7] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {c.photoURL ? (
                          <img src={c.photoURL} alt={c.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {c.name?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#291715] truncate">{c.name || 'Unnamed'}</p>
                          <p className="text-[10px] text-[#5e3f3b]/60 truncate">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#5e3f3b]/70 text-xs font-medium">
                      {c.whatsapp ? (
                        <span className="font-mono">{c.whatsapp}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={!!c.receiveDeals}
                        readOnly
                        className="w-3.5 h-3.5 accent-primary rounded pointer-events-none"
                      />
                    </td>
                    <td className="px-5 py-3.5 text-[#5e3f3b]/70 text-xs">
                      {c.createdAt?.toDate?.() ? c.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-[#291715] font-semibold text-xs">{c.orderCount}</td>
                    <td className="px-5 py-3.5 text-primary font-bold text-xs">₹{c.totalSpend.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
