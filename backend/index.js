// server.js (or index.js)
if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const app = require('./app');
const { ensureSchema } = require('./db/init');

const port = process.env.PORT || 3001;
const host = '0.0.0.0';

async function start() {
  if (process.env.NODE_ENV !== 'test') {
    try {
      await ensureSchema();            // ✅ ensure tables exist first
      console.log('DB schema ready.');
    } catch (err) {
      console.error('Failed to init schema:', err);
      process.exit(1);
    }
  }

  app.listen(port, host, () => {
    console.log(`Service Status Dashboard API running at http://${host}:${port}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = app;
