// ============================================================
// item.js — Item detail page
// ============================================================

let currentImages = []; // image URLs only — used by lightbox
let currentMedia  = []; // all media: [{url, isVideo}, ...]
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

/** Returns true for stored Drive video embed URLs (contain /preview) */
function isVideoUrl(url) {
  return url && url.includes('drive.google.com/file/d/') && url.includes('/preview');
}

/** Extract Drive file ID and return the lh3 thumbnail URL */
function getDriveThumbnailUrl(previewUrl) {
  const m = previewUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  return m ? `https://lh3.googleusercontent.com/d/${m[1]}` : null;
}

/** Convert a /preview URL back to a /view URL for the "Open in Drive" link */
function getDriveViewUrl(previewUrl) {
  const m = previewUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  return m ? `https://drive.google.com/file/d/${m[1]}/view` : previewUrl;
}

function renderItem(item) {
  const cat = CATEGORIES.find(c => c.id === item.category);

  // Breadcrumb
  const catLink = document.getElementById('breadCatLink');
  catLink.textContent = cat ? cat.label : item.category;
  catLink.href = `category.html?cat=${item.category}`;
  document.getElementById('breadItemName').textContent = item.name;
  document.title = item.name + ' — MG Jewellers';

  // Build media list — images and videos together
  currentMedia = [item.image1_url, item.image2_url, item.image3_url]
    .filter(Boolean)
    .map(url => ({ url, isVideo: isVideoUrl(url) }));

  if (currentMedia.length === 0)
    currentMedia = [{ url: 'https://placehold.co/600x600/F5E6C8/8B6914?text=No+Image', isVideo: false }];

  // Images only for lightbox navigation
  currentImages = currentMedia.filter(m => !m.isVideo).map(m => m.url);

  const firstMedia   = currentMedia[0];
  const imageCount   = currentImages.length;
  const videoCount   = currentMedia.filter(m => m.isVideo).length;
  const mediaLabel   = [
    imageCount ? `${imageCount} Photo${imageCount !== 1 ? 's' : ''}` : '',
    videoCount ? `${videoCount} Video${videoCount !== 1 ? 's' : ''}` : '',
  ].filter(Boolean).join(', ') || '—';

  const thumbsHtml = currentMedia.map((media, i) => {
    if (media.isVideo) {
      const thumbUrl = getDriveThumbnailUrl(media.url);
      const bgStyle  = thumbUrl ? ` style="background-image:url('${thumbUrl}')"` : '';
      return `<div class="item-video-thumb${i === 0 ? ' active' : ''}" onclick="switchMedia(${i})" title="Play video"${bgStyle}></div>`;
    }
    return `
      <img
        class="item-thumb${i === 0 ? ' active' : ''}"
        src="${media.url}"
        alt="View ${i + 1}"
        onclick="switchMedia(${i})"
        loading="lazy"
      >`;
  }).join('');

  const firstVideoHtml = firstMedia.isVideo ? buildVideoPlayerHtml(firstMedia.url) : '';

  document.getElementById('itemContent').innerHTML = `
    <div class="item-detail-grid">
      <!-- Gallery -->
      <div class="item-gallery">
        <img
          id="mainImage"
          class="item-main-img"
          src="${firstMedia.isVideo ? '' : firstMedia.url}"
          alt="${escHtml(item.name)}"
          onclick="openLightbox(lightboxIndex)"
          title="Click to zoom"
          style="${firstMedia.isVideo ? 'display:none' : ''}"
        >
        <div id="mainVideo" class="item-video-player"
          data-embed-url="${firstMedia.isVideo ? firstMedia.url : ''}"
          style="${firstMedia.isVideo ? '' : 'display:none'}">
          ${firstVideoHtml}
        </div>
        <a
          id="videoDriveLink"
          class="video-drive-link${firstMedia.isVideo ? '' : ' hidden'}"
          href="${firstMedia.isVideo ? getDriveViewUrl(firstMedia.url) : '#'}"
          target="_blank" rel="noopener"
        >Can't play? Open in Google Drive ↗</a>
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
            <div class="spec-label">Media</div>
            <div class="spec-value">${mediaLabel}</div>
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

  // Set initial lightbox index
  lightboxIndex = 0;
}

/**
 * Build the inner HTML for the video player area.
 * Shows the Drive thumbnail + play button. Clicking loads the iframe.
 */
function buildVideoPlayerHtml(videoUrl) {
  const thumbUrl = getDriveThumbnailUrl(videoUrl);
  const embedUrl = videoUrl; // already the /preview URL
  return `
    <img src="${thumbUrl || ''}" alt="Video thumbnail" onerror="this.style.display='none'" style="width:100%;height:100%;object-fit:cover;display:block;">
    <div class="item-video-overlay" onclick="loadDriveEmbed(event)">
      <div class="item-video-play-btn">▶</div>
      <div class="item-video-label">Click to Play</div>
    </div>`;
}

/** Replace the thumbnail with the actual Drive iframe on click */
function loadDriveEmbed(e) {
  const container = document.getElementById('mainVideo');
  if (!container) return;
  const embedUrl = container.dataset.embedUrl;
  if (!embedUrl) return;
  container.innerHTML = `<iframe
    src="${embedUrl}"
    allow="autoplay; fullscreen"
    allowfullscreen
    style="width:100%;height:100%;border:none;display:block;"
  ></iframe>`;
}

function switchMedia(i) {
  const media      = currentMedia[i];
  const mainImg    = document.getElementById('mainImage');
  const mainVid    = document.getElementById('mainVideo');
  const driveLink  = document.getElementById('videoDriveLink');

  // Update active thumbnail
  document.querySelectorAll('.item-thumb, .item-video-thumb').forEach((t, idx) => {
    t.classList.toggle('active', idx === i);
  });

  if (media.isVideo) {
    mainImg.style.display = 'none';
    mainVid.style.display = '';
    // Reset to thumbnail state (clears any previously loaded iframe)
    mainVid.dataset.embedUrl = media.url;
    mainVid.innerHTML = buildVideoPlayerHtml(media.url);
    if (driveLink) {
      driveLink.href = getDriveViewUrl(media.url);
      driveLink.classList.remove('hidden');
    }
  } else {
    mainVid.style.display = 'none';
    mainImg.style.display = '';
    mainImg.src = media.url;
    mainImg.style.opacity = '0';
    setTimeout(() => { mainImg.style.opacity = '1'; }, 50);
    if (driveLink) driveLink.classList.add('hidden');
    const lbIdx = currentImages.indexOf(media.url);
    lightboxIndex = lbIdx >= 0 ? lbIdx : 0;
  }
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
  // Sync the gallery thumbnail to match
  const mediaIdx = currentMedia.findIndex(m => m.url === currentImages[lightboxIndex]);
  if (mediaIdx >= 0) switchMedia(mediaIdx);
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
  const placeholder = 'https://placehold.co/400x400/F5E6C8/8B6914?text=No+Image';
  const allUrls = [item.image1_url, item.image2_url, item.image3_url].filter(Boolean);
  const isVideo = allUrls.some(isVideoUrl);
  const imgSrc  = allUrls.find(u => !isVideoUrl(u)) || placeholder;
  const cat     = CATEGORIES.find(c => c.id === item.category);
  return `
    <a href="item.html?id=${item.id}" class="item-card">
      <div class="item-card-img-wrap">
        <img class="item-card-img" src="${imgSrc}" alt="${escHtml(item.name)}" loading="lazy">
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
    </a>`;
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}
