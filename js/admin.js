// =========================================================
// ADMİN PANELİ MANTIĞI
// =========================================================

let currentRestaurantId = null;
let currentCategories = [];
let currentProducts = [];
let editingProductId = null;

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

function showView(view) {
  document.getElementById('login-view').style.display = view === 'login' ? 'block' : 'none';
  document.getElementById('dashboard-view').style.display = view === 'dashboard' ? 'block' : 'none';
}

// ---------------------------------------------------------
// GİRİŞ / OTURUM
// ---------------------------------------------------------

async function checkSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    await initDashboard();
  } else {
    showView('login');
  }
}

document.getElementById('login-btn').addEventListener('click', async () => {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  errorEl.style.display = 'none';

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    errorEl.textContent = 'Giriş başarısız: e-posta veya şifre hatalı.';
    errorEl.style.display = 'block';
    return;
  }
  await initDashboard();
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  window.location.reload();
});

async function initDashboard() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) { showView('login'); return; }

  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile || !profile.restaurant_id) {
    document.getElementById('login-error').textContent =
      'Bu hesaba bağlı bir restoran bulunamadı. Lütfen sistem sağlayıcınızla iletişime geçin.';
    document.getElementById('login-error').style.display = 'block';
    showView('login');
    return;
  }

  currentRestaurantId = profile.restaurant_id;

  const { data: restaurant } = await supabaseClient
    .from('restaurants')
    .select('name, slug')
    .eq('id', currentRestaurantId)
    .maybeSingle();

  document.getElementById('dashboard-restaurant-name').textContent = restaurant ? restaurant.name : 'Panel';
  document.getElementById('view-menu-link').href = restaurant ? `index.html?restoran=${encodeURIComponent(restaurant.slug)}` : '#';

  showView('dashboard');
  await Promise.all([loadCategories(), loadProducts(), loadSettings()]);
}

// ---------------------------------------------------------
// TAB GEÇİŞLERİ
// ---------------------------------------------------------
document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.panel).classList.add('active');
  });
});

// ---------------------------------------------------------
// KATEGORİLER
// ---------------------------------------------------------

async function loadCategories() {
  const { data, error } = await supabaseClient
    .from('categories')
    .select('*')
    .eq('restaurant_id', currentRestaurantId)
    .order('sort_order');

  if (error) { showToast('Kategoriler yüklenemedi.'); return; }
  currentCategories = data || [];
  renderCategories();
  renderProductCategoryOptions();
}

