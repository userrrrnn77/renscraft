# Renscraft — Frontend (Client)

> Bagian dari dokumentasi Renscraft. Overview dan arsitektur ada di [README.md](./README.md). Kode ada di folder `client/`. Sisi server: [backend.md](./backend.md).

## Daftar Isi

1. [Tech Stack](#1-tech-stack)
2. [Setup, Env, dan Scripts](#2-setup-env-dan-scripts)
3. [Routing](#3-routing)
4. [Auth di Client](#4-auth-di-client)
5. [Brief Wizard di Client](#5-brief-wizard-di-client)
6. [Builder, Chat, dan Upload Gambar](#6-builder-chat-dan-upload-gambar)
7. [Subdomain di Client (Ringkasan)](#7-subdomain-di-client-ringkasan)
8. [i18n](#8-i18n)
9. [Storage Keys](#9-storage-keys)
10. [Pending Migrasi (Client)](#10-pending-migrasi-client)
11. [Known Issues dan TODO (Client)](#11-known-issues-dan-todo-client)
12. [Cheat Sheet (Client)](#12-cheat-sheet-client)

---

## 1. Tech Stack

| Layer | Tech |
|---|---|
| Framework | React 19 |
| Build tool | Vite 8 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`), dark mode via class `html.dark` |
| Routing | React Router v7 |
| HTTP | Axios (`withCredentials`, cookie session) |
| Live preview | Sandpack (`@codesandbox/sandpack-react`) |
| Auth OAuth | Supabase JS (identity provider, PKCE) |
| i18n | i18next + react-i18next + language detector (`en`, `id`) |
| UI | lucide-react, react-icons, react-hot-toast |
| Export | JSZip + file-saver |
| Util | moment, lodash.debounce |
| Lint | oxlint |
| Package manager | Bun |

---

## 2. Setup, Env, dan Scripts

### Setup

Prasyarat: Bun ≥ 1.x dan server API berjalan di `localhost:3000` (repo terpisah).

```bash
cd client
bun install
cp .env.example .env       # isi VITE_SUPABASE_* kalau mau OAuth
bun run dev                # http://localhost:5173
```

### Environment Variables (`client/.env`)

Semua `VITE_*` **publik** (ikut ter-bundle ke JS). Jangan pernah taruh secret di sini.

```dotenv
# Base URL API. Kosong = same-origin (memakai proxy dev / rewrite Vercel).
# Di production (Vercel) HARUS diisi ke domain API karena catch-all rewrite
# akan serve index.html untuk /api/* kalau kosong.
VITE_BASE_URL=https://api.renscraft.web.id

# Supabase — hanya untuk OAuth (Google/GitHub).
# Kosong → tombol OAuth otomatis disembunyikan.
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Scripts

| Script | Fungsi |
|---|---|
| `bun run dev` | Dev server (proxy `/api` → `localhost:3000`) |
| `bun run build` | Build produksi ke `dist/` |
| `bun run preview` | Preview hasil build |
| `bun run lint` | oxlint |

---

## 3. Routing

Didefinisikan di `client/src/App.jsx`.

| Grup | Path | Keterangan |
|---|---|---|
| **Guest** (`GuestLayout`) | `/login`, `/register` | User yang sudah login di-redirect ke `/chat` |
| **Protected** (`AuthLayout`) | `/chat` | Input prompt + brief wizard |
| | `/chat/:id` | Builder (chat, file, gambar, preview) |
| | `/my-projects` | Daftar project |
| | `/profile` | Profil, kredit, referral, redeem |
| | `/preview/:id` | Preview fullscreen project milik user |
| **Public** | `/` | Landing page, **atau `SubdomainPage` kalau hostname = subdomain** |
| | `/pricing` | Harga paket kredit |
| | `/publish/:name` | Website yang sudah dipublish (by name) |
| | `/webpub` | Galeri website published |
| | `/auth/callback` | Penukaran kode OAuth |
| **Legal** | `/terms`, `/privacy`, `/refund`, `/contact` | |
| **Admin** | `/admin/login`, `/admin` | Hanya UI. Semua otorisasi ditegakkan server |
| Catch-all | `*` | Redirect ke `/` |

**Khusus subdomain** (detail di [§7](#7-subdomain-di-client-ringkasan)):

- `App.jsx` mendeteksi `isDynamicSubdomain` di awal render.
- Kalau true, route `/` merender `<SubdomainPage />` alih-alih `<LandingPage />`.
- Route lain (`/login`, `/chat`, dll.) tetap tersedia di subdomain, tapi praktisnya tidak dipakai karena visitor hanya membuka homepage project.

`ScrollToTop` me-reset scroll tiap pindah halaman (kecuali URL punya hash).

---

## 4. Auth di Client

### Session

Sesi memakai **cookie HttpOnly yang di-set server**. Client **tidak pernah** membaca atau menyimpan token sesi.

- Interceptor axios di `api/api.js` menangkap `401` (kecuali path `/api/auth/*` dan `/api/admin/*`), mengosongkan state lokal, lalu `AuthLayout` me-redirect ke `/login`.
- `GuestLayout` me-redirect user yang sudah login ke `/chat`.
- Admin punya cookie dan UI terpisah (`/admin/login`). Client hanya menampilkan UI, otorisasi di server.

### Register dan Login

- **Register** dua langkah: form (`name`, `email`, `password`, `referralCode?`) → `POST /api/auth/register/request-otp` → input OTP → `POST /api/auth/register/verify-otp`. Kirim ulang OTP lewat `POST /api/auth/register/resend-otp`, dengan `resendAvailableAt` dari server sebagai patokan cooldown.
- **Login**: `POST /api/auth/login { email, password }`.
- `AuthPage.jsx` membaca query `?referral=` untuk mengisi kode referral.
- Kontrak endpoint dan perilaku server: [backend.md §3](./backend.md#3-auth).

### OAuth (Google/GitHub via Supabase)

Sisi client:

1. `OAuthButtons.jsx` menyimpan referral (kalau ada) ke `sessionStorage` (`renscraft:pendingReferral`), lalu memanggil `supabase.auth.signInWithOAuth({ provider })`.
2. Browser redirect ke provider. Supabase SDK menyimpan PKCE verifier di `localStorage`.
3. Kembali ke route client `/auth/callback?code=...` (`AuthCallbackPage.jsx`).
4. `supabase.auth.exchangeCodeForSession(code)` menghasilkan `access_token`.
5. Client mengirim `POST /api/auth/supabase/session { accessToken, referralCode? }` ke server (lanjutannya di [backend.md §3](./backend.md#3-auth)).
6. Setelah server membalas dan men-set cookie, client memanggil `supabase.auth.signOut({ scope: 'local' })` untuk membuang sesi Supabase lokal. Yang dipakai hanya cookie server.

Kalau `isSupabaseConfigured` (di `lib/supabase.js`) bernilai false, tombol OAuth tidak dirender.

### File kunci

`pages/AuthPage.jsx`, `pages/AuthCallbackPage.jsx`, `components/OAuthButtons.jsx`, `lib/supabase.js`, `api/api.js`

---

## 5. Brief Wizard di Client

Sebelum generate, user bisa mengisi wizard untuk memperkaya prompt. Pertanyaannya dirancang spesifik per bisnis oleh server ([backend.md §4](./backend.md#4-brief-classifier-dan-flow)). Client hanya menampilkan dan mengirim jawaban.

```
PromptInput ──► startBrief(prompt)
                 │  POST /api/briefs { prompt }
                 ▼
                 Poll GET /api/briefs/:id (tiap 1.5 dtk, deadline 180 dtk)
                 │
  status failed ─► toast, user submit ulang
  autoStart     ─► createFromPrompt(null, briefId)   ← langsung generate
  selain itu    ─► tampilkan BriefWizard
                      │  PATCH jawaban per slot (gratis)
                      ▼
                 "Generate Website" ─► POST /api/projects { briefId }
                                         │
                                         ▼
                                   navigate /chat/:id
```

- `briefId` disimpan di `sessionStorage` (`renscraft:briefId`) supaya wizard bisa dilanjutkan setelah refresh.
- Fallback `mode: direct` → generate langsung dengan prompt mentah.
- Menjawab pertanyaan wizard **gratis**. Hanya generate yang memotong kredit.
- Bentuk response `GET /api/briefs/:id` yang dikonsumsi client ada di [backend.md §4](./backend.md#4-brief-classifier-dan-flow).

**File kunci:** `components/BriefWizard.jsx`, `pages/HomePage.jsx`

---

## 6. Builder, Chat, dan Upload Gambar

### Builder (`/chat/:id`)

Setelah `POST /api/projects` berhasil, client navigate ke `/chat/:id` yang otomatis polling status project. Halaman ini berisi chat, file, gambar, dan preview live (Sandpack).

- `pages/BuilderPage.jsx` menyusun semua panel. `BuilderHeader` berisi tombol kredit dan tombol **Publish** (membuka `SubdomainModal`, lihat [§7](#7-subdomain-di-client-ringkasan)).
- `components/ChatPanel.jsx` dan `context/AppContext.jsx` (`handleChat`) mengirim revisi lewat `POST /api/projects/:id/chat { prompt }`. Logika revisi di server: [backend.md §6](./backend.md#6-revision-chat).
- Preview memakai Sandpack, helper di `utils/sandpackUtils.js`. `/preview/:id` menampilkan preview fullscreen untuk project milik user.
- Export ZIP memakai JSZip + file-saver.

### Error handling

- `409 PROJECT_BUSY` saat revisi masih berjalan.
- `402` (kredit kurang) memanggil `showInsufficientCreditsToast` di `AppContext` (terkait payment, lihat [§10](#10-pending-migrasi-client)).
- Error code baru dari server wajib punya key `errors.<code>` di kedua locale (lihat [§8](#8-i18n)).

### Upload gambar user

- `components/BuilderImageUploader.jsx`: drag atau klik, maksimal 5MB, hanya `image/*`.
- Upload ke `POST /api/projects/:id/images` (raw body, `maxBodyLength: 6MB`). Server menyimpan ke R2 dan AI melihatnya sebagai `ref-img-NN` ([backend.md §10](./backend.md#10-image-handling)).

**File kunci:** `components/ChatPanel.jsx`, `pages/BuilderPage.jsx`, `context/AppContext.jsx`, `components/BuilderImageUploader.jsx`, `utils/sandpackUtils.js`

---

## 7. Subdomain di Client (Ringkasan)

Detail lengkap, kode, dan alur: [wildcard-subdomain.md §4](./wildcard-subdomain.md#4-frontend).

| Bagian | Peran | File |
|---|---|---|
| Deteksi hostname | `isDynamicSubdomain` true kalau hostname berakhiran `renscraft.cyou` dan bukan base atau `www` | `App.jsx` |
| Render site published | `SubdomainPage` mengambil slug dari hostname, memanggil endpoint publik, render `FullPagePreview` (Sandpack) | `pages/SubdomainPage.jsx` |
| Claim dan perpanjang | `SubdomainModal` punya mode `claim` dan `manage`, biaya 100 kredit per 30 hari | `components/SubdomainModal.jsx` |
| Tombol Publish | `BuilderPage` membuka `SubdomainModal` lewat `handleOpenSubdomain` | `pages/BuilderPage.jsx` |

Catatan: tidak ada tombol **release** di UI (lihat W2 di [wildcard-subdomain.md §8](./wildcard-subdomain.md#8-known-issues)).

---

## 8. i18n

- Bahasa: `en` (fallback) dan `id`.
- Deteksi: `localStorage` (`renscraft:lang`) → `navigator`.
- File: `client/src/locales/en.json` dan `id.json`.
- `i18n.js` menyinkronkan `<html lang>` dan locale moment.
- Toggle bahasa: `LanguageToggle.jsx` (dipakai di `SiteNav`, `BuilderHeader`, `ProfilePage`).

**Aturan:**

1. Setiap string UI baru wajib ditambahkan ke **kedua** file locale.
2. Kalau server mengirim `code` error baru, tambahkan juga key `errors.<code>` di kedua locale (dibaca oleh `errorMessage()`).

---

## 9. Storage Keys

| Storage | Key | Isi |
|---|---|---|
| localStorage | `renscraft:theme` | `light` / `dark` |
| localStorage | `renscraft:lang` | Bahasa |
| localStorage | `renscraft:my-projects-view` | `grid` / `list` |
| sessionStorage | `renscraft:briefId` | ID brief aktif |
| sessionStorage | `renscraft:pendingReferral` | Kode referral selama redirect OAuth |
| sessionStorage | `renscraft:publicProjects`, `renscraft:publicProjectsPage`, `renscraft:webpubPage` | Cache galeri publik |
| Cookie (di-set server) | `token`, `admin_token` | Session, HttpOnly, tidak terbaca client |

---

## 10. Pending Migrasi (Client)

> Tidak didokumentasikan detail. Ini catatan untuk developer yang akan memigrasi.

### Payment

- `src/api/payments.js`, `src/api/manualPayment.js`
- `src/components/BuyCreditsHost.jsx`, `BuyCreditsModal.jsx`
- `src/components/ManualPaymentHost.jsx`, `ManualPaymentModal.jsx`
- `src/utils/billing.js`, `billingToast.jsx`, `manualBilling.js`, `orderPolling.js`, `snap.js`, `topup.js`

### Dynamic Apps

- `src/api/dynamicApps.js`
- `src/components/BuilderDataTab.jsx`
- `src/pages/DynamicAppPage.jsx`

### Entry point yang terdampak migrasi payment

| Lokasi | Ketergantungan |
|---|---|
| `App.jsx` | `<BuyCreditsHost />` dan `<ManualPaymentHost />` |
| `AppContext` | `showInsufficientCreditsToast` (dipanggil saat `402`) |
| `BuilderHeader`, `SiteNav`, `HomePage`, `ProfilePage` | tombol kredit / Top up → `openTopUp()` |
| `PricingPage` | `GET /api/payments/packages` |

**Perhatian:** `PricingPage` dan `App.jsx` bergantung pada `GET /api/payments/packages`. Kalau endpoint itu dihapus atau diubah, halaman harga dan tombol Top up ikut rusak. Migrasi harus menyediakan pengganti. Sisi server: [backend.md §17](./backend.md#17-pending-migrasi-server).

---

## 11. Known Issues dan TODO (Client)

- [ ] **`utils/slug.js` meng-import `node:crypto`** — akan gagal kalau ter-import di browser. Hapus atau pindahkan ke server.
- [ ] **`vite-plugin-prerender-spa`** ada di `devDependencies` dan di-import di `vite.config.js`, tapi tidak dipasang di `plugins`. Hapus atau aktifkan.
- [ ] **Halaman Privacy** menyebut daftar storage yang belum mencakup `renscraft:lang` dan cache galeri. Samakan dokumen legal dengan perilaku aktual (lihat [§9](#9-storage-keys)).
- [ ] **Hasil export** memakai React 18 + Tailwind 3 CDN, sedangkan app memakai React 19 + Tailwind 4. Verifikasi kompatibilitas atau samakan.
- [ ] **Port proxy dev** di `vite.config.js` mengarah ke `localhost:3000`. Pastikan sesuai port server lokal.
- [ ] **URL project Supabase di-hardcode** di `vercel.json` dan `vite.config.js`. Sebaiknya pindah ke env.
- [ ] **Host API di-hardcode** sebagai fallback di `hooks/useAdminNotifications.js`. Sebaiknya hanya `VITE_BASE_URL`.
- [ ] **Beberapa string UI di halaman admin dan `BuilderPage` masih hardcode** (belum i18n).
- [ ] **Migrasi pembayaran** — lihat [§10](#10-pending-migrasi-client).

Issue client untuk subdomain (W2, W3, W5) ada di [wildcard-subdomain.md §8](./wildcard-subdomain.md#8-known-issues).

---

## 12. Cheat Sheet (Client)

### Kalau mau ubah...

| Fitur | Edit file |
|---|---|
| Routing dan layout | `src/App.jsx` |
| Login, register, OTP | `pages/AuthPage.jsx` |
| OAuth | `components/OAuthButtons.jsx`, `pages/AuthCallbackPage.jsx`, `lib/supabase.js` |
| Brief wizard | `components/BriefWizard.jsx`, `pages/HomePage.jsx` |
| Halaman builder | `pages/BuilderPage.jsx`, `components/ChatPanel.jsx`, `context/AppContext.jsx` |
| Upload gambar | `components/BuilderImageUploader.jsx` |
| Preview Sandpack | `utils/sandpackUtils.js` |
| Teks UI | `src/locales/en.json` dan `id.json` (**keduanya**) |
| **Subdomain** | `App.jsx`, `pages/SubdomainPage.jsx`, `components/SubdomainModal.jsx`, `pages/BuilderPage.jsx` |


<div align="center">

> ### 📜 *The Sadboy Developer Manifesto*
>
> *aku pintar karena guru,*<br>
> *aku tertawa karena candu,*<br>
> *dan aku terluka karena kamu.*
>
> *kini bersamamu telah menjadi angan,*<br>
> *karena aku telah merasa kehilangan.*
>
> *tuhan memang adil,*<br>
> *karena dia telah mempersilahkan dirimu untuk hadir,*<br>
> *walaupun bukan menjadi takdir.*
>
> *katanya mati satu tumbuh seribu,*<br>
> *nyatanya seribu yang datang,*<br>
> *tidak bisa menggantikan satu yang hilang.*
>
> ---
>
> 💻 **Logic vs Hati** 💻
>
> *mending pusing di **VSCode**,*<br>
> *daripada pusing di **hati**,*<br>
> *karena di VSCode banyak **logic**,*<br>
> *sedangkan di hati banyak sekali **konflik**.*
>
> *tugas programmer cuma menangin **logic**,*<br>
> *bukan menangin **hati**.*
>
> 🍜 **Indomie vs Sedap** 🍜
>
> *mending indomie atau mie sedap?*<br>
> *ya mending **sadar diri** daripada **berharap**.*
>
> `adios.`

</div>