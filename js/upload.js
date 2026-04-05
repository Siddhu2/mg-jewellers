// ============================================================
// upload.js — Add / Edit jewellery item with image upload
// ============================================================

const MAX_WIDTH    = 1000;   // px — max dimension after resize
const MAX_HEIGHT   = 1000;
const JPEG_QUALITY = 0.82;   // 0–1, higher = better quality, bigger file

const imageFiles      = { 1: null, 2: null, 3: null }; // File objects for upload
const imageUrls       = { 1: null, 2: null, 3: null }; // existing URLs (edit mode)
const imagePastedUrls = { 1: null, 2: null, 3: null }; // pasted Drive/direct URLs
const slotIsVideo     = { 1: false, 2: false, 3: false }; // true if slot holds a video URL

let editMode   = false;
let editItemId = null;

async function initUploadPage() {
  const catSelect = document.getElementById('itemCategory');
  if (catSelect) {
    CATEGORIES.forEach(cat => {
      const opt = document.createElement('option');
      opt.value       = cat.id;
      opt.textContent = cat.icon + ' ' + cat.label;
      catSelect.appendChild(opt);
    });
  }

  const params = new URLSearchParams(window.location.search);
  const editId = params.get('edit');
  if (editId) {
    editMode   = true;
    editItemId = editId;
    document.getElementById('itemId').value = editId;
    document.title = 'Edit Item — Admin — MG Jewellers';
    document.getElementById('formHeading').textContent    = 'Edit Jewellery Item';
    document.getElementById('formSubheading').textContent = 'Update the details below';
    document.getElementById('cardTitle').textContent      = 'Edit Item Details';
    document.getElementById('submitBtn').textContent      = 'Save Changes';
    await loadEditItem(editId);
  }

  [1, 2, 3].forEach(n => setupDragDrop(n));
  document.getElementById('itemForm').addEventListener('submit', handleFormSubmit);
}

async function loadEditItem(id) {
  try {
    const { data, error } = await supabaseClient
      .from('jewellery_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw error || new Error('Item not found');

    document.getElementById('itemName').value     = data.name          || '';
    document.getElementById('itemNumber').value   = data.unique_number || '';
    document.getElementById('itemCategory').value = data.category      || '';
    document.getElementById('itemGram').value     = data.gram_weight   || '';
    document.getElementById('itemDesc').value     = data.description   || '';

    [1, 2, 3].forEach(n => {
      const url = data[`image${n}_url`];
      if (!url) return;
      imageUrls[n] = url;
      if (isVideoUrl(url)) {
        slotIsVideo[n]     = true;
        imagePastedUrls[n] = url;
        const urlInput = document.getElementById(`urlInput${n}`);
        if (urlInput) urlInput.value = url;
        const cb = document.getElementById(`isVideo${n}`);
        if (cb) cb.checked = true;
        setUrlStatus(n, 'ok', '▶ Google Drive video');
        showVideoPreview(n);
      } else {
        showPreview(n, url);
        if (isDriveUrl(url)) {
          const urlInput = document.getElementById(`urlInput${n}`);
          if (urlInput) urlInput.value = url;
          setUrlStatus(n, 'ok', '✓ Drive URL loaded');
        }
      }
    });
  } catch (err) {
    showToast('Failed to load item: ' + err.message, 'error');
    console.error(err);
  }
}

// ============================================================
// Image compression using Canvas API
// ============================================================

/**
 * Compress an image File:
 * - Resize to fit within MAX_WIDTH × MAX_HEIGHT (preserving aspect ratio)
 * - Convert to JPEG at JPEG_QUALITY
 * - Returns a new Blob
 */
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale down if larger than max dimensions
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width  = Math.round(width  * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('Canvas compression failed')),
        'image/jpeg',
        JPEG_QUALITY
      );
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
    img.src = url;
  });
}

