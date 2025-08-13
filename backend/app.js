const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const serverRoutes = require('./routes/serverRoutes');

// Middleware
app.use(cors());
app.use(express.json());

app.use('/api', serverRoutes);

if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, 'public');
  app.use(express.static(publicPath));

  // Fallback for React Router (SPA)
  // Catch-all route for SPA (React)
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      res.sendFile(path.join(publicPath, 'index.html'));
    } else {
      next();
    }
  });
}

module.exports = app;