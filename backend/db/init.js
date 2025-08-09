const getDb = require('./index'); // Import the database connection
const db = getDb();

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
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
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

            // create idx_service_status_server_time index on service_status table
            db.run(`
                CREATE INDEX IF NOT EXISTS idx_service_status_server_time
                ON service_status(server_id, timestamp);
            `);
            
            // create idx_service_servers_last_checked index on servers table
            db.run(`
                CREATE INDEX IF NOT EXISTS idx_servers_last_checked
                ON servers(last_checked);
            `);
            
        } catch (error) {
            console.error('Error creating tables:', error.message);
        }
    });
}

module.exports = initializeDatabase;