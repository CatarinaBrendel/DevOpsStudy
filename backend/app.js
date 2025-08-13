const express = require('express');
const path = require('path');
const app = express();
const serverRoutes = require('./routes/serverRoutes');
const cors = require('cors');

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api', serverRoutes);

// Serve frontend build (placed in ../public by the Dockerfile below)
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// SPA fallback for client-side routes
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});


module.exports = app;