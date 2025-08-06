const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
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
try {
    //create service_status table if it doesn't exist
      db.run(`CREATE TABLE IF NOT EXISTS service_status (
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

// Endpoint to check the status of all services (POST /api/check)
app.post('/api/check', (req, res) => {
  db.all('SELECT * FROM servers;', (err, servers) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    let results = [];
    let remaining = servers.length;

    if (remaining === 0) {
      return res.json({ checked: 0, results: [] });
    }

    servers.forEach((server) => {
      const start = Date.now();
      let responseTime;

      axios
        .get(server.url, { timeout: 5000 })
        .then((response) => {
          responseTime = Date.now() - start;
          const status = response.status >= 200 && response.status < 400 ? 'UP' : 'DOWN';

          updateStatus(server, status, responseTime);
        })
        .catch(() => {
          responseTime = Date.now() - start;
          updateStatus(server, 'DOWN', responseTime);
        });

      function updateStatus(server, status, responseTime) {
        console.log(`ID: ${server.id}, Server: ${server.server_id}, Status: ${status}, Response Time: ${responseTime}ms`);
        // Insert into service_status
        db.run(
          `INSERT INTO service_status (server_id, status, response_time) VALUES (?, ?, ?);`,
          [server.id, status, responseTime]
        );

        // Update servers table
        db.run(
          `UPDATE servers SET status = ?, response_time = ?, last_checked = CURRENT_TIMESTAMP WHERE id = ?;`,
          [status, responseTime, server.id]
        );

        results.push({
          id: server.id,
          name: server.name,
          status,
          responseTime,
        });

        remaining--;

        if (remaining === 0) {
          res.json({ checked: results.length, results });
        }
      }
    });
  });
});

app.listen(port, () => {
    console.log(`Service Status Dashboard API running at http://localhost:${port}`);
});