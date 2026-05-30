// ── State ─────────────────────────────────────────────────────────────────
let token = localStorage.getItem('fb_token') || null;
let user  = JSON.parse(localStorage.getItem('fb_user') || 'null');
let currentCat = 'all';

// ── API helper ────────────────────────────────────────────────────────────
async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch('/api' + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ── Toast ─────────────────────────────────────────────────────────────────
function toast(msg, type = '') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = 'toast' + (type ? ' ' + type : '');
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 3000);
}

// ── Navigation — goes to actual HTML files ────────────────────────────────
function showPage(name) {
  const pages = {
    'home':      '/landing.html',
    'browse':    '/browse.html',
    'login':     '/auth.html?page=login',
    'register':  '/auth.html?page=register',
    'orders':    '/order.html',
    'dashboard': '/farmerView.html',
  };
  if (pages[name]) window.location.href = pages[name];
}

// ── Nav — call this on every page ─────────────────────────────────────────
function updateNav() {
  const guest    = document.getElementById('nav-auth-guest');
  const loggedIn = document.getElementById('nav-auth-user');
  const dashLink = document.getElementById('nav-dashboard-link');
  const userName = document.getElementById('nav-user-name');

  if (user) {
    guest.classList.add('hidden');
    loggedIn.classList.remove('hidden');
    if (userName) userName.textContent = user.name.split(' ')[0];
    if (dashLink) dashLink.classList.toggle('hidden', user.role !== 'grower');
  } else {
    guest.classList.remove('hidden');
    loggedIn.classList.add('hidden');
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────
async function doLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');
  errEl.classList.add('hidden');
  try {
    const data = await api('POST', '/login', { email, password });
    token = data.token;
    user  = data.user;
    localStorage.setItem('fb_token', token);
    localStorage.setItem('fb_user', JSON.stringify(user));
    showPage(user.role === 'grower' ? 'dashboard' : 'browse');
  } catch (e) {
    errEl.textContent = e.message;
    errEl.classList.remove('hidden');
  }
}

async function doRegister() {
  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const role     = document.getElementById('reg-role').value;
  const errEl    = document.getElementById('register-error');
  errEl.classList.add('hidden');
  try {
    const data = await api('POST', '/register', { name, email, password, role });
    token = data.token;
    user  = data.user;
    localStorage.setItem('fb_token', token);
    localStorage.setItem('fb_user', JSON.stringify(user));
    showPage(user.role === 'grower' ? 'dashboard' : 'browse');
  } catch (e) {
    errEl.textContent = e.message;
    errEl.classList.remove('hidden');
  }
}

function logout() {
  token = null;
  user  = null;
  localStorage.removeItem('fb_token');
  localStorage.removeItem('fb_user');
  window.location.href = '/landing.html';
}

function setRole(role) {
  document.getElementById('reg-role').value = role;
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('role-btn-' + role).classList.add('active');
}

// ── auth.html — show login or register tab based on ?page= ───────────────
function initAuthPage() {
  const params = new URLSearchParams(window.location.search);
  const page   = params.get('page') || 'login';
  document.getElementById('page-login').classList.toggle('hidden', page !== 'login');
  document.getElementById('page-register').classList.toggle('hidden', page !== 'register');
}

// ── Browse ────────────────────────────────────────────────────────────────
async function loadListings(cat) {
  if (cat) currentCat = cat;
  const grid = document.getElementById('listings-grid');
  if (!grid) return;
  grid.innerHTML = '<div class="loading">Loading…</div>';
  try {
    const url = currentCat === 'all' ? '/listings' : '/listings?category=' + currentCat;
    const listings = await api('GET', url);
    if (!listings.length) {
      grid.innerHTML = '<div class="empty"><span class="e-icon">🌱</span><h3>Nothing here yet</h3><p>Check back soon.</p></div>';
      return;
    }
    grid.innerHTML = listings.map(l => `
      <div class="listing-card">
        <div class="listing-emoji">${l.emoji}</div>
        <div class="listing-body">
          <div class="listing-name">${l.title}</div>
          <div class="listing-grower">${l.grower}</div>
          <div class="listing-footer">
            <div class="listing-price">$${l.price.toFixed(2)} <span>/ ${l.unit}</span></div>
            ${user && user.role === 'buyer'
              ? `<button class="order-btn" onclick="placeOrder(${l.id}, '${l.title}')">+</button>`
              : ''}
          </div>
        </div>
      </div>
    `).join('');
  } catch (e) {
    grid.innerHTML = '<div class="empty"><span class="e-icon">⚠️</span><h3>Could not load</h3><p>' + e.message + '</p></div>';
  }
}

function filterCat(cat, btn) {
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  loadListings(cat);
}

async function placeOrder(listingId, title) {
  if (!user) { showPage('login'); return; }
  try {
    await api('POST', '/orders', { listing_id: listingId, quantity: 1 });
    toast('Order placed for ' + title + '! 🎉', 'success');
    loadListings();
  } catch (e) {
    toast(e.message, 'error');
  }
}

// ── Orders ────────────────────────────────────────────────────────────────
async function loadOrders() {
  const el = document.getElementById('orders-list');
  if (!el) return;
  el.innerHTML = '<div class="loading">Loading…</div>';
  try {
    const orders = await api('GET', '/orders');
    if (!orders.length) {
      el.innerHTML = '<div class="empty"><span class="e-icon">📦</span><h3>No orders yet</h3><p>Browse the harvest and place your first order.</p></div>';
      return;
    }
    el.innerHTML = orders.map(o => `
      <div class="order-row">
        <div class="order-emoji">${o.emoji}</div>
        <div class="order-info">
          <div class="order-title">${o.title}</div>
          <div class="order-meta">${o.grower} · qty ${o.quantity} · ${o.created_at}</div>
        </div>
        <span class="status-badge status-${o.status}">${o.status}</span>
        <div class="order-total">$${o.total.toFixed(2)}</div>
      </div>
    `).join('');
  } catch (e) {
    el.innerHTML = '<div class="empty"><span class="e-icon">⚠️</span><h3>Error</h3><p>' + e.message + '</p></div>';
  }
}

// ── Dashboard ─────────────────────────────────────────────────────────────
function loadDashboard() {
  if (!user) { showPage('login'); return; }
  const greeting = document.getElementById('dash-greeting');
  if (greeting) greeting.textContent = 'Welcome, ' + user.name.split(' ')[0] + ' 🌱';
  loadDashListings();
  loadDashOrders();
}

async function loadDashListings() {
  const el = document.getElementById('dash-listings');
  if (!el) return;
  try {
    const listings = await api('GET', '/listings');
    const mine = listings.filter(l => l.grower_id === user.id);
    if (!mine.length) {
      el.innerHTML = '<div class="empty"><span class="e-icon">🌱</span><h3>No listings yet</h3><p>Create your first listing above.</p></div>';
      return;
    }
    el.innerHTML = mine.map(l => `
      <div class="dash-listing-row">
        <div class="dl-emoji">${l.emoji}</div>
        <div class="dl-info">
          <div class="dl-name">${l.title}</div>
          <div class="dl-meta">$${l.price.toFixed(2)} / ${l.unit} · ${l.stock} in stock</div>
        </div>
        <div class="dl-actions">
          <button class="btn btn-danger btn-sm" onclick="deleteListing(${l.id})">Delete</button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    el.innerHTML = '<p style="color:#e85d5d">' + e.message + '</p>';
  }
}

async function loadDashOrders() {
  const el = document.getElementById('dash-orders');
  if (!el) return;
  try {
    const orders = await api('GET', '/orders');
    if (!orders.length) {
      el.innerHTML = '<div class="empty"><span class="e-icon">📦</span><h3>No orders yet</h3></div>';
      return;
    }
    el.innerHTML = orders.map(o => `
      <div class="order-row">
        <div class="order-emoji">${o.emoji}</div>
        <div class="order-info">
          <div class="order-title">${o.title}</div>
          <div class="order-meta">from ${o.buyer_name} · qty ${o.quantity} · ${o.created_at}</div>
        </div>
        <select class="status-select" onchange="updateOrderStatus(${o.id}, this.value)">
          <option value="pending"   ${o.status==='pending'   ?'selected':''}>Pending</option>
          <option value="confirmed" ${o.status==='confirmed' ?'selected':''}>Confirmed</option>
          <option value="delivered" ${o.status==='delivered' ?'selected':''}>Delivered</option>
          <option value="cancelled" ${o.status==='cancelled' ?'selected':''}>Cancelled</option>
        </select>
        <div class="order-total">$${o.total.toFixed(2)}</div>
      </div>
    `).join('');
  } catch (e) {
    el.innerHTML = '<p style="color:#e85d5d">' + e.message + '</p>';
  }
}

async function deleteListing(id) {
  if (!confirm('Delete this listing?')) return;
  try {
    await api('DELETE', '/listings/' + id);
    toast('Listing deleted.', 'success');
    loadDashListings();
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function createListing() {
  const body = {
    emoji:    document.getElementById('nl-emoji').value,
    title:    document.getElementById('nl-title').value.trim(),
    category: document.getElementById('nl-category').value,
    price:    document.getElementById('nl-price').value,
    unit:     document.getElementById('nl-unit').value,
    stock:    document.getElementById('nl-stock').value,
  };
  const errEl = document.getElementById('listing-error');
  errEl.classList.add('hidden');
  try {
    await api('POST', '/listings', body);
    toast('Listing created!', 'success');
    toggleNewListingForm();
    loadDashListings();
  } catch (e) {
    errEl.textContent = e.message;
    errEl.classList.remove('hidden');
  }
}

async function updateOrderStatus(orderId, status) {
  try {
    await api('PATCH', '/orders/' + orderId + '/status', { status });
    toast('Status updated to ' + status, 'success');
  } catch (e) {
    toast(e.message, 'error');
  }
}

function toggleNewListingForm() {
  document.getElementById('new-listing-form').classList.toggle('hidden');
}

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.getElementById('dash-listings').classList.toggle('hidden', tab !== 'listings');
  document.getElementById('dash-orders').classList.toggle('hidden', tab !== 'orders');
}
