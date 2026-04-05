// ============================================================
// dashboard.js — Admin dashboard page logic
// ============================================================

let dashItems      = [];
let dashFiltered   = [];
let deleteTargetId = null;

async function initDashboard() {
  await loadDashItems();

  const catFilter = document.getElementById('catFilter');
  if (catFilter) {
    catFilter.innerHTML = '<option value="">All Categories</option>' +
      CATEGORIES.map(c => `<option value="${c.id}">${c.label}</option>`).join('');
    catFilter.addEventListener('change', dashFilter);
  }

  let searchTimer;
  const searchInput = document.getElementById('tableSearch');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(dashFilter, 250);
    });
  }
}

async function loadDashItems() {
  const tbody = document.getElementById('tableBody');
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:48px;">
      <div class="spinner" style="margin:0 auto;"></div>
    </td></tr>`;
  }

  try {
    const { data, error } = await supabaseClient
      .from('jewellery_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    dashItems    = data || [];
    dashFiltered = [...dashItems];
    renderStats();
    renderTable(dashFiltered);
  } catch (err) {
    console.error(err);
    showToast('Failed to load items: ' + err.message, 'error');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:48px;color:#dc3545;">
        Failed to load. Check Supabase config.
      </td></tr>`;
    }
  }
}

function renderStats() {
  const statsRow = document.getElementById('statsRow');
  if (!statsRow) return;

  const total      = dashItems.length;
  const extraStats = CATEGORIES.map(cat => {
    const count = dashItems.filter(i => i.category === cat.id).length;
    return `
      <div class="stat-card">
        <div class="stat-number">${count}</div>
        <div class="stat-label">${cat.icon} ${cat.label}</div>
      </div>`;
  }).join('');

  statsRow.innerHTML = `
    <div class="stat-card">
      <div class="stat-number">${total}</div>
      <div class="stat-label">Total Items</div>
    </div>
    ${extraStats}
  `;
}

function dashFilter() {
  const search = (document.getElementById('tableSearch')?.value || '').trim().toLowerCase();
  const cat    = document.getElementById('catFilter')?.value || '';

  dashFiltered = dashItems.filter(item => {
    const matchCat    = !cat    || item.category === cat;
    const matchSearch = !search ||
      item.name.toLowerCase().includes(search) ||
      item.unique_number.toLowerCase().includes(search);
    return matchCat && matchSearch;
  });

  renderTable(dashFiltered);
}

function renderTable(items) {
  const tbody = document.getElementById('tableBody');
  if (!tbody) return;

  if (items.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="7" style="text-align:center;padding:48px;color:#999;">
        No items found.
      </td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(item => {
    const cat         = CATEGORIES.find(c => c.id === item.category);
    const _placeholder = 'https://placehold.co/52x52/F5E6C8/8B6914?text=—';
    const _allUrls     = [item.image1_url, item.image2_url, item.image3_url].filter(Boolean);
    const imgSrc       = _allUrls.find(u => !(u.includes('drive.google.com/file/d/') && u.includes('/preview'))) || _placeholder;
    return `
      <tr>
        <td><img class="admin-table-img" src="${imgSrc}" alt="${escHtml(item.name)}" loading="lazy"></td>
        <td><strong style="color:var(--gold-dark)">${escHtml(item.unique_number)}</strong></td>
        <td>${escHtml(item.name)}</td>
        <td>${cat ? cat.icon + ' ' + cat.label : escHtml(item.category)}</td>
        <td>${item.gram_weight}g</td>
        <td>${formatDate(item.created_at)}</td>
        <td>
          <div class="table-actions">
            <a href="upload.html?edit=${item.id}" class="btn btn-outline btn-sm">Edit</a>
            <button class="btn btn-danger btn-sm" onclick="openDeleteModal('${item.id}', '${escHtml(item.name).replace(/'/g, "\\'")}')">Delete</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// ---- Delete Modal ----
function openDeleteModal(id, name) {
  deleteTargetId = id;
  document.getElementById('deleteModalBody').textContent =
    `Delete "${name}"? This will permanently remove the item and cannot be undone.`;
  document.getElementById('deleteModal').classList.add('open');
  document.getElementById('confirmDeleteBtn').onclick = confirmDelete;
}

function closeDeleteModal() {
  document.getElementById('deleteModal').classList.remove('open');
  deleteTargetId = null;
}

async function confirmDelete() {
  if (!deleteTargetId) return;

  const btn = document.getElementById('confirmDeleteBtn');
  btn.textContent = 'Deleting...';
  btn.disabled    = true;

  try {
    const { data: item } = await supabaseClient
      .from('jewellery_items')
      .select('image1_url, image2_url, image3_url')
      .eq('id', deleteTargetId)
      .single();

    const { error } = await supabaseClient
      .from('jewellery_items')
      .delete()
      .eq('id', deleteTargetId);

    if (error) throw error;

    if (item) {
      const paths = [item.image1_url, item.image2_url, item.image3_url]
        .filter(Boolean)
        .map(url => {
          const parts = url.split('/jewellery-images/');
          return parts.length > 1 ? parts[1] : null;
        })
        .filter(Boolean);
      if (paths.length) {
        await supabaseClient.storage.from('jewellery-images').remove(paths);
      }
    }

    showToast('Item deleted successfully.', 'success');
    closeDeleteModal();
    await loadDashItems();

  } catch (err) {
    console.error(err);
    showToast('Delete failed: ' + err.message, 'error');
    btn.textContent = 'Delete';
    btn.disabled    = false;
  }
}
