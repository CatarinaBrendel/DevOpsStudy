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
const db = new sqlite3.Database('./data/status.db');

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

//Create servers table if it doesn't exist
db.run(`
    CREATE TABLE IF NOT EXISTS servers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `);

// Simple health check endpoint
app.get('/api', (req, res) => {
    res.send('Service Status Dashboard API is running');
});

// Endpoint to get all services (GET /api/services)
app.get('/api/servers', (req, res) => {
    db.all('SELECT * FROM servers ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
}); 

// Endpoint to add a new service (POST /api/services)
app.post('/api/servers', (req, res) => {
    const { serverName, serverUrl } = req.body;
    
    if (!serverName || !serverUrl) {
        return res.status(400).json({ error: 'Name and URL are required' });
    }   

    const stmt = db.prepare('INSERT INTO servers (name, url) VALUES (?, ?)');
    stmt.run(serverName, serverUrl, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, serverName, serverUrl });
    });
    stmt.finalize();
});

app.patch('/api/servers/:id', (req, res) => {
  const id = req.params.id;
  const { serverName, serverUrl } = req.body;

  if (!serverName || !serverUrl) {
    return res.status(400).json({ error: 'Name and URL required' });
  }

  const stmt = db.prepare('UPDATE servers SET name = ?, url = ? WHERE id = ?');
  stmt.run(serverName, serverUrl, id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Server not found' });
    res.status(200).json({ id, serverName, serverUrl });
  });
});


// Endpoint to delete a service (DELETE /api/services/:id)
app.delete('/api/servers/:id', (req, res) => {
    const id = req.params.id;   
    db.run('DELETE FROM servers WHERE id = ?', id, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Service not found' });
        }
        res.status(204).send();
    });
});


// Endpoint to get all service statuses (GET /api/status)
app.get('/api/status', (req, res) => {  
    db.all('SELECT * FROM service_status ORDER BY checked_at DESC LIMIT 10', (err, rows) => {
        if (err) {
         return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Manually trigger a health check for a service (POST /api/check)
app.post('/api/check', async (req, res) => {
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