if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const ensureSchema = require('./db/init');
const app = require('./app');

const port = process.env.PORT || 3001;


//Only initialize DB if not running in test mode
(async () => {
  if (process.env.NODE_ENV !== 'test') {
    await ensureSchema().catch(err => {
      console.error('Failed to init schema:', err);
      process.exit(1);
    });
  }
}); 

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Service Status Dashboard API running at http://localhost:${port}`);
  });
}  