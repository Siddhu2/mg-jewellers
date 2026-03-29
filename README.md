# MG Jewellers — Complete Website

A fast, elegant jewellery showcase website with admin panel.
**Cost: Free** (Supabase free tier + Netlify free hosting)

---

## Features

- Public catalogue with 8 jewellery categories
- Each item: 3 images, gram weight, name, unique number
- Image zoom lightbox, related items, search & sort
- Admin panel: add, edit, delete items with image upload
- **Auto image compression** — resizes & converts to JPEG before upload (no manual work needed)
- Drag & drop image upload with progress bar
- Mobile responsive, fast-loading (static + CDN)

---

## Tech Stack

| Layer    | Tool                  | Cost |
|----------|-----------------------|------|
| Frontend | Static HTML/CSS/JS    | Free |
| Database | Supabase (PostgreSQL) | Free |
| Images   | Supabase Storage      | Free |
| Auth     | Supabase Auth         | Free |
| Hosting  | Netlify               | Free |

---

## Setup Guide (Step by Step)

### Step 1 — Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → Sign up (free)
2. Click **"New Project"**
3. Choose a name (e.g., `mkjewellery`) and a strong database password
4. Select the region closest to your audience (e.g., `South Asia`)
5. Wait ~2 minutes for the project to be ready

---

### Step 2 — Set Up Database

1. In Supabase, go to **SQL Editor**
2. Click **"New Query"**
3. Copy the entire content of `supabase-setup.sql`
4. Paste it and click **"Run"**
5. You should see "Success" — your table and storage bucket are ready

---

### Step 3 — Create Admin User

1. In Supabase, go to **Authentication → Users**
2. Click **"Add User"** → **"Create new user"**
3. Enter your admin email and a strong password
4. Click **"Create User"**

> Keep these credentials safe — this is your admin login!

---

### Step 4 — Get API Keys

1. In Supabase, go to **Project Settings → API**
2. Copy:
   - **Project URL** (e.g., `https://abcxyz.supabase.co`)
   - **anon public** key (long string under "Project API keys")

---

### Step 5 — Configure the Website

Open `js/config.js` and fill in your credentials:

```js
const SUPABASE_URL     = 'https://YOUR-PROJECT-ID.supabase.co';
const SUPABASE_ANON_KEY = 'eyJ...your-anon-key...';
```

> **Important:** The Supabase client is exposed as `supabaseClient` (not `supabase`) throughout the codebase to avoid a naming conflict with the CDN library.

---

### Step 6 — Test Locally Before Deploying

Run a local server from the project folder:

```bash
cd jewelleryShop
python3 -m http.server 3000
```

Then open:
- Public site: `http://localhost:3000`
- Admin login: `http://localhost:3000/admin/`

> The site needs an HTTP server — do **not** open HTML files directly with `file://` as Supabase JS won't work.

---

### Step 7 — Deploy to Netlify (Free)

**Option A — Drag & Drop (easiest):**
1. Go to [netlify.com](https://netlify.com) → Sign up (free)
2. Drag your entire `jewelleryShop` folder onto the Netlify dashboard
3. Your site is live in ~30 seconds

**Option B — Via GitHub (recommended for updates):**
1. Push the folder to a GitHub repository
2. In Netlify → **"New site from Git"** → connect the repo
3. Every push to GitHub auto-deploys to Netlify

**Custom Domain:**
- Netlify → Site Settings → Domain Management → Add your domain
- Free SSL certificate is provided automatically

---

## File Structure

```
jewelleryShop/
├── index.html               ← Homepage
├── category.html            ← Category listing (?cat=rings)
├── item.html                ← Item detail page (?id=uuid)
├── favicon.svg              ← Browser tab icon
├── admin/
│   ├── index.html           ← Admin login
│   ├── dashboard.html       ← Manage all items
│   └── upload.html          ← Add / Edit item form
├── css/
│   └── style.css            ← All styles (gold luxury theme)
├── js/
│   ├── config.js            ← ⭐ EDIT THIS: Supabase credentials
│   ├── main.js              ← Homepage logic
│   ├── category.js          ← Category listing logic
│   ├── item.js              ← Item detail + lightbox
│   ├── admin.js             ← Auth guard, sidebar, toast utilities
│   ├── dashboard.js         ← Dashboard table, stats, delete
│   └── upload.js            ← Image compression + upload logic
└── supabase-setup.sql       ← Run once in Supabase SQL Editor
```

---

## Admin Panel Usage

| Action        | How                                                      |
|---------------|----------------------------------------------------------|
| Login         | Go to `/admin/` → enter email & password                 |
| Add item      | Click **"Add New Item"** → fill form → upload images     |
| Edit item     | Click **"Edit"** next to any item in the dashboard       |
| Delete item   | Click **"Delete"** → confirm (also removes images)       |
| Search        | Use the search box in the dashboard to filter by name/number |
| Filter        | Use the category dropdown to view one category at a time |

---

## Image Compression

Images are automatically compressed **in the browser before uploading** — no manual work needed.

| Setting       | Value                        |
|---------------|------------------------------|
| Max dimensions | 1000 × 1000 px              |
| Output format  | JPEG                        |
| Quality        | 82%                         |
| Max input size | 15 MB                       |
| Typical result | 3MB photo → ~150–250KB      |

A toast notification shows the before/after size after each image is selected.

---

## Public Website URLs

| Page       | URL                                          |
|------------|----------------------------------------------|
| Homepage   | `your-site.netlify.app/`                     |
| Category   | `your-site.netlify.app/category.html?cat=rings` |
| All items  | `your-site.netlify.app/category.html`        |
| Item detail| `your-site.netlify.app/item.html?id=<uuid>`  |
| Admin      | `your-site.netlify.app/admin/`               |

---

## Supabase Free Tier Limits

| Resource      | Free Limit    | Notes                              |
|---------------|---------------|------------------------------------|
| Database rows | Unlimited     | —                                  |
| Storage       | 1 GB          | ~5,000+ compressed images at ~200KB each |
| Bandwidth     | 5 GB/month    | Ample for most shops               |
| Auth users    | 50,000        | More than enough                   |

---

## Categories

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

## Troubleshooting

**Login fails with "supabase is not defined"**
→ Make sure `js/config.js` has your real Supabase URL and anon key (not the placeholder values).

**"supabase.from is not a function"**
→ The client variable is `supabaseClient` — do not rename it to `supabase` as it clashes with the CDN global.

**Images not loading after upload**
→ Check that the `jewellery-images` storage bucket is set to **Public** in Supabase → Storage → Policies.

**Page works locally but not on Netlify**
→ Re-drag/redeploy the folder after updating `config.js` with credentials.
