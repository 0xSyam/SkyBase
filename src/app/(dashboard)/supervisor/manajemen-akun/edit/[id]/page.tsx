"use client";

import React from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/component/PageLayout";
import GlassCard from "@/component/Glasscard";
import { ArrowLeft } from "lucide-react";

export default function EditUserPage({ params }: { params: { id: string } }) {
    const router = useRouter();

    return (
        <PageLayout sidebarRole="supervisor">
            <section className="w-full max-w-[1076px] space-y-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-full hover:bg-gray-100 transition"
                    >
                        <ArrowLeft className="w-6 h-6 text-[#111827]" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-semibold text-[#111827]">Edit Akun</h1>
                        <p className="text-sm text-[#6B7280]">ID: {params.id}</p>
                    </div>
                </div>

                <GlassCard className="p-8 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-2xl">🚧</span>
                        </div>
                        <h2 className="text-xl font-semibold text-[#111827]">Fitur Belum Tersedia</h2>
                        <p className="text-[#6B7280] max-w-md">
                            Maaf, fitur edit akun belum tersedia saat ini karena keterbatasan API.
                            Silahkan hapus dan buat akun baru jika perlu mengubah data.
                        </p>
                        <button
                            onClick={() => router.push("/supervisor/manajemen-akun")}
                            className="mt-4 px-6 py-2 bg-[#0D63F3] text-white rounded-full font-medium hover:bg-blue-700 transition"
                        >
                            Kembali ke Daftar Akun
                        </button>
                    </div>
                </GlassCard>
            </section>
        </PageLayout>
    );
}