// ---- Image select — compress on pick and show preview ----
async function handleImageSelect(n, input) {
  const file = input.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('Please select a valid image file.', 'error');
    return;
  }
  if (file.size > 15 * 1024 * 1024) {
    showToast('Image must be under 15MB.', 'error');
    return;
  }

  // Show compressing indicator on the box
  const text = document.getElementById(`uploadText${n}`);
  const origText = text.innerHTML;
  text.innerHTML = '⏳ Compressing...';

  try {
    const compressed = await compressImage(file);
    // Store as a File so it has a proper name for upload
    imageFiles[n] = new File([compressed], `image${n}.jpg`, { type: 'image/jpeg' });

    const sizeBefore = (file.size / 1024).toFixed(0);
    const sizeAfter  = (compressed.size / 1024).toFixed(0);
    console.log(`Image ${n}: ${sizeBefore}KB → ${sizeAfter}KB`);

    // Show preview from compressed blob
    const reader = new FileReader();
    reader.onload = (e) => showPreview(n, e.target.result);
    reader.readAsDataURL(compressed);

    showToast(`Image ${n} compressed: ${sizeBefore}KB → ${sizeAfter}KB`, 'success');
  } catch (err) {
    text.innerHTML = origText;
    showToast('Compression failed, using original.', 'info');
    // Fall back to original
    imageFiles[n] = file;
    const reader = new FileReader();
    reader.onload = (e) => showPreview(n, e.target.result);
    reader.readAsDataURL(file);
  }
}

function showPreview(n, src) {
  document.getElementById(`uploadIcon${n}`).style.display = 'none';
  document.getElementById(`uploadText${n}`).style.display = 'none';
  const preview = document.getElementById(`imgPreview${n}`);
  preview.src = src;
  preview.classList.remove('hidden');
  document.getElementById(`removeBtn${n}`).style.display = 'flex';
}

function showVideoPreview(n) {
  const icon = document.getElementById(`uploadIcon${n}`);
  const text = document.getElementById(`uploadText${n}`);
  icon.textContent    = '🎬';
  icon.style.display  = '';
  text.innerHTML      = 'Video ready to embed';
  text.style.display  = '';
  document.getElementById(`imgPreview${n}`).classList.add('hidden');
  document.getElementById(`removeBtn${n}`).style.display = 'flex';
}

function removeImage(n) {
  imageFiles[n]      = null;
  imageUrls[n]       = null;
  imagePastedUrls[n] = null;
  slotIsVideo[n]     = false;
  document.getElementById(`imgInput${n}`).value  = '';
  document.getElementById(`urlInput${n}`).value  = '';
  document.getElementById(`imgPreview${n}`).src  = '';
  document.getElementById(`imgPreview${n}`).classList.add('hidden');
  const icon = document.getElementById(`uploadIcon${n}`);
  icon.textContent   = '📸';
  icon.style.display = '';
  document.getElementById(`uploadText${n}`).style.display = '';
  document.getElementById(`removeBtn${n}`).style.display  = 'none';
  const cb = document.getElementById(`isVideo${n}`);
  if (cb) cb.checked = false;
  setUrlStatus(n, '', '');
}

// ============================================================
// Google Drive / Direct URL handling
// ============================================================

/**
 * Convert a Google Drive sharing URL to a direct embeddable URL.
 * Uses lh3.googleusercontent.com/d/FILE_ID — Google's image CDN,
 * more reliable than uc?export=view which triggers virus-scan warning pages.
 *
 * Supports:
 *   https://drive.google.com/file/d/FILE_ID/view...
 *   https://drive.google.com/open?id=FILE_ID
 *   https://drive.google.com/uc?id=FILE_ID (old format)
 *   https://lh3.googleusercontent.com/d/FILE_ID (already converted)
 * Returns the converted URL, or the original if not a Drive URL.
 */
function convertDriveUrl(raw) {
  const trimmed = raw.trim();

  // Already in the correct lh3 format — return as-is
  if (trimmed.includes('lh3.googleusercontent.com/d/')) return trimmed;

  // Extract file ID from /file/d/FILE_ID/ pattern
  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) {
    return `https://lh3.googleusercontent.com/d/${fileMatch[1]}`;
  }

  // Extract from ?id=FILE_ID or open?id=FILE_ID or uc?id=FILE_ID
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) {
    return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
  }

  // Not a Drive URL — return as-is (direct image URL)
  return trimmed;
}

