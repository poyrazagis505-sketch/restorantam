// =========================================================
// MÜŞTERİ MENÜ SAYFASI MANTIĞI
// =========================================================

let expandedCardEl = null;
let cardObserver = null;
let sectionObserver = null;

const FONT_MAP = {
  cormorant: "'Cormorant Garamond', serif",
  playfair: "'Playfair Display', serif",
  'dm-serif': "'DM Serif Display', serif",
  poppins: "'Poppins', sans-serif",
  montserrat: "'Montserrat', sans-serif",
};

function setAdminLinkHref() {
  const path = window.location.pathname;
  const idx = path.indexOf('/restoran/');
  const rootPath = idx !== -1 ? path.slice(0, idx) : path.replace(/index\.html$/, '').replace(/\/$/, '');
  document.getElementById('admin-link').href = rootPath + '/admin.html';
}
setAdminLinkHref();

function getSlugFromUrl() {
  const qParam = new URLSearchParams(window.location.search).get('restoran');
  if (qParam) return qParam;

  const rawSearch = window.location.search;
  if (rawSearch[1] === '/') {
    const decodedPath = rawSearch.slice(1).split('&')[0];
    const rawParts = decodedPath.split('/').filter(Boolean);
    const rawIdx = rawParts.indexOf('restoran');
    if (rawIdx !== -1 && rawParts[rawIdx + 1]) return decodeURIComponent(rawParts[rawIdx + 1]);
  }

  const parts = window.location.pathname.split('/').filter(Boolean);
  const idx = parts.indexOf('restoran');
  if (idx !== -1 && parts[idx + 1]) return decodeURIComponent(parts[idx + 1]);

  return null;
}

function applyTheme(settings) {
  const root = document.documentElement;
  const appEl = document.getElementById('app');

  appEl.dataset.animation = (settings && settings.animation_style) || 'fade';

  if (!settings) return;

  if (settings.primary_color) root.style.setProperty('--color-primary', settings.primary_color);
  if (settings.background_color) root.style.setProperty('--color-background', settings.background_color);
  if (settings.card_background_color) root.style.setProperty('--color-card-background', settings.card_background_color);
  if (settings.heading_color) root.style.setProperty('--color-heading', settings.heading_color);
  if (settings.description_color) root.style.setProperty('--color-description', settings.description_color);
  if (settings.button_color) root.style.setProperty('--color-button', settings.button_color);

  if (settings.card_style === 'square') root.style.setProperty('--radius', '2px');
  else if (settings.card_style === 'shadow') root.style.setProperty('--radius', '14px');
  else root.style.setProperty('--radius', '10px');

  root.style.setProperty('--font-display', FONT_MAP[settings.site_font] || FONT_MAP.cormorant);

  if (settings.tag_background_color) root.style.setProperty('--tag-bg', settings.tag_background_color);
  if (settings.tag_text_color) root.style.setProperty('--tag-text', settings.tag_text_color);
  const tagRadius = settings.tag_shape === 'square' ? '2px' : settings.tag_shape === 'rounded' ? '6px' : '999px';
  root.style.setProperty('--tag-radius', tagRadius);
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
  const isMinimal = document.getElementById('app').dataset.animation === 'minimal';
  const delay = isMinimal ? 0 : 320;

  landing.classList.add('leaving');
  setTimeout(() => {
    landing.style.display = 'none';
    menuView.classList.add('active');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        menuView.classList.add('entered');
        setupCardObserver();
      });
    });
  }, delay);
}

function goToLanding() {
  const landing = document.getElementById('landing-view');
  const menuView = document.getElementById('menu-view');
  const isMinimal = document.getElementById('app').dataset.animation === 'minimal';
  const delay = isMinimal ? 0 : 320;

  menuView.classList.remove('entered');
  setTimeout(() => {
    menuView.classList.remove('active');
    landing.style.display = 'flex';
    landing.classList.remove('leaving');
  }, delay);
}

document.getElementById('open-menu-btn').addEventListener('click', goToMenu);
document.getElementById('back-to-landing-btn').addEventListener('click', goToLanding);

// ---------------------------------------------------------
// KART GİRİŞ ANİMASYONU (kaydırdıkça belirme)
// ---------------------------------------------------------

function setupCardObserver() {
  const isMinimal = document.getElementById('app').dataset.animation === 'minimal';
  if (cardObserver) cardObserver.disconnect();
  if (isMinimal) return;

  cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('card-enter');
        cardObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.product-card').forEach(card => cardObserver.observe(card));
}

// ---------------------------------------------------------
// KATEGORİYE KAYDIRMA + AKTİF SEKME TAKİBİ
// ---------------------------------------------------------

function scrollToCategory(categoryId) {
  const section = document.getElementById('cat-' + categoryId);
  if (!section) return;
  const isMinimal = document.getElementById('app').dataset.animation === 'minimal';
  section.scrollIntoView({ behavior: isMinimal ? 'auto' : 'smooth', block: 'start' });
}

function setupSectionObserver() {
  if (sectionObserver) sectionObserver.disconnect();

  sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const categoryId = entry.target.dataset.categoryId;
        document.querySelectorAll('.category-tab').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.categoryId === categoryId);
        });
      }
    });
  }, { rootMargin: '-90px 0px -70% 0px', threshold: 0 });

  document.querySelectorAll('.menu-category-section').forEach(sec => sectionObserver.observe(sec));
}

// ---------------------------------------------------------
// RENDER
// ---------------------------------------------------------

