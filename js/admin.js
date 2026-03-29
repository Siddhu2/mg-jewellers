// ============================================================
// admin.js — Shared admin utilities (auth guard, sidebar, toast)
// ============================================================

let currentUser = null;

// ---- Auth guard — runs immediately ----
(async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'index.html';
    return;
  }

  currentUser = session.user;

  const emailEl = document.getElementById('userEmail');
  if (emailEl) emailEl.textContent = currentUser.email;

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await supabaseClient.auth.signOut();
      window.location.href = 'index.html';
    });
  }

  buildSidebarCats();

  // Call page-specific init — these are defined in dashboard.js / upload.js
  // which are loaded BEFORE this file in each HTML page
  if (typeof initDashboard  === 'function') initDashboard();
  if (typeof initUploadPage === 'function') initUploadPage();
})();

// ---- Sidebar category links ----
function buildSidebarCats() {
  const el = document.getElementById('sidebarCats');
  if (!el) return;
  el.innerHTML = CATEGORIES.map(cat => `
    <a href="../category.html?cat=${cat.id}" target="_blank" class="sidebar-link">
      <span class="sidebar-link-icon">${cat.icon}</span> ${cat.label}
    </a>
  `).join('');
}

// ---- Toast notifications ----
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className  = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'all 0.3s ease';
    toast.style.opacity    = '0';
    toast.style.transform  = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ---- Escape HTML ----
function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

// ---- Format date ----
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
