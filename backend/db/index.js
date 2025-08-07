// db/index.js
const sqlite3 = require('sqlite3').verbose();
let db;


function getDb() {
    if (!db) {
        const dbPath = process.env.DB_PATH || '/data/status.db';
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            } else {
                console.log(`Connected to the SQLite database at ${dbPath}.`);
            }
        });
    }
    return db;
}

module.exports = getDb;
