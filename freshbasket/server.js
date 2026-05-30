require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use('/api', require('./routes/api'));

// Serve static frontend (the public/ folder)
app.use(express.static(path.join(__dirname, 'public')));

// SPA fallback — all non-API routes return landing.html
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`FreshBasket running on port ${PORT}`));