function renderMenu(restaurant, categories, products, tagsByProduct) {
  document.getElementById('landing-name').textContent = restaurant.name;
  document.getElementById('landing-subtitle').textContent = restaurant.menu_title || '';
  document.getElementById('menu-view-title').textContent = restaurant.name;

  const logoEl = document.getElementById('landing-logo');
  if (restaurant.logo_url) {
    logoEl.src = restaurant.logo_url;
    logoEl.style.display = 'block';
  }

  renderFooter(restaurant);

  const categoriesWithProducts = categories.filter(cat =>
    products.some(p => p.category_id === cat.id)
  );

  const tabsEl = document.getElementById('category-tabs');
  const sectionsEl = document.getElementById('menu-sections');
  tabsEl.innerHTML = '';
  sectionsEl.innerHTML = '';

  // --- Öne çıkanlar ---
  const featuredProducts = products.filter(p => p.is_featured);
  const featuredWrap = document.getElementById('featured-row-wrap');
  const featuredRow = document.getElementById('featured-row');
  featuredRow.innerHTML = '';
  if (featuredProducts.length > 0) {
    featuredProducts.forEach(p => {
      featuredRow.appendChild(buildProductCard(p, tagsByProduct[p.id] || [], true));
    });
    featuredWrap.style.display = 'block';
  } else {
    featuredWrap.style.display = 'none';
  }

  if (categoriesWithProducts.length === 0) {
    sectionsEl.innerHTML = '<div class="empty-category">Bu menüde henüz ürün bulunmuyor.</div>';
    showState('landing');
    return;
  }

  categoriesWithProducts.forEach((cat, index) => {
    const tabBtn = document.createElement('button');
    tabBtn.className = 'category-tab' + (index === 0 ? ' active' : '');
    tabBtn.textContent = cat.name;
    tabBtn.dataset.categoryId = cat.id;
    tabBtn.addEventListener('click', () => scrollToCategory(cat.id));
    tabsEl.appendChild(tabBtn);

    const section = document.createElement('section');
    section.className = 'menu-category-section';
    section.id = 'cat-' + cat.id;
    section.dataset.categoryId = cat.id;

    const heading = document.createElement('h2');
    heading.className = 'menu-category-heading';
    heading.textContent = cat.name;
    section.appendChild(heading);

    const grid = document.createElement('div');
    grid.className = 'product-grid';

    products
      .filter(p => p.category_id === cat.id)
      .forEach(p => grid.appendChild(buildProductCard(p, tagsByProduct[p.id] || [], false)));

    section.appendChild(grid);
    sectionsEl.appendChild(section);
  });

  showState('landing');
  setupSectionObserver();
}

function buildProductCard(product, tags, isFeaturedCard) {
  const card = document.createElement('div');
  card.className = 'product-card' + (product.image_url ? '' : ' no-image');
  card.dataset.categoryId = product.category_id || '';

  const tagsHtml = tags.length
    ? `<div class="product-tags-row">${tags.map(t => `<span class="product-tag-badge">${escapeHtml(t)}</span>`).join('')}</div>`
    : '';

  const featuredBadgeHtml = isFeaturedCard
    ? `<span class="featured-badge">${escapeHtml(product.featured_label || 'Öne Çıkan')}</span>`
    : '';

  card.innerHTML = `
    ${featuredBadgeHtml}
    ${product.image_url ? `<img class="product-card-image" src="${escapeHtml(product.image_url)}" alt="">` : ''}
    <div class="product-card-body">
      ${tagsHtml}
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

document.getElementById('menu-sections').addEventListener('click', () => {
  if (expandedCardEl) {
    expandedCardEl.classList.remove('expanded');
    expandedCardEl = null;
  }
});

// ---------------------------------------------------------
// ALT BİLGİ (Instagram / Telefon / Serbest Metin)
// ---------------------------------------------------------

function renderFooter(restaurant) {
  const footerEl = document.getElementById('menu-footer');
  const hasInstagram = !!restaurant.instagram_url;
  const hasPhone = !!restaurant.phone_number;
  const hasText = !!restaurant.footer_text;

  if (!hasInstagram && !hasPhone && !hasText) {
    footerEl.style.display = 'none';
    return;
  }

  let linksHtml = '';
  if (hasInstagram) {
    const igUrl = restaurant.instagram_url.startsWith('http')
      ? restaurant.instagram_url
      : `https://instagram.com/${restaurant.instagram_url.replace(/^@/, '')}`;
    linksHtml += `<a class="menu-footer-link" href="${escapeHtml(igUrl)}" target="_blank" rel="noopener">Instagram</a>`;
  }
  if (hasPhone) {
    linksHtml += `<a class="menu-footer-link" href="tel:${escapeHtml(restaurant.phone_number)}">${escapeHtml(restaurant.phone_number)}</a>`;
  }

  footerEl.innerHTML = `
    ${linksHtml ? `<div class="menu-footer-links">${linksHtml}</div>` : ''}
    ${hasText ? `<p class="menu-footer-text">${escapeHtml(restaurant.footer_text)}</p>` : ''}
  `;
  footerEl.style.display = 'block';
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
    .select('id, name, slug, logo_url, menu_title, is_active, instagram_url, phone_number, footer_text')
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

  const productIds = (products || []).map(p => p.id);
  let productTagRows = [];
  if (productIds.length > 0) {
    const { data } = await supabaseClient
      .from('product_tags')
      .select('product_id, tags(name)')
      .in('product_id', productIds);
    productTagRows = data || [];
  }

  // product_id -> [etiket adları] eşlemesi oluştur
  const tagsByProduct = {};
  productTagRows.forEach(row => {
    if (!row.tags) return;
    if (!tagsByProduct[row.product_id]) tagsByProduct[row.product_id] = [];
    tagsByProduct[row.product_id].push(row.tags.name);
  });

  applyTheme(settings);
  renderMenu(restaurant, categories || [], products || [], tagsByProduct);
}

loadMenu();
