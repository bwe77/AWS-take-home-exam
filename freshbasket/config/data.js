// Simple in-memory store — no database dependency needed for the lab.
// In production swap this for mysql2 queries against RDS.
const bcrypt = require('bcryptjs');

const db = {
  users: [
    { id: 1, name: 'Sarah Lewis',     email: 'sarah@example.com',     password: bcrypt.hashSync('password123', 8), role: 'buyer'  },
    { id: 2, name: 'Marcus Thompson', email: 'marcus@sunrisefarm.com', password: bcrypt.hashSync('password123', 8), role: 'grower' },
    { id: 3, name: 'Linda Wu',        email: 'linda@greenvalley.com',  password: bcrypt.hashSync('password123', 8), role: 'grower' },
  ],
  listings: [
    { id: 1, grower_id: 2, grower: 'Sunrise Farm', title: 'Heirloom Tomatoes',   emoji: '🍅', price: 6.50, unit: 'kg',     category: 'vegetables', stock: 20 },
    { id: 2, grower_id: 2, grower: 'Sunrise Farm', title: 'Rainbow Carrots',     emoji: '🥕', price: 3.50, unit: 'bunch',  category: 'vegetables', stock: 15 },
    { id: 3, grower_id: 2, grower: 'Sunrise Farm', title: 'Free-range Eggs',     emoji: '🥚', price: 6.00, unit: 'dozen',  category: 'eggs',       stock: 10 },
    { id: 4, grower_id: 3, grower: 'Green Valley', title: 'Baby Spinach',        emoji: '🥬', price: 4.00, unit: 'bunch',  category: 'vegetables', stock: 25 },
    { id: 5, grower_id: 3, grower: 'Green Valley', title: 'Wild Blueberries',    emoji: '🫐', price: 9.00, unit: 'punnet', category: 'fruits',     stock: 8  },
    { id: 6, grower_id: 3, grower: 'Green Valley', title: 'Mixed Herb Bundle',   emoji: '🌿', price: 4.50, unit: 'bundle', category: 'herbs',      stock: 20 },
    { id: 7, grower_id: 2, grower: 'Sunrise Farm', title: 'Lebanese Cucumbers',  emoji: '🥒', price: 2.80, unit: 'kg',     category: 'vegetables', stock: 30 },
    { id: 8, grower_id: 3, grower: 'Green Valley', title: 'Meyer Lemons',        emoji: '🍋', price: 4.20, unit: 'bag',    category: 'fruits',     stock: 12 },
  ],
  orders: [],
  nextUserId:  4,
  nextOrderId: 1,
};

module.exports = db;