function isDriveUrl(url) {
  return url.includes('drive.google.com') || url.includes('lh3.googleusercontent.com');
}

/** Returns true if the URL is a stored Drive video embed URL (contains /preview) */
function isVideoUrl(url) {
  return url && url.includes('drive.google.com/file/d/') && url.includes('/preview');
}

/**
 * Convert a Google Drive sharing URL to a video embed (preview) URL.
 * Supports the same URL patterns as convertDriveUrl.
 */
function convertDriveVideoUrl(raw) {
  const trimmed = raw.trim();
  if (trimmed.includes('/preview')) return trimmed; // already an embed URL
  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return `https://drive.google.com/file/d/${idMatch[1]}/preview`;
  return trimmed;
}

function setUrlStatus(n, type, msg) {
  const el = document.getElementById(`urlStatus${n}`);
  if (!el) return;
  el.textContent = msg;
  el.className   = `url-status ${type}`;
  el.classList.toggle('hidden', !msg);
}

// Called on every keystroke in the URL input
let urlDebounceTimers = {};
function handleUrlInput(n, input) {
  const raw = input.value.trim();
  clearTimeout(urlDebounceTimers[n]);

  if (!raw) {
    imagePastedUrls[n] = null;
    slotIsVideo[n]     = false;
    const cb = document.getElementById(`isVideo${n}`);
    if (cb) cb.checked = false;
    // Only reset preview if no file is selected
    if (!imageFiles[n]) {
      document.getElementById(`imgPreview${n}`).src = '';
      document.getElementById(`imgPreview${n}`).classList.add('hidden');
      const icon = document.getElementById(`uploadIcon${n}`);
      icon.textContent   = '📸';
      icon.style.display = '';
      document.getElementById(`uploadText${n}`).style.display = '';
      document.getElementById(`removeBtn${n}`).style.display  = 'none';
    }
    setUrlStatus(n, '', '');
    return;
  }

  // If the video checkbox is already checked, apply video mode immediately
  const cb = document.getElementById(`isVideo${n}`);
  if (cb && cb.checked) {
    const videoUrl     = convertDriveVideoUrl(raw);
    slotIsVideo[n]     = true;
    imagePastedUrls[n] = videoUrl;
    setUrlStatus(n, 'ok', '▶ Will be embedded as video');
    showVideoPreview(n);
    return;
  }

  setUrlStatus(n, '', '⏳ Checking...');

  urlDebounceTimers[n] = setTimeout(() => {
    const converted = convertDriveUrl(raw);

    const testImg = new Image();
    testImg.onload = () => {
      slotIsVideo[n]     = false;
      imagePastedUrls[n] = converted;
      setUrlStatus(n, 'ok', '✓ Image loaded successfully');
      showPreview(n, converted);
    };
    testImg.onerror = () => {
      if (isDriveUrl(raw)) {
        setUrlStatus(n, 'info', 'Drive URL saved — tick "It\'s a video" below if this is a video');
        imagePastedUrls[n] = converted; // keep image URL as fallback
        slotIsVideo[n]     = false;
        showPreview(n, converted);
      } else {
        setUrlStatus(n, 'error', '✗ Could not load image — check the URL');
        imagePastedUrls[n] = null;
        slotIsVideo[n]     = false;
      }
    };
    testImg.src = converted;
  }, 600);
}

// Called when the "It's a video" checkbox is toggled
function handleVideoToggle(n, checkbox) {
  const raw = document.getElementById(`urlInput${n}`).value.trim();
  if (!raw) {
    checkbox.checked = false;
    return;
  }
  if (checkbox.checked) {
    const videoUrl     = convertDriveVideoUrl(raw);
    slotIsVideo[n]     = true;
    imagePastedUrls[n] = videoUrl;
    setUrlStatus(n, 'ok', '▶ Will be embedded as video');
    showVideoPreview(n);
  } else {
    const imageUrl     = convertDriveUrl(raw);
    slotIsVideo[n]     = false;
    imagePastedUrls[n] = imageUrl;
    setUrlStatus(n, 'ok', '✓ Treated as image');
    showPreview(n, imageUrl);
  }
}

