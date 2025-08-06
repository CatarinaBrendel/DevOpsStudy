const db = require('./index'); // Import the database connection

function initializeDatabase() {
    db.serialize(() => {
        try {
            //create service_status table if it doesn't exist
            db.run(`
                CREATE TABLE IF NOT EXISTS service_status (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                server_id INTEGER NOT NULL,
                status TEXT NOT NULL,
                response_time INTEGER,
                checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (server_id) REFERENCES servers(id)
            )`);
            
            //Create servers table if it doesn't exist
            db.run(`
                CREATE TABLE IF NOT EXISTS servers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                url TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT,
                response_time INTEGER,
                last_checked DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            `);
            
        } catch (error) {
            console.error('Error creating tables:', error.message);
        }
    });
}

module.exports = initializeDatabase;