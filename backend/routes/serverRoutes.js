const express = require('express');
const db = require('../db/index'); // Import the database connection
const runHealthChecks = require('../services/checkService');

const router = express.Router();

// Simple health check endpoint
router.get('/', (req, res) => {
    res.send('Service Status Dashboard API is running');
});

// Endpoint to get all services (GET /api/services)
router.get('/servers', (req, res) => {
    db.all('SELECT * FROM servers ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
}); 

// Endpoint to add a new service (POST /api/services)
router.post('/servers', (req, res) => {
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

router.patch('/servers/:id', (req, res) => {
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
router.delete('/servers/:id', (req, res) => {
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
router.get('/status', (req, res) => {  
    db.all('SELECT * FROM service_status ORDER BY checked_at DESC LIMIT 10', (err, rows) => {
        if (err) {
         return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Endpoint to check the status of all services (POST /api/check)
router.post('/check', (req, res) => {
  db.all('SELECT * FROM servers;', async (err, servers) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    try {
      const results = runHealthChecks(servers, db);
      res.json({checked: results.length, results});
    } catch (error) {
      console.error('Error checking services:', error);
      return res.status(500).json({ error: 'Error checking services' });
    }
});
});

module.exports = router;