// ============================================================
// category.js — Category listing page
// ============================================================

const PAGE_SIZE = 12;
let currentPage = 1;
let allItems    = [];
let filtered    = [];

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('year').textContent = new Date().getFullYear();

  // Hamburger
  document.getElementById('hamburger').addEventListener('click', () => {
    document.getElementById('navLinks').classList.toggle('open');
  });

  // Resolve category from URL
  const params   = new URLSearchParams(window.location.search);
  const catId    = params.get('cat');
  const cat      = CATEGORIES.find(c => c.id === catId);

  if (!cat) {
    // Show all items if no category given
    document.getElementById('pageTitle').textContent = 'All Jewellery';
    document.getElementById('breadcrumbCat').textContent = 'All';
    document.title = 'All Jewellery — MG Jewellers';
  } else {
    document.getElementById('pageTitle').textContent = cat.icon + ' ' + cat.label;
    document.getElementById('pageDesc').textContent  = cat.description;
    document.getElementById('breadcrumbCat').textContent = cat.label;
    document.title = cat.label + ' — MG Jewellers';
  }

  await loadItems(catId);

  document.getElementById('sortSelect').addEventListener('change', applyFilters);
  let searchTimer;
  document.getElementById('searchInput').addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(applyFilters, 300);
  });
});

async function loadItems(catId) {
  const grid = document.getElementById('itemsGrid');
  grid.innerHTML = `<div class="loading" style="grid-column:1/-1"><div class="spinner"></div><span>Loading...</span></div>`;

  try {
    let query = supabaseClient
      .from('jewellery_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (catId) query = query.eq('category', catId);

    const { data, error } = await query;
    if (error) throw error;

    allItems = data || [];
    applyFilters();
  } catch (err) {
    console.error(err);
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon">⚠️</div>
        <h3>Failed to Load</h3>
        <p>Check your Supabase configuration in <code>js/config.js</code></p>
      </div>`;
  }
}

function applyFilters() {
  const sortVal = document.getElementById('sortSelect').value;
  const search  = document.getElementById('searchInput').value.trim().toLowerCase();

  // Filter
  filtered = allItems.filter(item => {
    if (!search) return true;
    return (
      item.name.toLowerCase().includes(search) ||
      item.unique_number.toLowerCase().includes(search)
    );
  });

  // Sort
  const [field, dir] = sortVal.split('_');
  const realField = field === 'gram' ? 'gram_weight' : field === 'created' ? 'created_at' : 'name';
  filtered.sort((a, b) => {
    let va = a[realField], vb = b[realField];
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return dir === 'asc' ? -1 : 1;
    if (va > vb) return dir === 'asc' ? 1 : -1;
    return 0;
  });

  currentPage = 1;
  renderPage();
}

function renderPage() {
  const grid = document.getElementById('itemsGrid');
  const count = document.getElementById('itemsCount');
  const total = filtered.length;

  count.innerHTML = `<strong>${total}</strong> item${total !== 1 ? 's' : ''}`;

  if (total === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon">🔍</div>
        <h3>No Items Found</h3>
        <p>Try a different search or check back later.</p>
      </div>`;
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  const start  = (currentPage - 1) * PAGE_SIZE;
  const end    = start + PAGE_SIZE;
  const page   = filtered.slice(start, end);

  grid.innerHTML = page.map(item => buildItemCard(item)).join('');
  renderPagination(total);
}

function renderPagination(total) {
  const pages = Math.ceil(total / PAGE_SIZE);
  const pag   = document.getElementById('pagination');
  if (pages <= 1) { pag.innerHTML = ''; return; }

  let html = '';
  if (currentPage > 1)
    html += `<button onclick="goPage(${currentPage - 1})">‹</button>`;

  for (let i = 1; i <= pages; i++) {
    html += `<button class="${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
  }

  if (currentPage < pages)
    html += `<button onclick="goPage(${currentPage + 1})">›</button>`;

  pag.innerHTML = html;
}

function goPage(n) {
  currentPage = n;
  renderPage();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function buildItemCard(item) {
  const imgSrc = item.image1_url || 'https://placehold.co/400x400/F5E6C8/8B6914?text=No+Image';
  const cat    = CATEGORIES.find(c => c.id === item.category);
  return `
    <a href="item.html?id=${item.id}" class="item-card">
      <div class="item-card-img-wrap">
        <img class="item-card-img" src="${imgSrc}" alt="${escHtml(item.name)}" loading="lazy">
        ${cat ? `<span class="item-card-badge">${cat.label}</span>` : ''}
      </div>
      <div class="item-card-body">
        <div class="item-card-num"># ${escHtml(item.unique_number)}</div>
        <div class="item-card-name">${escHtml(item.name)}</div>
        <div class="item-card-gram">Weight: <span>${item.gram_weight}g</span></div>
      </div>
      <div class="item-card-footer">
        <span class="btn btn-outline btn-sm">View Details →</span>
      </div>
    </a>`;
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}