// ---- Drag & Drop ----
function setupDragDrop(n) {
  const box = document.getElementById(`dropBox${n}`);
  if (!box) return;
  box.addEventListener('dragover',  (e) => { e.preventDefault(); box.classList.add('drag-over'); });
  box.addEventListener('dragleave', ()  => box.classList.remove('drag-over'));
  box.addEventListener('drop', (e) => {
    e.preventDefault();
    box.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const dt = new DataTransfer();
      dt.items.add(file);
      const input = document.getElementById(`imgInput${n}`);
      input.files = dt.files;
      handleImageSelect(n, input);
    }
  });
}

// ---- Upload one image to Supabase Storage ----
async function uploadImage(n, itemId) {
  const file = imageFiles[n];

  // Priority: uploaded file > pasted URL > existing URL (edit mode) > null
  if (!file) return imagePastedUrls[n] || imageUrls[n] || null;

  const progWrap = document.getElementById(`progress${n}`);
  const progBar  = document.getElementById(`progressBar${n}`);
  progWrap.classList.remove('hidden');
  progBar.style.width = '15%';

  const filename = `${itemId}/image${n}_${Date.now()}.jpg`;

  try {
    progBar.style.width = '50%';
    const { data, error } = await supabaseClient.storage
      .from('jewellery-images')
      .upload(filename, file, { upsert: true, contentType: 'image/jpeg' });

    if (error) throw error;

    progBar.style.width = '100%';
    setTimeout(() => progWrap.classList.add('hidden'), 600);

    const { data: urlData } = supabaseClient.storage
      .from('jewellery-images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (err) {
    progWrap.classList.add('hidden');
    throw new Error(`Image ${n} upload failed: ${err.message}`);
  }
}

// ---- Form Submit ----
async function handleFormSubmit(e) {
  e.preventDefault();

  const name     = document.getElementById('itemName').value.trim();
  const number   = document.getElementById('itemNumber').value.trim();
  const category = document.getElementById('itemCategory').value;
  const gram     = parseFloat(document.getElementById('itemGram').value);
  const desc     = document.getElementById('itemDesc').value.trim();

  if (!name || !number || !category || !gram || gram <= 0) {
    showToast('Please fill in all required fields.', 'error');
    return;
  }
  if (!imageFiles[1] && !imageUrls[1] && !imagePastedUrls[1]) {
    showToast('Please provide at least Image 1 — upload a file or paste a URL.', 'error');
    return;
  }

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.textContent = editMode ? 'Saving...' : 'Saving...';
  submitBtn.disabled    = true;

  try {
    let itemId = editItemId;

    if (!editMode) {
      const { data: newItem, error: insertError } = await supabaseClient
        .from('jewellery_items')
        .insert({
          name:          name,
          unique_number: number,
          category:      category,
          gram_weight:   gram,
          description:   desc || null,
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') throw new Error('Item number already exists. Use a unique number.');
        throw insertError;
      }
      itemId = newItem.id;
    }

    submitBtn.textContent = 'Uploading images...';

    const [url1, url2, url3] = await Promise.all([
      uploadImage(1, itemId),
      uploadImage(2, itemId),
      uploadImage(3, itemId),
    ]);

    const updateData = {
      image1_url: url1 || null,
      image2_url: url2 || null,
      image3_url: url3 || null,
    };

    if (editMode) {
      Object.assign(updateData, {
        name:          name,
        unique_number: number,
        category:      category,
        gram_weight:   gram,
        description:   desc || null,
        updated_at:    new Date().toISOString(),
      });
    }

    const { error: updateError } = await supabaseClient
      .from('jewellery_items')
      .update(updateData)
      .eq('id', itemId);

    if (updateError) throw updateError;

    showToast(editMode ? 'Item updated!' : 'Item added successfully!', 'success');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);

  } catch (err) {
    console.error(err);
    showToast('Error: ' + err.message, 'error');
    submitBtn.textContent = editMode ? 'Save Changes' : 'Save Item';
    submitBtn.disabled    = false;
  }
}
