# SkyBase

SkyBase adalah prototipe dashboard operasional untuk Groundcrew, Warehouse, dan Supervisor dengan gaya antarmuka glassmorphism. Proyek ini memanfaatkan Next.js App Router dan Turbopack sehingga iterasi pengembangan berjalan cepat.

## Ringkasan

- **Tujuan**: menyediakan single source of truth untuk monitoring stok dokumen, validasi barang, dan manajemen penerbangan lintas peran.
- **Teknologi utama**: Next.js 15 + React 19, TypeScript, Tailwind CSS 4, lucide-react, serta komponen kaca kustom.
- **Status saat ini**: data masih berupa dummy di dalam file komponen. Integrasi API atau basis data dapat ditambahkan tanpa mengubah struktur utama.

## Fitur Utama

- Navigasi berbasis peran melalui grup route `src/app/(dashboard)` (groundcrew, warehouse, supervisor).
- Tata letak reusable `PageLayout` dengan sidebar kaca dan top bar lengket.
- Komponen `GlassCard` dan `GlassDataTable` untuk tampilan tabel bercahaya dengan dukungan render sel kustom.
- Halaman interaktif dengan form, dialog modal (memakai `createPortal`), dan penyimpanan role aktif di `sessionStorage`.
- Landing page login (`src/app/page.tsx`) yang mengarahkan pengguna menuju dashboard groundcrew.

## Stack Teknologi

| Area      | Detail                                                      |
| --------- | ----------------------------------------------------------- |
| Framework | Next.js 15 (App Router, Turbopack)                          |
| Bahasa    | TypeScript dengan strict mode                               |
| UI        | Tailwind CSS 4 (via `@tailwindcss/postcss`) + styling kaca  |
| Ikon      | lucide-react                                                |
| Linting   | ESLint flat config (`next/core-web-vitals`)                 |
| Font      | Geist family (`next/font`)                                  |

## Prasyarat

- Node.js >= 18.18 (disarankan Node 20 LTS).
- npm 10+ atau alternatif seperti pnpm, bun, maupun yarn.

## Instalasi dan Pengembangan

1. Install dependency:
   ```bash
   npm install
   # atau pnpm install / bun install / yarn install
   ```
2. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```
3. Buka [http://localhost:3000](http://localhost:3000) di browser untuk melihat aplikasi.

### Skrip NPM

- `npm run dev` - menjalankan Next.js dengan Turbopack.
- `npm run build` - membuat bundel produksi.
- `npm run start` - menjalankan server produksi dari hasil build.
- `npm run lint` - memeriksa kualitas kode dan potensi bug.

## Struktur Proyek

```
src/
|- app/
|  |- (dashboard)/
|  |  |- groundcrew/
|  |  |  |- dashboard/
|  |  |  |- stok-barang/
|  |  |  |- validasi-barang/
|  |  |  \- profile/page.tsx  -> ekspor ProfilePage
|  |  |- warehouse/...        -> request, inventaris, dll.
|  |  \- supervisor/...       -> manajemen-akun, penerbangan, dll.
|  |- layout.tsx              -> root layout, font Geist.
|  \- page.tsx                -> halaman login.
\- component/
   |- PageLayout.tsx          -> layout utama plus sidebar/topbar.
   |- Sidebar.tsx             -> item navigasi per peran.
   |- Topbar.tsx              -> profil pengguna dan tombol notifikasi.
   |- Glasscard.tsx           -> wrapper kaca reusable.
   |- GlassDataTable.tsx      -> tabel kaca dengan render sel kustom.
   |- ProfilePage.tsx         -> halaman profil multi-peran.
   \- ButtonBlue.tsx          -> tombol utilitas di halaman login.
```

Alias `@/*` (lihat `tsconfig.json`) memudahkan impor komponen tanpa path relatif yang dalam.

## Komponen Inti

- **PageLayout** (`src/component/PageLayout.tsx`)  
  Menggabungkan sidebar, top bar, dan konten utama. Properti `sidebarRole` menentukan set menu aktif dan disimpan di `sessionStorage` untuk dipakai kembali.

- **Sidebar** (`src/component/Sidebar.tsx`)  
  Membuat daftar navigasi berdasarkan role (`groundcrew`, `warehouse`, `supervisor`) serta menyorot rute aktif menggunakan `usePathname`.

- **Topbar** (`src/component/Topbar.tsx`)  
  Menampilkan informasi pengguna, tombol notifikasi, dan memastikan role tetap konsisten ketika pengguna membuka halaman profil.

- **GlassCard & GlassDataTable**  
  Menyediakan efek glassmorphism lengkap dengan SVG filter, backdrop blur, dan varian `flat` bila efek kaca tidak diperlukan.

- **Halaman stok barang dan penerbangan**  
  Menunjukkan pola dialog modal berbasis `createPortal`, pencarian, dan kontrol form detail menggunakan React hook.

## Data Dummy dan Integrasi

- Saat ini data tabel diambil dari konstanta pada masing-masing file (misalnya `flightSchedules` di `groundcrew/validasi-barang/page.tsx`).
- Untuk menghubungkan dengan API, ganti konstanta tersebut dengan fetcher (server action atau client fetch) lalu kelola state sesuai kebutuhan.
- Pertimbangkan membuat utilitas data (contoh `src/lib/api.ts`) agar logika akses data terpusat.

## Styling dan Aksesibilitas

- Tailwind 4 diaktifkan lewat `globals.css` dan `@theme inline`. Ubah variabel CSS `--background` dan `--foreground` untuk menyesuaikan tema.
- Komponen interaktif menggunakan atribut `aria-*` dan `aria-label` guna menjaga aksesibilitas dasar.
- Untuk performa pada perangkat menengah, pertimbangkan memakai varian `flat` di `GlassDataTable` bila efek blur berat.

## Linting

Jalankan `npm run lint` sebelum commit untuk memastikan standar Next.js terpenuhi. ESLint mengabaikan folder build (`.next`, `out`) melalui konfigurasi flat.

## Rencana Pengembangan Lanjutan

- Hubungkan data ke API atau basis data nyata dan tambahkan state global jika diperlukan.
- Sempurnakan halaman dashboard lain yang masih memakai placeholder.
- Tambahkan pengujian (misalnya Playwright atau Jest/Testing Library) untuk menjaga perilaku komponen dinamis.
