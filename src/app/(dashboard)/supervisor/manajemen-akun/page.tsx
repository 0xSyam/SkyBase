"use client";

import React, { useEffect, useMemo, useState } from "react";
import Notification from "@/component/Notification";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Plus, Filter } from "lucide-react";
import PageLayout from "@/component/PageLayout";
import GlassCard from "@/component/Glasscard";
import { authApi } from "@/lib/api/skybase";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface AccountRow {
  id: string;
  username: string;
  role: string;
  avatar?: string;
  is_active: boolean;
  created_at: string;
}

interface FilterConfig {
  role: "all" | "supervisor" | "warehouse" | "groundcrew";
  sort: "name_asc" | "name_desc" | "newest" | "oldest";
}

const initialFilterConfig: FilterConfig = {
  role: "all",
  sort: "name_asc",
};

function isApiErrorWithPayload(
  error: unknown
): error is { payload: { message?: string } } {
  if (
    typeof error === "object" &&
    error !== null &&
    "payload" in error
  ) {
    const payload = (error as { payload: unknown }).payload;
    return (
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload
    );
  }
  return false;
}

export default function SupervisorManajemenAkunPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [accountList, setAccountList] = useState<AccountRow[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AccountRow | null>(null);
  
  // Filter State
  const [filterConfig, setFilterConfig] = useState<FilterConfig>(initialFilterConfig);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Loading & Notification
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await authApi.getAllUsers();
        const accounts = res.data ?? [];
        setAccountList(
          accounts.map((account) => ({
            id: String(account.user_id),
            username: account.name,
            role: account.role,
            is_active: account.is_active,
            created_at: account.created_at,
          }))
        );
      } catch (error) {
        console.error("Failed to fetch accounts", error);
      }
    };

    fetchAccounts();
  }, []);

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedAccount(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedAccount) return;

    setDeleteLoading(true);
    try {
      await authApi.deleteUser(selectedAccount.id);
      setAccountList((prev) => prev.filter((acc) => acc.id !== selectedAccount.id));
      setNotification({ type: 'success', message: `Akun ${selectedAccount.username} berhasil dihapus` });
      closeDeleteModal();
    } catch (error) {
      let errorMsg = "Gagal menghapus akun";
      if (isApiErrorWithPayload(error)) {
        errorMsg = error.payload.message || errorMsg;
      }
      setNotification({ type: 'error', message: errorMsg });
      closeDeleteModal();
    } finally {
      setDeleteLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleConfirmResetPassword = async () => {
    if (!selectedAccount) return;

    setResetLoading(true);
    try {
      await authApi.resetPassword(selectedAccount.id);
      setNotification({ type: 'success', message: `Password ${selectedAccount.username} direset ke "password123"` });
      setIsResetConfirmOpen(false);
      setSelectedAccount(null);
    } catch (error) {
      let errorMsg = "Gagal mereset password";
      if (isApiErrorWithPayload(error)) {
        errorMsg = error.payload.message || errorMsg;
      }
      setNotification({ type: 'error', message: errorMsg });
    } finally {
      setResetLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const filteredAccounts = useMemo(() => {
    let processed = [...accountList];

    // 1. Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      processed = processed.filter((a) => a.username.toLowerCase().includes(q));
    }

    // 2. Filter Role
    if (filterConfig.role !== 'all') {
      processed = processed.filter((a) => a.role.toLowerCase() === filterConfig.role);
    }

    // 3. Sort
    processed.sort((a, b) => {
      switch (filterConfig.sort) {
        case 'name_asc': return a.username.localeCompare(b.username);
        case 'name_desc': return b.username.localeCompare(a.username);
        case 'newest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default: return 0;
      }
    });

    return processed;
  }, [accountList, searchTerm, filterConfig]);

  return (
    <PageLayout sidebarRole="supervisor">
      <section className="w-full max-w-[1076px] space-y-6">
        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}
        <div className="flex flex-col items-center text-center gap-2 mt-2">
          <h1 className="text-3xl md:text-4xl font-semibold text-[#111827]">Manajemen Akun</h1>
          <p className="text-[#6B7280]">Kelola dan tambah akun untuk Groundcrew dan Warehouse</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama pengguna..."
              className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-[#0D63F3] bg-white text-[#0D63F3] placeholder:text-[#0D63F3] font-medium focus:outline-none"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0D63F3]" width="22" height="22" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="2" />
              <path d="M12 12L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          {/* FILTER POPOVER */}
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <button className="grid h-12 w-12 place-items-center rounded-xl bg-[#0D63F3] text-white shadow-[0_2px_6px_rgba(13,99,243,0.35)] active:scale-95 transition hover:bg-blue-700">
                <Filter className="w-5 h-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 bg-white rounded-2xl shadow-xl" align="end">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                   <h4 className="font-semibold text-[#111827]">Filter Akun</h4>
                   <button onClick={() => setFilterConfig(initialFilterConfig)} className="text-xs text-[#0D63F3] hover:underline">Reset</button>
                </div>

                <div className="space-y-3">
                   <Label className="text-xs font-medium text-gray-500">Role</Label>
                   <div className="flex flex-wrap gap-2">
                      {['all', 'supervisor', 'warehouse', 'groundcrew'].map((r) => (
                         <button
                           key={r}
                           onClick={() => setFilterConfig(p => ({ ...p, role: r as "all" | "supervisor" | "warehouse" | "groundcrew" }))}
                           className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${filterConfig.role === r ? 'bg-[#0D63F3] text-white border-[#0D63F3]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                         >
                           {r === 'all' ? 'Semua' : r.charAt(0).toUpperCase() + r.slice(1)}
                         </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-3">
                   <Label className="text-xs font-medium text-gray-500">Urutkan</Label>
                   <select 
                     value={filterConfig.sort}
                     onChange={(e) => setFilterConfig(p => ({ ...p, sort: e.target.value as FilterConfig["sort"] }))}
                     className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#0D63F3]"
                   >
                     <option value="name_asc">Nama (A-Z)</option>
                     <option value="name_desc">Nama (Z-A)</option>
                     <option value="newest">Terbaru Dibuat</option>
                     <option value="oldest">Terlama Dibuat</option>
                   </select>
                </div>

                <Button onClick={() => setIsFilterOpen(false)} className="w-full bg-[#0D63F3] hover:bg-[#0B53D0] rounded-xl">
                   Terapkan
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-xl bg-[#0D63F3] text-white shadow-[0_2px_6px_rgba(13,99,243,0.35)] active:scale-95 transition hover:bg-blue-700"
            onClick={() => router.push('/supervisor/manajemen-akun/create')}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <GlassCard className="overflow-hidden">
          <div className="flex h-[60px] items-center bg-[#F4F8FB] text-sm font-semibold text-[#222222] px-4 rounded-t-xl">
            <div className="flex-1">Username</div>
            <div className="w-28 sm:w-44 text-right">Action</div>
          </div>
          <div className="divide-y divide-[#E9EEF3]">
            {filteredAccounts.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">Tidak ada akun yang cocok dengan filter.</div>
            ) : (
              filteredAccounts.map((row, index) => (
                <div key={`account-${row.id}-${index}`} className="px-4 py-4 sm:py-5 flex items-center hover:bg-gray-50/50 transition">
                  <div className="flex-1 flex items-center gap-3 pr-4">
                    <div className={`relative h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-semibold ${row.is_active ? 'bg-gradient-to-br from-blue-500 to-blue-700' : 'bg-gray-400'}`}>
                       <span>{row.username.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}</span>
                       {!row.is_active && <div className="absolute bottom-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full" title="Non-Aktif"></div>}
                    </div>
                    <div className="leading-tight">
                      <div className="text-[17px] font-medium text-[#111827]">{row.username}</div>
                      <div className="text-sm text-[#6B7280] capitalize">{row.role}</div>
                    </div>
                  </div>
                  <div className="w-28 sm:w-44 flex justify-end gap-2 sm:gap-3">
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#F59E0B] text-white active:scale-95 transition hover:bg-amber-600"
                      title="Reset Password"
                      onClick={() => { setSelectedAccount(row); setIsResetConfirmOpen(true); }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10.6667 6.66667V5.33333C10.6667 3.86058 9.47276 2.66667 8 2.66667C6.52724 2.66667 5.33333 3.86058 5.33333 5.33333V6.66667M3.33333 6.66667H12.6667C13.0349 6.66667 13.3333 6.96514 13.3333 7.33333V12.6667C13.3333 13.0349 13.0349 13.3333 12.6667 13.3333H3.33333C2.96514 13.3333 2.66667 13.0349 2.66667 12.6667V7.33333C2.66667 6.96514 2.96514 6.66667 3.33333 6.66667Z" /></svg>
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#EF4444] text-white active:scale-95 transition hover:bg-red-600"
                      title="Hapus Akun"
                      onClick={() => { setSelectedAccount(row); setIsDeleteModalOpen(true); }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </section>

      {/* DELETE MODAL & RESET MODAL (Same as before) */}
      {isMounted && isDeleteModalOpen && createPortal(
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#050022]/40 px-4 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-sm rounded-[32px] bg-white p-6 sm:p-8 text-center shadow-xl">
              <h2 className="text-2xl font-semibold text-[#11264D]">Hapus Akun?</h2>
              {selectedAccount && <p className="mt-3 text-sm text-[#5B5F6B]">Akun <span className="font-semibold text-[#0D63F3]">{selectedAccount.username}</span> akan dihapus permanen.</p>}
              <div className="mt-8 flex gap-4 justify-center">
                <button onClick={handleConfirmDelete} disabled={deleteLoading} className="w-32 rounded-full border border-[#FF3B30] px-6 py-2 text-sm font-semibold text-[#FF3B30] hover:bg-red-50">{deleteLoading ? '...' : 'Hapus'}</button>
                <button onClick={closeDeleteModal} disabled={deleteLoading} className="w-32 rounded-full bg-[#0D63F3] px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700">Batal</button>
              </div>
            </div>
          </div>, document.body
      )}

      {isMounted && isResetConfirmOpen && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#050022]/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[32px] bg-white p-6 sm:p-8 text-center shadow-xl">
            <h2 className="text-2xl font-semibold text-[#11264D]">Reset Password?</h2>
            {selectedAccount && <p className="mt-3 text-sm text-[#5B5F6B]">Password <span className="font-semibold text-[#0D63F3]">{selectedAccount.username}</span> akan direset.</p>}
            <div className="mt-8 flex gap-4 justify-center">
              <button onClick={handleConfirmResetPassword} disabled={resetLoading} className="w-32 rounded-full border border-amber-500 px-6 py-2 text-sm font-semibold text-amber-600 hover:bg-amber-50">{resetLoading ? '...' : 'Ya, Reset'}</button>
              <button onClick={() => setIsResetConfirmOpen(false)} disabled={resetLoading} className="w-32 rounded-full bg-[#0D63F3] px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700">Batal</button>
            </div>
          </div>
        </div>, document.body
      )}
    </PageLayout>
  );
}