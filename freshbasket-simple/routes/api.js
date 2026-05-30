const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../config/data');
const protect = require('../config/auth');

const SECRET = process.env.JWT_SECRET || 'freshbasket_dev_secret';
const sign = u => jwt.sign({ id: u.id, name: u.name, role: u.role }, SECRET, { expiresIn: '7d' });

// ── Auth ────────────────────────────────────────────────────────────────────

// POST /api/register
router.post('/register', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  if (db.users.find(u => u.email === email)) return res.status(409).json({ error: 'Email already registered' });
  const user = { id: db.nextUserId++, name, email, password: bcrypt.hashSync(password, 8), role: role || 'buyer' };
  db.users.push(user);
  res.json({ token: sign(user), user: { id: user.id, name: user.name, role: user.role } });
});

// POST /api/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find(u => u.email === email);
  if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ token: sign(user), user: { id: user.id, name: user.name, role: user.role } });
});

// ── Listings ────────────────────────────────────────────────────────────────

// GET /api/listings
router.get('/listings', (req, res) => {
  let items = db.listings;
  if (req.query.category) items = items.filter(l => l.category === req.query.category);
  res.json(items);
});

// POST /api/listings  (grower only)
router.post('/listings', protect, (req, res) => {
  if (req.user.role !== 'grower') return res.status(403).json({ error: 'Growers only' });
  const { title, emoji, price, unit, category, stock } = req.body;
  if (!title || !price) return res.status(400).json({ error: 'Title and price required' });
  const grower = db.users.find(u => u.id === req.user.id);
  const listing = {
    id: db.listings.length + 1,
    grower_id: req.user.id,
    grower: grower?.name || 'My Farm',
    title, emoji: emoji || '🌱',
    price: parseFloat(price),
    unit: unit || 'kg',
    category: category || 'vegetables',
    stock: parseInt(stock) || 0,
  };
  db.listings.push(listing);
  res.status(201).json(listing);
});

// DELETE /api/listings/:id  (grower only, own listing)
router.delete('/listings/:id', protect, (req, res) => {
  const id = parseInt(req.params.id);
  const idx = db.listings.findIndex(l => l.id === id && l.grower_id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.listings.splice(idx, 1);
  res.json({ message: 'Deleted' });
});

// ── Orders ──────────────────────────────────────────────────────────────────

// POST /api/orders  (buyer places order)
router.post('/orders', protect, (req, res) => {
  const { listing_id, quantity } = req.body;
  const listing = db.listings.find(l => l.id === parseInt(listing_id));
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.stock < quantity) return res.status(400).json({ error: 'Not enough stock' });

  listing.stock -= quantity;
  const order = {
    id: db.nextOrderId++,
    buyer_id: req.user.id,
    buyer_name: req.user.name,
    listing_id: listing.id,
    title: listing.title,
    emoji: listing.emoji,
    grower: listing.grower,
    quantity: parseInt(quantity),
    total: parseFloat((listing.price * quantity).toFixed(2)),
    status: 'pending',
    created_at: new Date().toLocaleString('en-AU'),
  };
  db.orders.push(order);
  res.status(201).json(order);
});

// GET /api/orders  (buyer sees own, grower sees orders for their listings)
router.get('/orders', protect, (req, res) => {
  let orders;
  if (req.user.role === 'buyer') {
    orders = db.orders.filter(o => o.buyer_id === req.user.id);
  } else {
    const myIds = db.listings.filter(l => l.grower_id === req.user.id).map(l => l.id);
    orders = db.orders.filter(o => myIds.includes(o.listing_id));
  }
  res.json(orders);
});

// PATCH /api/orders/:id/status  (grower updates status)
router.patch('/orders/:id/status', protect, (req, res) => {
  if (req.user.role !== 'grower') return res.status(403).json({ error: 'Growers only' });
  const order = db.orders.find(o => o.id === parseInt(req.params.id));
  if (!order) return res.status(404).json({ error: 'Not found' });
  order.status = req.body.status;
  res.json(order);
});

// ── Health ──────────────────────────────────────────────────────────────────
router.get('/health', (_, res) => res.json({ status: 'ok', time: new Date() }));

module.exports = router;
