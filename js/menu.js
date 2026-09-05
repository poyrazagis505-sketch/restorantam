// =========================================================
// MÜŞTERİ MENÜ SAYFASI MANTIĞI
// =========================================================

let expandedCardEl = null;

function getSlugFromUrl() {
  const qParam = new URLSearchParams(window.location.search).get('restoran');
  if (qParam) return qParam;

  const parts = window.location.pathname.split('/').filter(Boolean);
  const idx = parts.indexOf('restoran');
  if (idx !== -1 && parts[idx + 1]) return decodeURIComponent(parts[idx + 1]);

  return null;
}

function applyTheme(settings) {
  if (!settings) return;
  const root = document.documentElement;
  if (settings.primary_color) root.style.setProperty('--color-primary', settings.primary_color);
  if (settings.background_color) root.style.setProperty('--color-background', settings.background_color);
  if (settings.text_color) root.style.setProperty('--color-text', settings.text_color);
  if (settings.button_color) root.style.setProperty('--color-button', settings.button_color);

  if (settings.card_style === 'square') root.style.setProperty('--radius', '2px');
  else if (settings.card_style === 'shadow') root.style.setProperty('--radius', '14px');
  else root.style.setProperty('--radius', '10px');
}

function showState(state) {
  document.getElementById('loading-state').style.display = state === 'loading' ? 'flex' : 'none';
  document.getElementById('not-found-state').style.display = state === 'not-found' ? 'flex' : 'none';
  document.getElementById('landing-view').style.display = state === 'landing' || state === 'menu' ? 'flex' : 'none';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : str;
  return div.innerHTML;
}

function formatPrice(price) {
  const num = Number(price || 0);
  return num.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
}

// ---------------------------------------------------------
// KARŞILAMA <-> MENÜ GEÇİŞİ
// ---------------------------------------------------------

function goToMenu() {
  const landing = document.getElementById('landing-view');
  const menuView = document.getElementById('menu-view');

  landing.classList.add('leaving');
  setTimeout(() => {
    landing.style.display = 'none';
    menuView.classList.add('active');
    // Bir sonraki frame'de "entered" class'ını ekleyerek transition'ı tetikle
    requestAnimationFrame(() => {
      requestAnimationFrame(() => menuView.classList.add('entered'));
    });
  }, 300);
}

function goToLanding() {
  const landing = document.getElementById('landing-view');
  const menuView = document.getElementById('menu-view');

  menuView.classList.remove('entered');
  setTimeout(() => {
    menuView.classList.remove('active');
    landing.style.display = 'flex';
    landing.classList.remove('leaving');
  }, 300);
}

document.getElementById('open-menu-btn').addEventListener('click', goToMenu);
document.getElementById('back-to-landing-btn').addEventListener('click', goToLanding);

// ---------------------------------------------------------
// RENDER
// ---------------------------------------------------------

function renderMenu(restaurant, categories, products) {
  document.getElementById('landing-name').textContent = restaurant.name;
  document.getElementById('landing-subtitle').textContent = restaurant.menu_title || '';
  document.getElementById('menu-view-title').textContent = restaurant.name;

  const logoEl = document.getElementById('landing-logo');
  if (restaurant.logo_url) {
    logoEl.src = restaurant.logo_url;
    logoEl.style.display = 'block';
  }

  const categoriesWithProducts = categories.filter(cat =>
    products.some(p => p.category_id === cat.id)
  );

  const tabsEl = document.getElementById('category-tabs');
  const gridEl = document.getElementById('product-grid');
  tabsEl.innerHTML = '';
  gridEl.innerHTML = '';

  if (categoriesWithProducts.length === 0) {
    gridEl.innerHTML = '<div class="empty-category">Bu menüde henüz ürün bulunmuyor.</div>';
    showState('landing');
    return;
  }

  categoriesWithProducts.forEach((cat, index) => {
    const tabBtn = document.createElement('button');
    tabBtn.className = 'category-tab' + (index === 0 ? ' active' : '');
    tabBtn.textContent = cat.name;
    tabBtn.dataset.categoryId = cat.id;
    tabBtn.addEventListener('click', () => selectCategory(cat.id));
    tabsEl.appendChild(tabBtn);
  });

  products.forEach(p => {
    const cat = categoriesWithProducts.find(c => c.id === p.category_id);
    if (!cat) return; // kategorisi olmayan veya kategorisi hiç ürünü olmayan bir gruba ait değil
    const card = buildProductCard(p);
    if (cat.id !== categoriesWithProducts[0].id) {
      card.classList.add('hidden-category');
    }
    gridEl.appendChild(card);
  });

  showState('landing');
}

function buildProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card' + (product.image_url ? '' : ' no-image');
  card.dataset.categoryId = product.category_id || '';

  card.innerHTML = `
    ${product.image_url ? `<img class="product-card-image" src="${escapeHtml(product.image_url)}" alt="">` : ''}
    <div class="product-card-body">
      <div class="product-card-name">${escapeHtml(product.name)}</div>
      <div class="product-card-details">
        ${product.description ? `<p class="product-card-description">${escapeHtml(product.description)}</p>` : ''}
        <div class="product-card-price">${formatPrice(product.price)}</div>
      </div>
    </div>
  `;

  card.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleCard(card);
  });

  return card;
}

function toggleCard(card) {
  if (expandedCardEl === card) {
    card.classList.remove('expanded');
    expandedCardEl = null;
    return;
  }
  if (expandedCardEl) {
    expandedCardEl.classList.remove('expanded');
  }
  card.classList.add('expanded');
  expandedCardEl = card;
}

// Menü dışında bir yere (boşluğa) tıklanınca açık kartı kapat
document.getElementById('product-grid').addEventListener('click', () => {
  if (expandedCardEl) {
    expandedCardEl.classList.remove('expanded');
    expandedCardEl = null;
  }
});

function selectCategory(categoryId) {
  document.querySelectorAll('.category-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.categoryId === categoryId);
  });
  document.querySelectorAll('.product-card').forEach(card => {
    const matches = card.dataset.categoryId === categoryId;
    card.classList.toggle('hidden-category', !matches);
    if (!matches && card === expandedCardEl) {
      card.classList.remove('expanded');
      expandedCardEl = null;
    }
  });
}

// ---------------------------------------------------------
// VERİ YÜKLEME
// ---------------------------------------------------------

async function loadMenu() {
  const slug = getSlugFromUrl();

  if (!slug) {
    showState('not-found');
    document.getElementById('not-found-state').textContent =
      'Bu bir QR menü platformudur. Bir restoranın menüsünü görüntülemek için restorana ait QR kodu okutun.';
    return;
  }

  const { data: restaurant, error: restaurantError } = await supabaseClient
    .from('restaurants')
    .select('id, name, slug, logo_url, menu_title, is_active')
    .eq('slug', slug)
    .maybeSingle();

  if (restaurantError || !restaurant) {
    showState('not-found');
    document.getElementById('not-found-state').textContent = 'Bu menü şu anda görüntülenemiyor.';
    return;
  }

  const [{ data: settings }, { data: categories }, { data: products }] = await Promise.all([
    supabaseClient.from('restaurant_settings').select('*').eq('restaurant_id', restaurant.id).maybeSingle(),
    supabaseClient.from('categories').select('*').eq('restaurant_id', restaurant.id).order('sort_order'),
    supabaseClient.from('products').select('*').eq('restaurant_id', restaurant.id).eq('is_active', true).order('sort_order'),
  ]);

  applyTheme(settings);
  renderMenu(restaurant, categories || [], products || []);
}

loadMenu();
