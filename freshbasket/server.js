require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use('/api', require('./routes/api'));

// Static files (html, css, js)
app.use(express.static(path.join(__dirname, 'public')));

// Root → landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

// Catch-all fallback
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`FreshBasket running on http://localhost:${PORT}`));
