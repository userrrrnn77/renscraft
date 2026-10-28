# Renscraft Client

Frontend **Renscraft**, platform AI website builder. User menulis deskripsi website, AI menulis kode React-nya, user melihat preview langsung, merevisi lewat chat, lalu publish ke link publik atau export sebagai ZIP.

Repo ini **hanya berisi client** (SPA React). Server/API ada di repo terpisah dan tidak didokumentasikan di sini.

> ⚠️ **Repo ini publik.** Baca [Aturan Kontribusi & Keamanan](#9-aturan-kontribusi--keamanan) sebelum membuat commit atau PR.

---

## Daftar Isi

1. [Tech Stack](#1-tech-stack)
2. [Quick Start](#2-quick-start)
3. [Environment Variables](#3-environment-variables)
4. [Struktur Direktori](#4-struktur-direktori)
5. [Routing](#5-routing)
6. [Arsitektur & Alur Utama](#6-arsitektur--alur-utama)
7. [Penyimpanan Browser](#7-penyimpanan-browser)
8. [Deployment](#8-deployment)
9. [Aturan Kontribusi & Keamanan](#9-aturan-kontribusi--keamanan)
10. [Known Issues & TODO](#10-known-issues--todo)

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
| Auth OAuth | Supabase JS (hanya sebagai identity provider, PKCE) |
| i18n | i18next + react-i18next + language detector (`en`, `id`) |
| UI | lucide-react, react-icons, react-hot-toast |
| Export | JSZip + file-saver |
| Util | moment, lodash.debounce |
| Lint | oxlint |
| Package manager | Bun |

---

## 2. Quick Start

Prasyarat: [Bun](https://bun.sh) dan server API yang berjalan di `localhost:3000` (lihat `vite.config.js`).

```bash
bun install
cp .env.example .env     # lalu isi nilainya, lihat bagian 3
bun run dev              # http://localhost:5173
```

| Script | Fungsi |
|---|---|
| `bun run dev` | Dev server (port 5173, proxy `/api` → `localhost:3000`) |
| `bun run build` | Build produksi ke `dist/` |
| `bun run preview` | Preview hasil build |
| `bun run lint` | Jalankan oxlint |

---

## 3. Environment Variables

| Variable | Wajib | Keterangan |
|---|---|---|
| `VITE_BASE_URL` | Opsional | Base URL API. Kosong = same-origin (memakai proxy dev / rewrite). |
| `VITE_SUPABASE_URL` | Opsional | URL project Supabase. Jika kosong, tombol Google/GitHub otomatis disembunyikan. |
| `VITE_SUPABASE_ANON_KEY` | Opsional | Anon (public) key Supabase. |

> **Semua variabel `VITE_*` ikut ter-bundle ke JavaScript browser dan bisa dibaca siapa saja.** Jangan pernah menaruh secret di sini: tidak ada API key AI, service-role key, token admin, atau kredensial apa pun.

Buat `.env.example` berisi nama variabel dengan nilai kosong. File `.env` harus ada di `.gitignore` dan **tidak boleh** di-commit.

---

## 4. Struktur Direktori

```
client/
├── index.html                 # Meta SEO, JSON-LD, badge statis untuk bot
├── vite.config.js             # Plugin, dev server, proxy
├── vercel.json                # Rewrites SPA + header keamanan dasar
├── public/                    # favicon, og-image, robots, sitemap, sw.js
└── src/
    ├── main.jsx               # Entry: Router > ThemeProvider > AppContextProvider
    ├── App.jsx                # Definisi route
    ├── i18n.js                # Setup i18next + sinkron <html lang> & moment
    ├── index.css              # Tailwind + style global
    ├── api/                   # Wrapper tipis per resource (tanpa state/toast)
    │   ├── api.js             # Instance axios, interceptor 401, errorMessage()
    │   ├── briefs.js
    │   ├── redeem.js
    │   ├── referral.js
    │   ├── admin.js
    │   ├── payments.js        # (lihat catatan pembayaran)
    │   └── manualPayment.js   # (lihat catatan pembayaran)
    ├── context/
    │   ├── AppContext.jsx     # State global: auth, kredit, project, brief
    │   └── ThemeContext.jsx   # Light/dark
    ├── components/            # Komponen UI (builder, wizard, modal, dll)
    ├── pages/                 # Halaman per route
    │   └── admin/             # Halaman admin (otorisasi ada di server)
    ├── hooks/                 # useAdminNotifications
    ├── lib/supabase.js        # Client Supabase (null jika tidak dikonfigurasi)
    ├── locales/               # en.json, id.json
    └── utils/                 # sandpackUtils, exportProject, usePageMeta, dll
```

---

## 5. Routing

Didefinisikan di `src/App.jsx`.

| Grup | Path | Keterangan |
|---|---|---|
| **Guest** (`GuestLayout`) | `/login`, `/register` | User yang sudah login di-redirect ke `/chat` |
| **Protected** (`AuthLayout`) | `/chat` | Input prompt + brief wizard |
| | `/chat/:id` | Builder (chat, file, gambar, preview) |
| | `/my-projects` | Daftar project |
| | `/profile` | Profil, kredit, referral, redeem |
| | `/preview/:id` | Preview fullscreen project milik user |
| **Public** | `/` | Landing page |
| | `/pricing` | Harga paket kredit |
| | `/publish/:name` | Website yang sudah dipublish |
| | `/webpub` | Galeri website published |
| | `/auth/callback` | Penukaran kode OAuth |
| **Legal** | `/terms`, `/privacy`, `/refund`, `/contact` | |
| **Admin** | `/admin/login`, `/admin` | Hanya UI. Semua otorisasi ditegakkan server. |
| Catch-all | `*` | Redirect ke `/` |

`ScrollToTop` me-reset scroll tiap pindah halaman (kecuali URL punya hash).

---

## 6. Arsitektur & Alur Utama

### 6.1 State global (`AppContext`)

Satu context menyimpan: `user`, `credits`, `projects`, `activeProject`, `brief`, serta aksi (login, logout, generate, revisi, dsb).

- `credits` **sengaja dipisah** dari `user`. Saldo berubah setelah tiap generate/revisi/refund, sedangkan `user` adalah dependency banyak callback. Mengubah `user` akan memicu refetch dan restart polling.
- `useAppContext()` melempar error jika dipakai di luar provider.

### 6.2 Auth

Sesi memakai **cookie HttpOnly yang di-set server**. Client tidak pernah membaca atau menyimpan token sesi.

| Alur | Langkah |
|---|---|
| **Email + OTP** | `AuthPage` → `registerRequestOtp` → input kode → `registerVerifyOtp` → cookie ter-set → `/chat` |
| **Google / GitHub** | `OAuthButtons` → Supabase PKCE redirect → `/auth/callback` → `exchangeCodeForSession` → access token ditukar ke cookie sesi lewat endpoint server → sesi Supabase di-`signOut` lokal |
| **Sesi habis** | Interceptor axios menangkap 401 (kecuali path `/api/auth/*` dan `/api/admin/*`) → state lokal dikosongkan → `AuthLayout` redirect ke `/login` |

Kode referral dari URL (`?referral=`) divalidasi format-nya di client (`normalizeReferralCode`), lalu dikirim saat registrasi atau disimpan sementara untuk alur OAuth.

### 6.3 Brief wizard & generate

```
PromptInput ──► startBrief(prompt)
                 │  POST /api/briefs
                 │  poll GET /api/briefs/:id  (tiap 1.5 dtk, deadline 180 dtk)
                 ▼
   status "failed"  → toast, user submit ulang
   autoStart        → createFromPrompt(null, briefId)
   selain itu       → tampilkan BriefWizard
                         │ PATCH jawaban per slot (gratis)
                         ▼
                   "Generate Website" → POST /api/projects { briefId }
                                         │
                                         ▼
                                   navigate /chat/:id
```

- `briefId` disimpan di `sessionStorage` supaya wizard bisa dilanjutkan setelah refresh.
- Fallback `mode: "direct"` → generate langsung dengan prompt mentah.
- Menjawab pertanyaan wizard gratis, hanya generate yang memotong kredit.

### 6.4 Builder & polling

`BuilderPage` menampilkan chat/file/gambar di sisi kiri dan preview di kanan.

- Selama status project `pending | generating | revising`, `AppContext` **polling tiap 2,5 detik** (rekursif `setTimeout`, bukan `setInterval`, agar respons lambat tidak menumpuk). Polling berhenti saat 401/404 atau 5 kegagalan berturut-turut.
- Saat job selesai atau gagal, saldo kredit di-refresh otomatis (server melakukan refund jika gagal).
- Revisi (`POST /api/projects/:id/chat`) bisa memakan waktu lama. Jika koneksi putus tetapi project masih `revising`, client lanjut polling, bukan melaporkan gagal.
- Edit manual di editor Sandpack di-autosave dengan debounce 1 detik (`PUT /api/projects/:id/files`).

### 6.5 Preview (Sandpack)

Kode hasil AI **dijalankan di dalam iframe Sandpack**, bukan di origin aplikasi.

- `sandpackUtils.js` menyisipkan `index.html` dan `/index.js` kontrol (tersembunyi, tidak disimpan ke project), memuat Tailwind Play CDN dan Font Awesome sebagai resource eksternal.
- **Allowlist dependency** (`ALLOWED_PACKAGES`): hanya paket di daftar itu yang dipasang. Import paket lain tidak diinstal. Ini mencegah paket karangan AI atau typo-squat masuk ke preview maupun `package.json` hasil export.
- Komponen yang di-embed di iframe (kartu galeri) menerima sinyal `renscraft:preview-ready` via `postMessage`. Handler **memverifikasi `event.source`** sama dengan iframe yang dimaksud.

### 6.6 Kredit, redeem, referral

- Saldo ditampilkan dari `credits` di context. Penambahan/pengurangan selalu diputuskan server.
- `402 INSUFFICIENT_CREDITS` memunculkan toast dengan tombol Top up (`billingToast.jsx`).
- Redeem code: `POST /api/redeem` dari halaman profil. Referral: `GET /api/referral/me`.

### 6.7 Error handling

Server membalas `{ error, code, params? }`. `errorMessage(err, fallback)` mencari key `errors.<code>` di locale, lalu fallback ke `error`, lalu ke `fallback`. Error project yang tersimpan di DB memakai `projectErrors.<errorCode>` (`projectErrorMessage`).

Tambah kode error baru = tambahkan key di **kedua** locale.

### 6.8 i18n

- Bahasa: `en` (fallback) dan `id`. Deteksi: `localStorage` lalu `navigator`.
- Setiap string UI baru wajib ditambahkan ke `src/locales/en.json` **dan** `src/locales/id.json`.
- `i18n.js` menyinkronkan `<html lang>` dan locale moment.

### 6.9 Export project

`exportProjectZip` membuat ZIP project Vite + React berisi `package.json` (dependency dideteksi dari import, tetap lewat allowlist), `vite.config.js`, `index.html`, `src/index.jsx`, dan file project. Nama project di-escape sebelum masuk HTML.

### 6.10 Catatan pembayaran

Alur top-up (modal kredit, transfer manual, polling order, `topup.js`, `billing.js`, `snap.js`) berasal dari implementasi pembayaran sebelumnya dan **sedang dalam rencana migrasi**. File terkait:

`api/payments.js`, `api/manualPayment.js`, `components/BuyCredits*.jsx`, `components/ManualPayment*.jsx`, `utils/billing.js`, `utils/billingToast.jsx`, `utils/manualBilling.js`, `utils/orderPolling.js`, `utils/snap.js`, `utils/topup.js`.

Perhatikan: `PricingPage` dan `App.jsx` bergantung pada `GET /api/payments/packages` (biaya generate/revisi, jumlah kredit gratis, metode aktif). Jika endpoint itu dihapus, halaman harga dan tombol Top up ikut terdampak.

---

## 7. Penyimpanan Browser

Client tidak menyimpan token sesi di storage. Hanya preferensi dan state sementara.

| Storage | Key | Isi |
|---|---|---|
| localStorage | `renscraft:theme` | `light` / `dark` |
| localStorage | `renscraft:lang` | Bahasa pilihan |
| localStorage | `renscraft:my-projects-view` | `grid` / `list` |
| sessionStorage | `renscraft:briefId` | ID brief aktif (agar wizard bisa dilanjutkan) |
| sessionStorage | `renscraft:pendingReferral` | Kode referral sementara selama redirect OAuth |
| sessionStorage | `renscraft:publicProjects`, `renscraft:publicProjectsPage`, `renscraft:webpubPage` | Cache daftar website publik + nomor halaman |
| Cookie | (di-set server) | Sesi, HttpOnly, tidak bisa dibaca JavaScript |

Semua akses storage dibungkus `try/catch` (mode privat / storage diblokir tidak boleh membuat app crash).

---

## 8. Deployment

Target: **Vercel** (`vercel.json`).

- Install/build: `bun install` / `bun run build`, output `dist/`.
- Rewrites: `/auth/v1/*` diteruskan ke Supabase; sisanya fallback ke `/index.html` (SPA).
- Header: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`.
- Aset `/assets/*` di-cache immutable 1 tahun; `index.html` selalu revalidate.

Pastikan environment variable `VITE_*` di-set di dashboard Vercel, bukan di repo.

---

## 9. Aturan Kontribusi & Keamanan

### Wajib

- **Jangan commit secret.** Termasuk `.env`, API key, token, kredensial admin, dump data user, atau screenshot yang memuat itu.
- Semua nilai `VITE_*` dianggap **publik**. Hanya anon/public key yang boleh ada di sana.
- Jangan hardcode URL backend/host internal. Pakai `VITE_BASE_URL` atau path relatif.
- Jangan merender output AI atau konten hasil scraping dengan `dangerouslySetInnerHTML` di origin aplikasi. Kode hasil generate hanya boleh berjalan di dalam iframe Sandpack.
- Setiap `postMessage` handler wajib memverifikasi `event.source` / `event.origin`.
- Jangan simpan token, password, atau data pribadi di `localStorage`/`sessionStorage`.
- Jangan log token, cookie, atau body request sensitif ke console.
- Menambah dependency baru? Cek reputasi paketnya. Menambah paket ke `ALLOWED_PACKAGES` berarti paket itu boleh dipasang di preview dan export semua user, jadi perlakukan sebagai perubahan keamanan.
- Semua string UI lewat i18n (`en` + `id`).
- Jalankan `bun run lint` sebelum membuka PR.

### Yang tidak didokumentasikan di sini (sengaja)

Detail internal server (aturan anti-abuse, ambang rate limit, mekanisme admin, konfigurasi infrastruktur) tidak dijelaskan di repo publik ini.

### Melaporkan kerentanan

Jangan buka issue publik untuk celah keamanan. Kirim laporan privat ke **developer@rensdev.my.id** dengan langkah reproduksi. Mohon beri waktu wajar untuk perbaikan sebelum mengungkapkannya.

---

## 10. Known Issues & TODO

Catatan jujur untuk kontributor:

- [ ] **README lama usang.** Menyebut backend berjalan di laptop lewat Cloudflare Tunnel dan Midtrans "coming soon". Sudah tidak mencerminkan kondisi sekarang (dokumen ini menggantikannya).
- [ ] **Port proxy dev** di `vite.config.js` mengarah ke `localhost:3000`, pastikan sama dengan port server lokal Anda.
- [ ] **URL project Supabase di-hardcode** di `vercel.json` dan `vite.config.js`. Sebaiknya dipindah ke konfigurasi environment.
- [ ] **Host API di-hardcode** sebagai fallback di `hooks/useAdminNotifications.js`. Sebaiknya hanya memakai `VITE_BASE_URL`.
- [ ] **`utils/slug.js`** meng-import `node:crypto` (API Node) dan tidak dipakai di client. Hapus, atau pindahkan ke server, karena akan gagal jika ter-import di browser.
- [ ] **`vite-plugin-prerender-spa`** ada di devDependencies dan di-import di `vite.config.js`, tetapi tidak dipasang di `plugins`. Hapus atau aktifkan.
- [ ] **Halaman Privacy** menyebut daftar storage yang belum mencakup `renscraft:lang` dan cache galeri (lihat [bagian 7](#7-penyimpanan-browser)). Samakan dokumen legal dengan perilaku aktual.
- [ ] **Hasil export** memakai React 18 + Tailwind 3 CDN, sedangkan app memakai React 19 + Tailwind 4. Verifikasi kompatibilitas atau samakan.
- [ ] **Migrasi pembayaran**: lihat [6.10](#610-catatan-pembayaran).
- [ ] Beberapa string UI di halaman admin dan `BuilderPage` masih hardcode (belum i18n).

---

```yaml
# ----------------------------------------------------
# 💭 DEV_PHILOSOPHY.yml
# ----------------------------------------------------
status: "heartbroken_but_compiled"

poetry: |
  aku pintar karena guru,
  aku tertawa karena candu,
  dan aku terluka karena kamu.

  kini bersamamu telah menjadi angan,
  karena aku telah merasa kehilangan.

  tuhan memang adil, 
  karena dia mepersilahkan dirimu untuk hadir,
  walaupun bukan menjadi takdir.

  katanya mati satu tumbuh seribu,
  nyatanya seribu yang datang,
  tidak bisa menggantikan satu yang hilang.

logic_override:
  focus: "VSCode"
  reason: "karena di VSCode banyak logic, sedangkan di hati banyak sekali konflik."
  mission: "tugas programmer cuma menangin logic, bukan menangin hati."

conclusion:
  food_choice: "Indomie vs Mie Sedap"
  verdict: "mending sadar diri daripada berharap."
  exit_status: "adios."
```