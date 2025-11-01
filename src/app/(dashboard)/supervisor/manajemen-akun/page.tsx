"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Plus } from "lucide-react";
import PageLayout from "@/component/PageLayout";
import PageHeader from "@/component/PageHeader";
import GlassDataTable, { type ColumnDef } from "@/component/GlassDataTable";

interface AccountRow {
  id: string;
  username: string;
  role: string;
  avatar?: string;
}

const initialAccounts: AccountRow[] = [
  { id: "groundcrew-1", username: "Hisyam Ardiansyah", role: "Groundcrew" },
  { id: "groundcrew-2", username: "Hisyam Ardiansyah", role: "Groundcrew" },
  { id: "groundcrew-3", username: "Hisyam Ardiansyah", role: "Groundcrew" },
  { id: "groundcrew-4", username: "Hisyam Ardiansyah", role: "Groundcrew" },
  { id: "groundcrew-5", username: "Hisyam Ardiansyah", role: "Groundcrew" },
];

export default function SupervisorManajemenAkunPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [accountList, setAccountList] = useState<AccountRow[]>(initialAccounts);
  const [selectedAccount, setSelectedAccount] = useState<AccountRow | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedAccount(null);
  };

  const handleConfirmDelete = () => {
    if (!selectedAccount) {
      return;
    }

    setAccountList((prevAccounts) => prevAccounts.filter((account) => account.id !== selectedAccount.id));
    closeDeleteModal();
  };

  const columns: ColumnDef<AccountRow>[] = useMemo(
    () => [
      {
        key: "username",
        header: "Username",
        align: "left",
        render: (value, row) => (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700">
              {row.avatar ? (
                <Image src={row.avatar} alt={value as string} fill className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-white text-sm font-semibold">
                  {(value as string).split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </span>
              )}
            </div>
            <span className="font-medium text-[#222222]">{value}</span>
          </div>
        ),
      },
      { key: "role", header: "Peran", align: "left" },
      {
        key: "action",
        header: "Action",
        align: "right",
        className: "w-28 flex-shrink-0",
        render: (_, row) => (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-lg bg-yellow-400 text-white transition hover:bg-yellow-500 active:scale-95"
              aria-label="Edit akun"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M11.333 2.00004C11.5081 1.82494 11.716 1.68605 11.9447 1.59129C12.1735 1.49653 12.4187 1.44775 12.6663 1.44775C12.914 1.44775 13.1592 1.49653 13.3879 1.59129C13.6167 1.68605 13.8246 1.82494 13.9997 2.00004C14.1748 2.17513 14.3137 2.383 14.4084 2.61178C14.5032 2.84055 14.552 3.08575 14.552 3.33337C14.552 3.58099 14.5032 3.82619 14.4084 4.05497C14.3137 4.28374 14.1748 4.49161 13.9997 4.66671L5.33301 13.3334L1.99967 14L2.66634 10.6667L11.333 2.00004Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className="grid h-8 w-8 place-items-center rounded-lg bg-red-500 text-white transition hover:bg-red-600 active:scale-95"
              aria-label="Hapus akun"
              onClick={() => {
                setSelectedAccount(row);
                setIsDeleteModalOpen(true);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M2 4H14M12.6667 4V13.3333C12.6667 14 12 14.6667 11.3333 14.6667H4.66667C4 14.6667 3.33333 14 3.33333 13.3333V4M5.33333 4V2.66667C5.33333 2 6 1.33333 6.66667 1.33333H9.33333C10 1.33333 10.6667 2 10.6667 2.66667V4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const headerAction = (
    <div className="flex items-center gap-3">
      <div className="relative w-[240px]">
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Nama Pengguna"
          className="w-full pl-10 pr-4 py-2.5 border-2 border-[#0D63F3] rounded-lg focus:outline-none focus:ring-0 bg-white text-sm text-[#0D63F3] placeholder:text-[#0D63F3] font-medium"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0D63F3]"
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="2" />
          <path d="M12 12L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <button
        type="button"
        className="px-4 py-2 bg-[#0D63F3] text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
      >
        Filter
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#0D63F3] text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
      >
        Tambah Akun
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <PageLayout sidebarRole="supervisor">
      <section className="w-full max-w-[1076px] space-y-6">
        <PageHeader
          title="Manajemen Akun"
          description="Kelola dan tambah akun untuk Groundcrew dan Warehouse"
          action={headerAction}
        />

        <GlassDataTable
          columns={columns}
          data={accountList}
          emptyMessage="Belum ada akun terdaftar"
        />
      </section>

      {isMounted &&
        isDeleteModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#050022]/40 px-4 backdrop-blur-sm">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-account-title"
              className="w-full max-w-sm rounded-[32px] bg-white p-8 text-center shadow-xl"
            >
              <h2 id="delete-account-title" className="text-2xl font-semibold text-[#11264D]">
                Hapus Akun?
              </h2>
              {selectedAccount && (
                <p className="mt-3 text-sm text-[#5B5F6B]">
                  Akun <span className="font-semibold text-[#0D63F3]">{selectedAccount.username}</span> akan dihapus dari
                  sistem.
                </p>
              )}
              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  type="button"
                  className="w-32 rounded-full border border-[#FF3B30] px-6 py-2 text-sm font-semibold text-[#FF3B30] transition hover:bg-[#FF3B30]/10 active:scale-95"
                  onClick={handleConfirmDelete}
                >
                  Hapus
                </button>
                <button
                  type="button"
                  className="w-32 rounded-full bg-[#0D63F3] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#0B53CF] active:scale-95"
                  onClick={closeDeleteModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </PageLayout>
  );
}