function renderCategories() {
  const listEl = document.getElementById('categories-list');
  listEl.innerHTML = '';

  currentCategories.forEach((cat, index) => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <div class="list-item-main">
        <input type="text" value="${escapeAttr(cat.name)}" data-id="${cat.id}" class="category-name-input" style="border:none; background:none; font-weight:600; font-size:14.5px; width:100%; padding:4px 0;">
      </div>
      <div class="list-item-actions">
        <button class="btn btn-small" data-action="up" data-id="${cat.id}" ${index === 0 ? 'disabled' : ''}>↑</button>
        <button class="btn btn-small" data-action="down" data-id="${cat.id}" ${index === currentCategories.length - 1 ? 'disabled' : ''}>↓</button>
        <button class="btn btn-small btn-danger" data-action="delete" data-id="${cat.id}">Sil</button>
      </div>
    `;
    listEl.appendChild(item);
  });

  listEl.querySelectorAll('.category-name-input').forEach(input => {
    input.addEventListener('change', () => updateCategoryName(input.dataset.id, input.value));
  });
  listEl.querySelectorAll('[data-action="up"]').forEach(btn => {
    btn.addEventListener('click', () => moveCategory(btn.dataset.id, -1));
  });
  listEl.querySelectorAll('[data-action="down"]').forEach(btn => {
    btn.addEventListener('click', () => moveCategory(btn.dataset.id, 1));
  });
  listEl.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => deleteCategory(btn.dataset.id));
  });
}

document.getElementById('add-category-btn').addEventListener('click', async () => {
  const input = document.getElementById('new-category-name');
  const name = input.value.trim();
  if (!name) return;

  const nextOrder = currentCategories.length;
  const { error } = await supabaseClient.from('categories').insert({
    restaurant_id: currentRestaurantId,
    name,
    sort_order: nextOrder,
  });

  if (error) { showToast('Kategori eklenemedi.'); return; }
  input.value = '';
  showToast('Kategori eklendi.');
  await loadCategories();
});

async function updateCategoryName(id, name) {
  if (!name.trim()) return;
  const { error } = await supabaseClient.from('categories').update({ name: name.trim() }).eq('id', id);
  if (error) { showToast('Güncellenemedi.'); return; }
  showToast('Kategori güncellendi.');
  await loadCategories();
}

async function moveCategory(id, direction) {
  const index = currentCategories.findIndex(c => c.id === id);
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= currentCategories.length) return;

  const current = currentCategories[index];
  const target = currentCategories[targetIndex];

  await Promise.all([
    supabaseClient.from('categories').update({ sort_order: target.sort_order }).eq('id', current.id),
    supabaseClient.from('categories').update({ sort_order: current.sort_order }).eq('id', target.id),
  ]);

  await loadCategories();
}

async function deleteCategory(id) {
  if (!confirm('Bu kategoriyi silmek istediğine emin misin? İçindeki ürünler kategorisiz kalır.')) return;
  const { error } = await supabaseClient.from('categories').delete().eq('id', id);
  if (error) { showToast('Silinemedi.'); return; }
  showToast('Kategori silindi.');
  await loadCategories();
  await loadProducts();
}

// ---------------------------------------------------------
// ÜRÜNLER
// ---------------------------------------------------------

function renderProductCategoryOptions() {
  const select = document.getElementById('product-category');
  select.innerHTML = currentCategories.map(c => `<option value="${c.id}">${escapeHtmlAdmin(c.name)}</option>`).join('');
}

async function loadProducts() {
  const { data, error } = await supabaseClient
    .from('products')
    .select('*')
    .eq('restaurant_id', currentRestaurantId)
    .order('sort_order');

  if (error) { showToast('Ürünler yüklenemedi.'); return; }
  currentProducts = data || [];
  renderProducts();
}

function renderProducts() {
  const listEl = document.getElementById('products-list');
  listEl.innerHTML = '';

  currentProducts.forEach(p => {
    const cat = currentCategories.find(c => c.id === p.category_id);
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      ${p.image_url ? `<img class="list-item-thumb" src="${escapeAttr(p.image_url)}">` : ''}
      <div class="list-item-main">
        <div class="list-item-title">${escapeHtmlAdmin(p.name)} ${p.is_active ? '' : '<span style="color:#B3261E;">(pasif)</span>'}</div>
        <div class="list-item-sub">${cat ? escapeHtmlAdmin(cat.name) : 'Kategori yok'} · ${Number(p.price).toFixed(2)} ₺</div>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-small" data-action="edit" data-id="${p.id}">Düzenle</button>
        <button class="btn btn-small btn-danger" data-action="delete" data-id="${p.id}">Sil</button>
      </div>
    `;
    listEl.appendChild(item);
  });

  listEl.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', () => startEditProduct(btn.dataset.id));
  });
  listEl.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
  });
}

