// ============================================================
// item.js — Item detail page
// ============================================================

let currentImages = [];
let lightboxIndex = 0;

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('year').textContent = new Date().getFullYear();

  document.getElementById('hamburger').addEventListener('click', () => {
    document.getElementById('navLinks').classList.toggle('open');
  });

  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');

  if (!id) {
    showError('No item ID provided.');
    return;
  }

  await loadItem(id);
  initLightbox();
});

async function loadItem(id) {
  try {
    const { data, error } = await supabaseClient
      .from('jewellery_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw error || new Error('Item not found');

    renderItem(data);
    await loadRelated(data.category, data.id);
  } catch (err) {
    showError('Item not found or failed to load.');
    console.error(err);
  }
}

function renderItem(item) {
  const cat = CATEGORIES.find(c => c.id === item.category);

  // Update breadcrumb
  const catLink = document.getElementById('breadCatLink');
  catLink.textContent = cat ? cat.label : item.category;
  catLink.href = `category.html?cat=${item.category}`;
  document.getElementById('breadItemName').textContent = item.name;
  document.title = item.name + ' — MG Jewellers';

  // Collect available images
  currentImages = [item.image1_url, item.image2_url, item.image3_url].filter(Boolean);
  if (currentImages.length === 0)
    currentImages = ['https://placehold.co/600x600/F5E6C8/8B6914?text=No+Image'];

  const thumbsHtml = currentImages.map((src, i) => `
    <img
      class="item-thumb ${i === 0 ? 'active' : ''}"
      src="${src}"
      alt="View ${i + 1}"
      onclick="switchImage(${i})"
      loading="lazy"
    >
  `).join('');

  document.getElementById('itemContent').innerHTML = `
    <div class="item-detail-grid">
      <!-- Gallery -->
      <div class="item-gallery">
        <img
          id="mainImage"
          class="item-main-img"
          src="${currentImages[0]}"
          alt="${escHtml(item.name)}"
          onclick="openLightbox(0)"
          title="Click to zoom"
        >
        <div class="item-thumbs" id="thumbsRow">
          ${thumbsHtml}
        </div>
      </div>

      <!-- Info -->
      <div class="item-info">
        <a href="category.html?cat=${item.category}" class="item-category-link">
          ${cat ? cat.icon : ''} ${cat ? cat.label : item.category}
        </a>
        <h1 class="item-title">${escHtml(item.name)}</h1>

        <div class="item-specs">
          <div class="spec-box">
            <div class="spec-label">Item Number</div>
            <div class="spec-value">${escHtml(item.unique_number)}</div>
          </div>
          <div class="spec-box">
            <div class="spec-label">Weight</div>
            <div class="spec-value">${item.gram_weight}g</div>
          </div>
          <div class="spec-box">
            <div class="spec-label">Category</div>
            <div class="spec-value">${cat ? cat.label : escHtml(item.category)}</div>
          </div>
          <div class="spec-box">
            <div class="spec-label">Images</div>
            <div class="spec-value">${currentImages.length} Photo${currentImages.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        ${item.description ? `
          <div class="item-description">
            <h4>About this Piece</h4>
            <p>${escHtml(item.description)}</p>
          </div>
        ` : ''}

        <div style="margin-top: 28px; display: flex; gap: 12px; flex-wrap: wrap;">
          <a href="category.html?cat=${item.category}" class="btn btn-primary">
            Browse More ${cat ? cat.label : 'Items'}
          </a>
          <a href="index.html#all-categories" class="btn btn-outline">
            All Categories
          </a>
        </div>
      </div>
    </div>
  `;
}

function switchImage(index) {
  lightboxIndex = index;
  const main = document.getElementById('mainImage');
  if (main) {
    main.src = currentImages[index];
    main.style.opacity = '0';
    setTimeout(() => { main.style.opacity = '1'; }, 50);
  }
  document.querySelectorAll('.item-thumb').forEach((t, i) => {
    t.classList.toggle('active', i === index);
  });
}

async function loadRelated(category, excludeId) {
  try {
    const { data } = await supabaseClient
      .from('jewellery_items')
      .select('*')
      .eq('category', category)
      .neq('id', excludeId)
      .order('created_at', { ascending: false })
      .limit(4);

    if (!data || data.length === 0) return;

    const section = document.getElementById('relatedSection');
    const grid    = document.getElementById('relatedGrid');
    section.classList.remove('hidden');
    grid.innerHTML = data.map(item => buildItemCard(item)).join('');
  } catch (e) { /* silently fail for related */ }
}

// ---- Lightbox ----
function openLightbox(index) {
  lightboxIndex = index;
  document.getElementById('lightboxImg').src = currentImages[index];
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}

function lightboxNav(dir) {
  lightboxIndex = (lightboxIndex + dir + currentImages.length) % currentImages.length;
  document.getElementById('lightboxImg').src = currentImages[lightboxIndex];
  switchImage(lightboxIndex);
}

function initLightbox() {
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  document.getElementById('lightboxPrev').addEventListener('click', () => lightboxNav(-1));
  document.getElementById('lightboxNext').addEventListener('click', () => lightboxNav(1));
  document.getElementById('lightbox').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    const lb = document.getElementById('lightbox');
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowLeft')   lightboxNav(-1);
    if (e.key === 'ArrowRight')  lightboxNav(1);
  });
}

// ---- Helpers ----
function showError(msg) {
  document.getElementById('itemContent').innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <h3>Item Not Found</h3>
      <p>${msg}</p>
      <a href="index.html" class="btn btn-primary" style="margin-top:20px">Back to Home</a>
    </div>`;
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
