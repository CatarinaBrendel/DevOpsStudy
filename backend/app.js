const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const serverRoutes = require('./routes/serverRoutes');

// --- CSP: allow self, two inline scripts, favicon/images, and API calls ---
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'sha256-ieoeWczDHkReVBsRBqaal5AFMlBtNjMzgwKvLqi/tSU='",
        "'sha256-ZswfTY7H35rbv8WC7NXBoiC7WNu86vSzCDChNWwZZDM='",
      ],
      styleSrc: ["'self'", "'unsafe-inline'"],       // keep if you have inline styles
      imgSrc: ["'self'", "data:"],                   // unblocks /favicon.ico
      connectSrc: ["'self'"],                        // add API origin here if different domain
      fontSrc: ["'self'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
}));

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