function startEditProduct(id) {
  const p = currentProducts.find(x => x.id === id);
  if (!p) return;
  editingProductId = id;

  document.getElementById('product-form-title').textContent = 'Ürünü Düzenle';
  document.getElementById('product-name').value = p.name;
  document.getElementById('product-description').value = p.description || '';
  document.getElementById('product-price').value = p.price;
  document.getElementById('product-category').value = p.category_id || '';
  document.getElementById('product-active').checked = p.is_active;
  document.getElementById('cancel-product-edit-btn').style.display = 'inline-block';

  const preview = document.getElementById('product-image-preview');
  if (p.image_url) {
    preview.src = p.image_url;
    preview.style.display = 'block';
  } else {
    preview.style.display = 'none';
  }

  document.querySelector('[data-panel="panel-products"]').click();
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

document.getElementById('cancel-product-edit-btn').addEventListener('click', resetProductForm);

function resetProductForm() {
  editingProductId = null;
  document.getElementById('product-form-title').textContent = 'Yeni Ürün';
  document.getElementById('product-name').value = '';
  document.getElementById('product-description').value = '';
  document.getElementById('product-price').value = '';
  document.getElementById('product-active').checked = true;
  document.getElementById('product-image').value = '';
  document.getElementById('product-image-preview').style.display = 'none';
  document.getElementById('cancel-product-edit-btn').style.display = 'none';
  document.getElementById('product-error').style.display = 'none';
}

document.getElementById('save-product-btn').addEventListener('click', async () => {
  const errorEl = document.getElementById('product-error');
  errorEl.style.display = 'none';

  const name = document.getElementById('product-name').value.trim();
  const description = document.getElementById('product-description').value.trim();
  const price = parseFloat(document.getElementById('product-price').value);
  const categoryId = document.getElementById('product-category').value || null;
  const isActive = document.getElementById('product-active').checked;
  const fileInput = document.getElementById('product-image');

  if (!name || isNaN(price)) {
    errorEl.textContent = 'Ürün adı ve fiyat zorunludur.';
    errorEl.style.display = 'block';
    return;
  }

  let imageUrl = editingProductId ? (currentProducts.find(p => p.id === editingProductId) || {}).image_url : null;

  try {
    if (fileInput.files && fileInput.files[0]) {
      imageUrl = await uploadImageToStorage(fileInput.files[0], `${currentRestaurantId}/products`);
    }
  } catch (e) {
    errorEl.textContent = 'Fotoğraf yüklenemedi: ' + e.message;
    errorEl.style.display = 'block';
    return;
  }

  const payload = {
    restaurant_id: currentRestaurantId,
    name,
    description,
    price,
    category_id: categoryId,
    is_active: isActive,
    image_url: imageUrl,
  };

  let error;
  if (editingProductId) {
    ({ error } = await supabaseClient.from('products').update(payload).eq('id', editingProductId));
  } else {
    payload.sort_order = currentProducts.filter(p => p.category_id === categoryId).length;
    ({ error } = await supabaseClient.from('products').insert(payload));
  }

  if (error) {
    errorEl.textContent = 'Kaydedilemedi: ' + error.message;
    errorEl.style.display = 'block';
    return;
  }

  showToast('Ürün kaydedildi.');
  resetProductForm();
  await loadProducts();
});

async function deleteProduct(id) {
  if (!confirm('Bu ürünü silmek istediğine emin misin?')) return;
  const { error } = await supabaseClient.from('products').delete().eq('id', id);
  if (error) { showToast('Silinemedi.'); return; }
  showToast('Ürün silindi.');
  await loadProducts();
}

// ---------------------------------------------------------
// TASARIM AYARLARI
// ---------------------------------------------------------

async function loadSettings() {
  const { data: settings } = await supabaseClient
    .from('restaurant_settings')
    .select('*')
    .eq('restaurant_id', currentRestaurantId)
    .maybeSingle();

  const { data: restaurant } = await supabaseClient
    .from('restaurants')
    .select('menu_title, logo_url')
    .eq('id', currentRestaurantId)
    .maybeSingle();

  if (settings) {
    document.getElementById('color-primary').value = settings.primary_color || '#3B5D42';
    document.getElementById('color-background').value = settings.background_color || '#F7F5F1';
    document.getElementById('color-text').value = settings.text_color || '#2B2A28';
    document.getElementById('color-button').value = settings.button_color || '#3B5D42';
    document.getElementById('card-style').value = settings.card_style || 'rounded';
  }

  if (restaurant) {
    document.getElementById('menu-title-input').value = restaurant.menu_title || '';
    if (restaurant.logo_url) {
      const preview = document.getElementById('logo-image-preview');
      preview.src = restaurant.logo_url;
      preview.style.display = 'block';
    }
  }
}

document.getElementById('save-design-btn').addEventListener('click', async () => {
  const errorEl = document.getElementById('design-error');
  errorEl.style.display = 'none';

  const settingsPayload = {
    restaurant_id: currentRestaurantId,
    primary_color: document.getElementById('color-primary').value,
    background_color: document.getElementById('color-background').value,
    text_color: document.getElementById('color-text').value,
    button_color: document.getElementById('color-button').value,
    card_style: document.getElementById('card-style').value,
  };

  const { error: settingsError } = await supabaseClient
    .from('restaurant_settings')
    .upsert(settingsPayload, { onConflict: 'restaurant_id' });

  const restaurantPayload = {
    menu_title: document.getElementById('menu-title-input').value.trim(),
  };

  const logoInput = document.getElementById('logo-image');
  try {
    if (logoInput.files && logoInput.files[0]) {
      restaurantPayload.logo_url = await uploadImageToStorage(logoInput.files[0], `${currentRestaurantId}/logo`);
    }
  } catch (e) {
    errorEl.textContent = 'Logo yüklenemedi: ' + e.message;
    errorEl.style.display = 'block';
    return;
  }

  const { error: restaurantError } = await supabaseClient
    .from('restaurants')
    .update(restaurantPayload)
    .eq('id', currentRestaurantId);

  if (settingsError || restaurantError) {
    errorEl.textContent = 'Kaydedilemedi.';
    errorEl.style.display = 'block';
    return;
  }

  showToast('Tasarım kaydedildi.');
});

// ---------------------------------------------------------
// YARDIMCI FONKSİYONLAR
// ---------------------------------------------------------

function escapeHtmlAdmin(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return (str || '').replace(/"/g, '&quot;');
}

checkSession();
