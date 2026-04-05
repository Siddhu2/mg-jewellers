// ============================================================
// main.js — Homepage logic
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  initNav();
  document.getElementById('year').textContent = new Date().getFullYear();
  renderCategoryCards();
  renderFooterLinks();
  await loadFeaturedItems();
});

// ---- Navbar toggle ----
function initNav() {
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }
}

// ---- Render category grid on homepage ----
function renderCategoryCards() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;
  grid.innerHTML = CATEGORIES.map(cat => `
    <a href="category.html?cat=${cat.id}" class="category-card">
      <div class="category-icon">${cat.icon}</div>
      <div class="category-name">${cat.label}</div>
      <div class="category-desc">${cat.description}</div>
    </a>
  `).join('');
}

// ---- Footer category links ----
function renderFooterLinks() {
  const list = document.getElementById('footerCatLinks');
  if (!list) return;
  list.innerHTML = CATEGORIES.map(cat =>
    `<li><a href="category.html?cat=${cat.id}">${cat.label}</a></li>`
  ).join('');
}

// ---- Load latest 8 items for featured section ----
async function loadFeaturedItems() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;

  try {
    const { data, error } = await supabaseClient
      .from('jewellery_items')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) throw error;

    if (!data || data.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon">💎</div>
          <h3>Collection Coming Soon</h3>
          <p>Our jewellery collection is being curated. Check back soon!</p>
        </div>`;
      return;
    }

    grid.innerHTML = data.map(item => buildItemCard(item)).join('');

  } catch (err) {
    console.error(err);
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon">⚠️</div>
        <h3>Could Not Load Items</h3>
        <p>Please configure your Supabase credentials in <code>js/config.js</code></p>
      </div>`;
  }
}

// ---- Shared: build item card HTML ----
function isVideoUrl(url) {
  return url && url.includes('drive.google.com/file/d/') && url.includes('/preview');
}

function driveVideoThumbUrl(previewUrl) {
  const m = previewUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  return m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w400` : null;
}

function buildItemCard(item) {
  const placeholder = 'https://placehold.co/400x400/F5E6C8/8B6914?text=No+Image';
  const allUrls = [item.image1_url, item.image2_url, item.image3_url].filter(Boolean);
  const isVideo = allUrls.some(isVideoUrl);
  const imgSrc  = allUrls.find(u => !isVideoUrl(u)) || placeholder;
  const cat = CATEGORIES.find(c => c.id === item.category);
  return `
    <a href="item.html?id=${item.id}" class="item-card">
      <div class="item-card-img-wrap">
        <img
          class="item-card-img"
          src="${imgSrc}"
          alt="${escHtml(item.name)}"
          loading="lazy"
        >
        ${cat ? `<span class="item-card-badge">${cat.label}</span>` : ''}
        ${isVideo ? `<span class="item-card-video-badge">▶</span>` : ''}
      </div>
      <div class="item-card-body">
        <div class="item-card-num"># ${escHtml(item.unique_number)}</div>
        <div class="item-card-name">${escHtml(item.name)}</div>
        <div class="item-card-gram">Weight: <span>${item.gram_weight}g</span></div>
      </div>
      <div class="item-card-footer">
        <span class="btn btn-outline btn-sm">View Details →</span>
      </div>
    </a>
  `;
}

// ---- Utility ----
function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}
