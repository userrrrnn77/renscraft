# Renscraft — Wildcard Subdomain (Deep Dive)

> Fitur lintas-layer: menyentuh **infra**, **backend**, dan **frontend**. Overview ada di [README.md](./README.md). Detail layer lain: [frontend.md](./frontend.md) dan [backend.md](./backend.md).

## Daftar Isi

1. [Ringkasan](#1-ringkasan)
2. [Infra](#2-infra)
3. [Backend](#3-backend)
4. [Frontend](#4-frontend)
5. [Alur Lengkap](#5-alur-lengkap)
6. [Edge Cases](#6-edge-cases)
7. [Catatan Keamanan](#7-catatan-keamanan)
8. [Known Issues](#8-known-issues)
9. [Referensi Cepat](#9-referensi-cepat)

---

## 1. Ringkasan

Fitur premium: user bisa klaim **`namapilihan.renscraft.cyou`** untuk project yang sudah selesai. **30 hari per klaim, biaya 100 kredit, bisa diperpanjang.**

| Layer | Peran |
|---|---|
| **Infra** | DNS wildcard + domain wildcard di Vercel |
| **Backend** | 4 endpoint (`claim`, `renew`, `release`, `public-by-subdomain`) dan field `customSubdomain` (unique, sparse) di model `Project` |
| **Frontend** | `App.jsx` mendeteksi hostname; kalau bukan base domain, render `SubdomainPage` |

---

## 2. Infra

Bagian ini tidak ada di kode. Harus disiapkan manual kalau deploy sendiri.

### DNS

```
renscraft.cyou              A/CNAME  → Vercel
*.renscraft.cyou            CNAME    → cname.vercel-dns.com
```

### Vercel project

- Tambah domain `renscraft.cyou` (base)
- Tambah wildcard domain `*.renscraft.cyou`
- Vercel otomatis provision wildcard SSL

### Server (`ORIGINS`)

```dotenv
ORIGINS=https://renscraft.web.id,https://*.renscraft.cyou,http://localhost:5173
```

Wildcard di `ORIGINS` cocok **hanya 1 level** subdomain. Detail: [backend.md §14](./backend.md#14-cors-dan-wildcard-origin).

### Client (`.env` production)

```dotenv
VITE_BASE_URL=https://api.renscraft.web.id
```

**Wajib diisi.** Tanpa ini, catch-all rewrite di `vercel.json` (`/((?!assets/).*)` → `/index.html`) akan serve `index.html` untuk request `/api/*`. API call dari subdomain jadi dilayani halaman SPA, bukan error yang jelas.

---

## 3. Backend

Kode ada di `server/src/`.

### 3.1 Model (`models/Project.js`)

```js
const ProjectSchema = new Schema({
  // ... field lain
  customSubdomain: {
    type: String,
    unique: true,
    sparse: true,       // null/undefined boleh banyak
    trim: true,
    lowercase: true,
  },
  subdomainExpiresAt: {
    type: Date,
    default: null,
  },
});
```

- `unique + sparse`: hanya **satu project** yang boleh punya `customSubdomain: 'john'` pada satu waktu, terlepas dari expired atau tidak.
- `lowercase: true`: `JOHN` dan `john` dianggap sama.

### 3.2 Konstanta (`controllers/projectController.js`)

```js
const SUBDOMAIN_COST = 100; // 100 kredit / 30 hari
const RESERVED_SLUGS = new Set([
  'www', 'api', 'admin', 'app', 'dashboard', 'mail',
  'ftp', 'static', 'assets', 'cdn', 'docs',
]);
const SUBDOMAIN_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
```

`SUBDOMAIN_REGEX` **tidak** mengizinkan leading atau trailing hyphen, dan tidak boleh `foo--bar`. Client memakai regex yang lebih longgar (lihat W3).

### 3.3 `claimSubdomain` — `POST /api/projects/:id/claim-subdomain`

```js
// 1. Validasi slug
if (!SUBDOMAIN_REGEX.test(rawSlug) || rawSlug.length < 3 || rawSlug.length > 30) {
  return fail(res, 400, 'INVALID_SUBDOMAIN', {}, 'Slug harus 3-30 karakter...');
}

// 2. Reserved
if (RESERVED_SLUGS.has(rawSlug)) {
  return fail(res, 400, 'SUBDOMAIN_RESERVED', {}, 'Slug ini tidak boleh dipakai.');
}

// 3. Cek apakah ada project AKTIF yang sudah pakai
const existing = await Project.findOne({
  customSubdomain: rawSlug,
  subdomainExpiresAt: { $gt: new Date() },  // hanya blokir yang AKTIF
}).lean();
if (existing) {
  return fail(res, 409, 'SUBDOMAIN_TAKEN', {}, 'Subdomain ini sudah dipakai orang lain.');
}

// 4. Project harus completed
if (project.status !== 'completed') {
  return fail(res, 400, 'PROJECT_NOT_COMPLETED', {}, 'Website harus selesai di-generate.');
}

// 5. Charge credits atomik
const charge = await chargeCredits(owner, SUBDOMAIN_COST);
if (!charge.ok) return rejectCharge(res, charge);

// 6. Set field
const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + 30);
const updated = await Project.findByIdAndUpdate(id, {
  $set: {
    customSubdomain: rawSlug,
    subdomainExpiresAt: expiresAt,
    published: true,           // publish nama-based juga
  },
}, { returnDocument: 'after' });

// 7. Response
res.json({
  success: true,
  message: 'Subdomain berhasil diklaim untuk 30 hari!',
  url: `https://${rawSlug}.renscraft.cyou`,
  expiresAt,
  credits: await getBalance(owner),
  project: serializeProject(updated),
});
```

**Catch block** di sekitar step 6:

- Kalau `err.code === 11000`: refund, lalu `409 SUBDOMAIN_TAKEN` ("Subdomain baru saja dipakai orang lain.").
- **Bug:** unique index berlaku untuk **semua** project dengan `customSubdomain = rawSlug`, termasuk yang sudah expired tapi belum di-release. Jadi error `11000` juga bisa terjadi untuk subdomain expired. Lihat W1.

### 3.4 `renewSubdomain` — `POST /api/projects/:id/renew-subdomain`

- Project harus sudah punya `customSubdomain`.
- Charge 100 kredit.
- Extend 30 hari dari `max(subdomainExpiresAt, now)`.
- Response: `{ url, expiresAt, credits, project }`.
- Refund kalau update gagal.

### 3.5 `releaseSubdomain` — `DELETE /api/projects/:id/subdomain`

```js
const project = await Project.findOneAndUpdate(
  { _id: id, owner, customSubdomain: { $exists: true, $ne: null } },
  {
    $set: { published: false },
    $unset: { customSubdomain: 1, subdomainExpiresAt: 1 },
  },
  { returnDocument: 'after' },
);
if (!project) {
  return fail(res, 404, 'PROJECT_NOT_FOUND', {}, 'Project tidak ditemukan atau tidak punya subdomain.');
}
```

**Tidak ada refund** untuk release. **Tidak ada tombol release di UI** (lihat W2).

### 3.6 `getPublicProjectBySubdomain` — `GET /api/projects/public/subdomain/:slug`

```js
const slug = String(req.params.slug || '').trim().toLowerCase();
if (!slug || slug.length > 30) {
  return notFound(res, 'PROJECT_PUBLIC_NOT_AVAILABLE', {}, 'Website tidak tersedia.');
}

const project = await Project.findOne({ customSubdomain: slug }).lean();

// Reject kalau: tidak ada, tidak published, atau sudah expired
if (!project || !project.published || !isSubdomainActive(project)) {
  return notFound(
    res,
    'PROJECT_PUBLIC_NOT_AVAILABLE',
    {},
    'Website tidak ditemukan, belum dipublish, atau langganan subdomain sudah habis.',
  );
}

res.json({
  _id: project._id,
  name: project.name,
  files: filesToObject(project.files),  // {path: {content, hash}} → {path: content}
  version: project.version,
});
```

`isSubdomainActive(project)`:

```js
project.customSubdomain &&
project.subdomainExpiresAt &&
project.subdomainExpiresAt > new Date()
```

### 3.7 Routes (`routes/projectRoutes.js`)

| Method | Path | Auth | Handler |
|---|---|---|---|
| `GET` | `/api/projects/public/subdomain/:slug` | ❌ | `getPublicProjectBySubdomain` |
| `POST` | `/api/projects/:id/claim-subdomain` | ✅ | `claimSubdomain` |
| `POST` | `/api/projects/:id/renew-subdomain` | ✅ | `renewSubdomain` |
| `DELETE` | `/api/projects/:id/subdomain` | ✅ | `releaseSubdomain` |

Route publik diletakkan **sebelum** `projectRouter.use(authMiddleware)` supaya tidak butuh login.

### 3.8 CORS

Request dari `https://john.renscraft.cyou` ke API harus lolos `isOriginAllowed`. Cara kerja dan karakteristik pattern wildcard ada di [backend.md §14](./backend.md#14-cors-dan-wildcard-origin).

---

## 4. Frontend

Kode ada di `client/src/`.

### 4.1 Deteksi subdomain (`App.jsx`)

```js
const hostname = window.location.hostname;
const isDynamicSubdomain =
  hostname.endsWith('renscraft.cyou') &&
  hostname !== 'renscraft.cyou' &&
  hostname !== 'www.renscraft.cyou';

// ...

<Route
  path="/"
  element={isDynamicSubdomain ? <SubdomainPage /> : <LandingPage />}
/>
```

| Hostname | Hasil |
|---|---|
| `renscraft.cyou` (base) | bukan subdomain → `LandingPage` |
| `www.renscraft.cyou` | bukan subdomain → `LandingPage` |
| `john.renscraft.cyou` | subdomain → `SubdomainPage` |

Catatan: `endsWith('renscraft.cyou')` juga match `notrenscraft.cyou`. Lihat W5.

### 4.2 `SubdomainPage` (`pages/SubdomainPage.jsx`)

```js
useEffect(() => {
  const hostname = window.location.hostname;
  const slug = hostname.replace('.renscraft.cyou', '');

  api.get(`/api/projects/public/subdomain/${slug}`)
    .then(({ data }) => setProject(data))
    .catch((err) => {
      const msg = err?.response?.data?.error
        || 'Website tidak ditemukan, belum dipublish, atau langganan subdomain sudah habis.';
      setError(msg);
    })
    .finally(() => setLoading(false));
}, []);
```

- Slug diambil dengan `hostname.replace('.renscraft.cyou', '')`, jadi `john.renscraft.cyou` → `john`.
- Endpoint ini publik, dan `VITE_BASE_URL` harus menunjuk ke API (`api.renscraft.web.id`). Kalau same-origin, Vercel catch-all akan serve `index.html`.
- Error: UI error (icon merah, judul "Website Tidak Tersedia", tombol balik ke `/`).
- Sukses: `<FullPagePreview files={project.files} />` (Sandpack).

### 4.3 `SubdomainModal` (`components/SubdomainModal.jsx`)

Modal untuk claim dan renew. Dipanggil dari `BuilderPage` lewat tombol **Publish** di `BuilderHeader`.

```js
const SUBDOMAIN_COST = 100;
```

| Mode | Trigger | UI |
|---|---|---|
| `claim` | `project.customSubdomain` kosong, atau `subdomainExpiresAt` ≤ sekarang | Input slug + preview `.renscraft.cyou` + harga 100 kredit |
| `manage` | `customSubdomain` ada dan `subdomainExpiresAt > now` | URL aktif + tombol copy + tombol "Perpanjang 30 Hari" |

**Validasi client:** `/^[a-z0-9-]{3,30}$/` (lebih longgar dari server, lihat W3).

**Handle claim:**

```js
const { data } = await api.post(
  `/api/projects/${project._id}/claim-subdomain`,
  { slug: trimmed },
);
toast.success(data.message || 'Subdomain berhasil diklaim!');
await refreshCredits();
setSuccessUrl(data.url);
setExpiresAt(data.expiresAt);
setMode('manage');
onSuccess?.();  // → loadProject(id, true) di parent
```

**Handle renew:**

```js
const { data } = await api.post(`/api/projects/${project._id}/renew-subdomain`);
toast.success(data.message || 'Subdomain diperpanjang!');
await refreshCredits();
setExpiresAt(data.expiresAt);
onSuccess?.();
```

**Tidak ada tombol release** di UI. `DELETE /:id/subdomain` hanya bisa dipanggil via API manual.

### 4.4 Integrasi di Builder (`pages/BuilderPage.jsx`)

```js
const [showSubdomainModal, setShowSubdomainModal] = useState(false);

// Dulu: onPublish={handlePublish} → POST /:id/publish (nama-based)
// Sekarang: onPublish={handleOpenSubdomain} → buka SubdomainModal
const handleOpenSubdomain = () => {
  if (!id) return;
  setShowSubdomainModal(true);
};

<BuilderHeader
  onPublish={handleOpenSubdomain}
  publishing={false}
  // ...
/>

{showSubdomainModal && (
  <SubdomainModal
    project={activeProject}
    onClose={() => setShowSubdomainModal(false)}
    onSuccess={() => loadProject(id, true)}
  />
)}
```

Endpoint lama `POST /:id/publish` (publish by name, dipakai di `/publish/:name`) **masih ada** di server. Hanya tidak lagi dipanggil dari tombol Publish di builder. Dipakai untuk project lama yang sudah publish by name.

---

## 5. Alur Lengkap

### User klaim subdomain

```
┌─── User klaim subdomain ────────────────────────────────────────────┐
│                                                                     │
│  [FE] BuilderPage → tombol Publish → SubdomainModal (mode claim)    │
│       │                                                             │
│       ├─ user isi slug: warkop-andre                                │
│       ├─ submit → POST /:id/claim-subdomain                         │
│       │                                                             │
│       ▼                                                             │
│  [BE] Server:                                                       │
│    ├─ validate slug + reserved + unique(active)                     │
│    ├─ require project.status === completed                          │
│    ├─ chargeCredits(owner, 100)                                     │
│    ├─ Project.findByIdAndUpdate → $set {customSubdomain,            │
│    │                                    subdomainExpiresAt: +30d,   │
│    │                                    published: true}            │
│    └─ response {url, expiresAt, credits}                            │
│       │                                                             │
│       ▼                                                             │
│  [FE] refreshCredits, mode=manage, tampil URL                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Visitor membuka subdomain

```
┌─── Visitor buka subdomain ──────────────────────────────────────────┐
│                                                                     │
│  Browser: GET https://warkop-andre.renscraft.cyou                   │
│       │                                                             │
│       ▼                                                             │
│  [Infra] Vercel (SPA): serve index.html                             │
│       │                                                             │
│       ▼                                                             │
│  [FE] App.jsx: hostname.endsWith('renscraft.cyou') → true           │
│       → isDynamicSubdomain = true                                   │
│       → route / → <SubdomainPage />                                 │
│       │                                                             │
│       ├─ slug = hostname.replace('.renscraft.cyou', '')             │
│       ├─ GET api.renscraft.web.id/api/projects/public/subdomain/    │
│       │       warkop-andre                                          │
│       ▼                                                             │
│  [BE] Server:                                                       │
│    ├─ Project.findOne({customSubdomain: warkop-andre})              │
│    ├─ cek published === true                                        │
│    ├─ cek isSubdomainActive (belum expired)                         │
│    └─ response {name, files, version}                               │
│       │                                                             │
│       ▼                                                             │
│  [FE] FullPagePreview (Sandpack) → render website                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Edge Cases

| Kasus | Perilaku |
|---|---|
| Slug < 3 atau > 30 karakter | 400 `INVALID_SUBDOMAIN` |
| Slug di reserved list | 400 `SUBDOMAIN_RESERVED` |
| Project belum `completed` | 400 `PROJECT_NOT_COMPLETED` |
| Kredit kurang | 402 `INSUFFICIENT_CREDITS` |
| Subdomain aktif dipakai orang lain | 409 `SUBDOMAIN_TAKEN` |
| Race condition dua user klaim bareng | Unique index: satu kalah dengan `11000` → refund + 409 |
| Subdomain expired tapi belum di-release | **Claim lolos cek, lalu gagal di update `11000`** (lihat W1) |
| Subdomain expired, visitor buka | 404 `PROJECT_PUBLIC_NOT_AVAILABLE` |
| Project di-unpublish (manual) | 404 `PROJECT_PUBLIC_NOT_AVAILABLE` walau subdomain aktif |
| Renew saat masih aktif | Extend dari `subdomainExpiresAt` (bukan dari now) |
| Renew saat expired | Extend dari `now` |
| Release | Set `published: false`, unset field. **Tidak refund.** |
| Klaim ulang setelah release | Berhasil (field sudah kosong) |

---

## 7. Catatan Keamanan

- **Race condition unique index:** tidak mungkin dua project punya slug sama.
- **Expired check di GET:** subdomain yang sudah habis tetap 404.
- **Reserved list:** mencegah `api.renscraft.cyou` (kalau tidak, user bisa klaim `api` dan menabrak infrastruktur).
- **`VITE_BASE_URL` wajib:** kalau tidak, request API dari subdomain dilayani SPA. Bukan celah keamanan, tapi bug yang membingungkan.
- **CORS wildcard hanya 1 level:** mencegah `evil.renscraft.cyou.attacker.com` (tidak akan sampai karena DNS bukan milik kita, tapi tetap defense in depth).
- **Subdomain release tidak otomatis:** project yang ditinggal akan **permanen** memblokir slug yang sama. Ini bug, bukan fitur (lihat W1).

---

## 8. Known Issues

| # | Layer | Masalah | Dampak dan solusi |
|---|---|---|---|
| **W1** | Server | **Expired subdomain permanen memblokir slug** | Project yang ditinggal (expired, tidak di-renew, owner hilang) selamanya punya `customSubdomain = foo` di doc-nya, sehingga unique index mencegah project lain klaim `foo`. `claimSubdomain` hanya mengecek `subdomainExpiresAt > now`, jadi kelihatan boleh, tapi `findByIdAndUpdate` akan throw `11000`, lalu refund + 409. Padahal itu subdomain expired, bukan "aktif dipakai orang lain". **Solusi:** cron job untuk `$unset` subdomain yang expired lebih dari X hari, atau ubah claim supaya menangani "existing expired → release old + assign new" (dalam transaction atau dua update berurutan dengan hati-hati). |
| **W2** | Client (`SubdomainModal`) | **Tidak ada tombol release di UI** | `DELETE /:id/subdomain` ada di API tapi tidak ada tombolnya. Kalau subdomain expired dan user mau melepas, tidak bisa dari UI. Berhubungan dengan W1. |
| **W3** | Client (`SubdomainModal`) | **Validasi slug client ≠ server** | Client: `/^[a-z0-9-]{3,30}$/` (mengizinkan `foo--bar`, `-foo`, `foo-`). Server: `/^[a-z0-9]+(-[a-z0-9]+)*$/` (menolak ketiganya). Client membiarkan submit, server menolak dengan `INVALID_SUBDOMAIN`. Membingungkan user. |
| **W4** | Server | **Subdomain expired, visitor 404** | Sesuai ekspektasi. Tidak ada info ke visitor bahwa subdomain ini pernah ada tapi expired. Tidak wajib diperbaiki. |
| **W5** | Client (`App.jsx`) | **`isDynamicSubdomain` juga match `notrenscraft.cyou`** | `hostname.endsWith('renscraft.cyou')` juga true untuk `notrenscraft.cyou`. Bukan celah keamanan hari ini (bukan domain kita), tapi lebih baik `endsWith('.renscraft.cyou')` (dengan titik). |
| **W6** | Server | **Claim saat project sudah punya subdomain** | Tidak ada cek `project.customSubdomain` yang mencegah overwrite. Kalau user yang sudah punya subdomain aktif klaim slug baru (tidak bisa dari UI, tapi API tidak memvalidasi), slug lama ter-overwrite dan kredit terbuang. |
| **W7** | Infra | **DNS wildcard dan Vercel wildcard tidak ada di kode** | Developer baru harus tahu setup ini manual. Sudah didokumentasikan di [§2](#2-infra). |

---

## 9. Referensi Cepat

### Endpoint

| Method | Path | Auth |
|---|---|---|
| GET | `/api/projects/public/subdomain/:slug` | ❌ |
| POST | `/api/projects/:id/claim-subdomain` | ✅ |
| POST | `/api/projects/:id/renew-subdomain` | ✅ |
| DELETE | `/api/projects/:id/subdomain` | ✅ |

### Env minimal

```dotenv
# Client
VITE_BASE_URL=https://api.renscraft.web.id

# Server
ORIGINS=https://renscraft.web.id,https://*.renscraft.cyou,http://localhost:5173
COOKIE_DOMAIN=.renscraft.web.id
```

### File yang perlu diedit

| Layer | File |
|---|---|
| **Client** | `client/src/App.jsx`, `pages/SubdomainPage.jsx`, `components/SubdomainModal.jsx`, `pages/BuilderPage.jsx` |
| **Server** | `controllers/projectController.js` (`claimSubdomain`, `renewSubdomain`, `releaseSubdomain`, `getPublicProjectBySubdomain`), `models/Project.js` (`customSubdomain`, `subdomainExpiresAt`), `routes/projectRoutes.js` |
| **CORS** | `server/src/config/env.js` (`isOriginAllowed`), `ORIGINS` di `.env` |
| **Infra** | DNS `*.renscraft.cyou`, Vercel domain wildcard, `VITE_BASE_URL` di client |