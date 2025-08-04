const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
// const axios = require('axios');
const checkService = require('./checkService'); // Assuming checkService is in the same directory

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

//Connect to SQLite database
const db = new sqlite3.Database('../data/status.db');

//Create table if it doesn't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS service_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_name TEXT,
    status TEXT,
    response_time INTEGER,
    checked_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Simple health check endpoint
app.get('/', (req, res) => {
    res.send('Service Status Dashboard API is running');
});

// Endpoint to get all service statuses
app.get('/status', (req, res) => {  
    db.all('SELECT * FROM service_status ORDER BY checked_at DESC LIMIT 10', (err, rows) => {
        if (err) {
         return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Manually trigger a health check for a service
app.post('/check', async (req, res) => {
    const services = [
        {name: 'Google', url: 'https://www.google.com'}, 
        {name: 'GitHub', url: 'https://github.com'},
    ];

    for (const service of services) {
        await checkService(service, db);
    }

    res.json({ message: 'Health check completed for all services.' });
});

app.listen(port, () => {
    console.log(`Service Status Dashboard API running at http://localhost:${port}`);
});