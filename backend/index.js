const initializeDatabase = require('./db/init');
const app = require('./app');
const port = 3001;


//Only initialize DB if not running in test mode
if (process.env.NODE_ENV !== 'test') {
  initializeDatabase();
}

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Service Status Dashboard API running at http://localhost:${port}`);
  });
}  