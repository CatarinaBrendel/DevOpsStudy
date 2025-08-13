const express = require('express');
const path = require('path');
const app = express();
const serverRoutes = require('./routes/serverRoutes');
const cors = require('cors');

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api', serverRoutes);

if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, 'public');
  app.use(express.static(publicPath));

  // Fallback for React Router (SPA)
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

module.exports = app;