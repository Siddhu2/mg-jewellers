# CLAUDE.md — MG Jewellers Project

This file gives Claude full context to resume work on this project in any future session.

---

## What This Project Is

A complete jewellery catalogue website for **MG Jewellers** with:
- A public-facing website where anyone can browse jewellery
- An admin panel where the shop owner uploads and manages items
- No backend server — purely static HTML/CSS/JS + Supabase as the backend

**Live URL:** https://mkjewellers.netlify.app

---

## Tech Stack

| Layer    | Tool                        |
|----------|-----------------------------|
| Frontend | Static HTML / CSS / JS only — no frameworks, no build tools |
| Database | Supabase (PostgreSQL)       |
| Storage  | Supabase Storage (bucket: `jewellery-images`) |
| Auth     | Supabase Auth (email + password) |
| Hosting  | Netlify (drag & drop deploy) |

**Important:** The Supabase JS client is initialized in `js/config.js` as `supabaseClient` (not `supabase`) because the CDN script already claims `window.supabase` as a global — using `const supabase` would cause a redeclaration error.

---

## File Structure

```
jewelleryShop/
├── index.html               ← Homepage (hero, featured items, categories)
├── category.html            ← Category listing (?cat=rings etc.)
├── item.html                ← Item detail page (?id=uuid)
├── favicon.svg              ← Browser tab icon
├── admin/
│   ├── index.html           ← Admin login page
│   ├── dashboard.html       ← View/search/delete all items
│   └── upload.html          ← Add new item or edit existing (?edit=uuid)
├── css/
│   └── style.css            ← All styles — luxury gold theme
├── js/
│   ├── config.js            ← Supabase credentials + CATEGORIES array + client init
│   ├── main.js              ← Homepage: featured items, category grid
│   ├── category.js          ← Category page: filter, sort, pagination
│   ├── item.js              ← Item detail: gallery, lightbox, related items
│   ├── admin.js             ← Shared admin: auth guard IIFE, sidebar, toast, utils
│   ├── dashboard.js         ← Dashboard only: table, stats, search, delete modal
│   └── upload.js            ← Upload form: image compression + Supabase upload
├── supabase-setup.sql       ← Run once in Supabase SQL Editor to create DB schema
└── README.md                ← Full setup guide for the shop owner
```

---

## Database Schema

Table: `jewellery_items`

| Column         | Type           | Notes                        |
|----------------|----------------|------------------------------|
| `id`           | UUID           | Primary key, auto-generated  |
| `unique_number`| TEXT           | Unique item code, e.g. RNG-001 |
| `name`         | TEXT           | Item name                    |
| `category`     | TEXT           | One of 8 category IDs        |
| `gram_weight`  | DECIMAL(10,3)  | Weight in grams              |
| `image1_url`   | TEXT           | Main image (public URL)      |
| `image2_url`   | TEXT           | Second image (optional)      |
| `image3_url`   | TEXT           | Third image (optional)       |
| `description`  | TEXT           | Optional description         |
| `created_at`   | TIMESTAMPTZ    | Auto set on insert           |
| `updated_at`   | TIMESTAMPTZ    | Auto updated via trigger     |

RLS is enabled. Public can SELECT. Only authenticated users can INSERT/UPDATE/DELETE.

---

## Categories (fixed list in config.js)

| ID                  | Label               |
|---------------------|---------------------|
| `rings`             | Rings               |
| `earrings`          | Earrings            |
| `pendants`          | Pendants            |
| `necklaces`         | Necklaces           |
| `bangles-bracelets` | Bangles & Bracelets |
| `chains`            | Chains              |
| `nosepins`          | Nosepins            |
| `special-ornaments` | Special Ornaments   |

---

## Key Architecture Decisions

### Script load order in admin pages (critical)
The auth guard in `admin.js` is an async IIFE that awaits `supabaseClient.auth.getSession()`. After the await resolves, it calls `initDashboard()` or `initUploadPage()` if they exist. For this to work, page-specific scripts **must be loaded before `admin.js`**:

- `dashboard.html`: `config.js` → `dashboard.js` → `admin.js`
- `upload.html`: `config.js` → `upload.js` → `admin.js`

If `admin.js` is loaded first, the page-specific init functions won't be defined when the IIFE resumes (microtask queue runs before the next script tag is parsed).

### No `supabase` variable — use `supabaseClient`
The Supabase CDN registers `window.supabase`. Using `const supabase = ...` in config.js caused:
```
SyntaxError: redeclaration of non-configurable global property supabase
```
The fix: renamed the client to `supabaseClient` in `config.js` and updated all references across every JS file and the admin login inline script.

### Image compression (client-side, no library)
`upload.js` compresses images using the Canvas API before uploading:
- Max 1000×1000px (aspect ratio preserved)
- Converted to JPEG at 82% quality
- Typical result: 3MB photo → ~150–250KB
- Falls back to original if compression fails

---

## How to Run Locally

```bash
cd /home/siddharth/Documents/jewelleryShop
python3 -m http.server 3000
```

- Public site: http://localhost:3000
- Admin login: http://localhost:3000/admin/

Do NOT open files directly with `file://` — Supabase JS requires HTTP.

---

## Deployment

Hosted on Netlify. To redeploy after changes:
- Drag the `jewelleryShop` folder onto the Netlify dashboard, OR
- Push to the connected GitHub repo (auto-deploys)

---
## Known Issues Fixed (history)

| Issue | Fix |
|-------|-----|
| `supabase.from is not a function` | Multiline Supabase calls (`await supabase\n.from(...)`) weren't caught by sed — renamed bare `supabase` at end-of-line to `supabaseClient` |
| `redeclaration of non-configurable global property supabase` | Renamed client variable from `supabase` to `supabaseClient` in config.js |
| Admin dashboard code running on upload page | Extracted dashboard logic into separate `dashboard.js`; `admin.js` now only contains shared utilities |
| `initUploadPage` not found | Script load order fixed — page-specific JS now loads before `admin.js` |

---

## What Still Needs Testing / Possible Next Steps

- End-to-end test: login → add item with 3 images → verify it appears on public site
- Verify delete removes images from Supabase Storage correctly
- Consider adding a contact/enquiry form for visitors
- Consider adding WhatsApp button per item for customer enquiries
