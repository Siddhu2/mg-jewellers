// Category and subcategory management for the admin panel.

async function initCategoriesPage() {
  document.getElementById('categoryForm').addEventListener('submit', addCategory);
  document.getElementById('subcategoryForm').addEventListener('submit', addSubcategory);
  renderCategoryManager();
}

function categorySlug(label) {
  return label.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function addCategory(event) {
  event.preventDefault();
  const label = document.getElementById('categoryName').value.trim();
  const id = categorySlug(label);
  if (!id) return showToast('Enter a category name containing letters or numbers.', 'error');
  const { error } = await supabaseClient.from('categories').insert({
    id,
    label,
    icon: document.getElementById('categoryIcon').value.trim() || '💎',
    description: document.getElementById('categoryDescription').value.trim(),
    sort_order: CATEGORIES.length + 1,
  });
  if (error) return showToast(error.code === '23505' ? 'That category name or URL slug is already in use.' : error.message, 'error');
  event.target.reset();
  document.getElementById('categoryIcon').value = '💎';
  await refreshTaxonomy();
  showToast('Category added.', 'success');
}

async function addSubcategory(event) {
  event.preventDefault();
  const categoryId = document.getElementById('parentCategory').value;
  const label = document.getElementById('subcategoryName').value.trim();
  const { error } = await supabaseClient.from('subcategories').insert({
    category_id: categoryId,
    label,
    sort_order: SUBCATEGORIES.filter(sub => sub.category_id === categoryId).length + 1,
  });
  if (error) return showToast(error.code === '23505' ? 'That subcategory already exists under this category.' : error.message, 'error');
  event.target.reset();
  await refreshTaxonomy();
  showToast('Subcategory added.', 'success');
}

async function refreshTaxonomy() {
  await loadCatalogTaxonomy();
  buildSidebarCats();
  renderCategoryManager();
}

function renderCategoryManager() {
  const parent = document.getElementById('parentCategory');
  const list = document.getElementById('categoryList');
  if (parent) parent.innerHTML = CATEGORIES.map(cat => `<option value="${escHtml(cat.id)}">${escHtml(cat.icon || '')} ${escHtml(cat.label)}</option>`).join('');
  if (!list) return;
  if (!CATEGORIES.length) {
    list.innerHTML = '<p>No categories yet. Add one above.</p>';
    return;
  }
  list.innerHTML = CATEGORIES.map(cat => {
    const children = SUBCATEGORIES.filter(sub => sub.category_id === cat.id);
    return `<section class="managed-category">
      <div class="managed-category-heading"><div><strong>${escHtml(cat.icon || '💎')} ${escHtml(cat.label)}</strong><div class="form-hint">${escHtml(cat.id)}${cat.description ? ` · ${escHtml(cat.description)}` : ''}</div></div>
      <button type="button" class="btn btn-danger btn-sm" onclick="deleteCategory('${escHtml(cat.id)}')">Delete</button></div>
      ${children.length ? `<ul class="managed-subcategories">${children.map(sub => `<li><span>${escHtml(sub.label)}</span><button type="button" class="btn btn-outline btn-sm" data-delete-subcategory="${sub.id}" data-subcategory-label="${escHtml(sub.label)}">Remove</button></li>`).join('')}</ul>` : '<p class="form-hint">No subcategories. Products can stay in this category without one.</p>'}
    </section>`;
  }).join('');
  list.querySelectorAll('[data-delete-subcategory]').forEach(button => button.addEventListener('click', () =>
    deleteSubcategory(button.dataset.deleteSubcategory, button.dataset.subcategoryLabel)));
}

async function deleteCategory(id) {
  const { count, error: countError } = await supabaseClient.from('jewellery_items').select('id', { count: 'exact', head: true }).eq('category', id);
  if (countError) return showToast(countError.message, 'error');
  if (count) return showToast('This category has products. Move those products to another category before deleting it.', 'error');
  if (!window.confirm('Delete this category and its subcategories?')) return;
  const { error } = await supabaseClient.from('categories').delete().eq('id', id);
  if (error) return showToast(error.message, 'error');
  await refreshTaxonomy();
  showToast('Category deleted.', 'success');
}

async function deleteSubcategory(id, label) {
  if (!window.confirm(`Remove subcategory “${label}”? Products assigned to it will remain in their parent category with no subcategory.`)) return;
  const { error } = await supabaseClient.from('subcategories').delete().eq('id', id);
  if (error) return showToast(error.message, 'error');
  await refreshTaxonomy();
  showToast('Subcategory removed.', 'success');
}
