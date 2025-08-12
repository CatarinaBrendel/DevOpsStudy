const express = require('express');
const getDb = require('../db/index'); // Import the database connection
const db = getDb(); // Get the database instance
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
        res.status(201).json({ id: this.lastID, name: serverName, url: serverUrl });
        stmt.finalize();
    });
});

// Endpoit to get history for specific server (GET /api/services/:id/history)
router.get('/servers/:id/history', (req, res) => {
    const id = Number(req.params.id);
    const limit = Math.min(200, Number(req.query.limit) || 50);
    const status = req.query.status && req.query.status != 'All' ? String(req.query.status) : null;

    db.get('SELECT id FROM servers WHERE id = ?', [id], (existErr, server) => {
        if (existErr) return res.status(500).json({error: existErr.message});
        if(!server) return res.status(404).json({error: 'Server not found'});
        
        const where = ['server_id = ?'];
        const params = [id];
        if(status) {
            where.push('status = ?');
            params.push(status);
        }

        const sql = `
            SELECT
                strftime('%Y-%m-%dT%H:%M:%fZ', timestamp) AS time,
                status,
                response_time
            FROM service_status
            WHERE ${where.join(' AND ')}
            ORDER BY timestamp DESC
            LIMIT ?`;

        params.push(limit);

        db.all(sql, params, (err, rows) => {
            if(err) return res.status(500).json({error: err.message});
            res.json(rows);
        });
    });
});

// Endpoint to list the sumary information of specific service GET /api/servers/:id/sumary)
router.get('/servers/:id/summary', (req, res) => {
  const id = Number(req.params.id);
  const days = Number(req.query.days) || 30;

  // check server exists and get basic info
  db.get(
    'SELECT id, name, url, status, response_time, last_checked, created_at FROM servers WHERE id = ?',
    [id],
    (err, server) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!server) return res.status(404).json({ error: 'Server not found' });

      const windowExpr = `datetime('now', '-' || ? || ' days')`;

      // 1) counts for uptime
      db.get(
        `SELECT COUNT(*) AS total,
                SUM(CASE WHEN status = 'UP' COLLATE NOCASE THEN 1 ELSE 0 END) AS up_count
          FROM service_status
          WHERE server_id = ? AND timestamp >= ${windowExpr}`,
        [id, days],
        (err1, counts) => {
          if (err1) return res.status(500).json({ error: err1.message });

          // 2) average response time for UP rows only
          db.get(
            `SELECT ROUND(AVG(response_time)) AS avg_ms
              FROM service_status
              WHERE server_id = ?
                AND timestamp >= ${windowExpr}
                AND status = 'UP' COLLATE NOCASE
                AND response_time IS NOT NULL`,
            [id, days],
            (err2, avgRow) => {
              if (err2) return res.status(500).json({ error: err2.message });

              // 3) sparkline: time/value pairs
              db.all(
                `SELECT
                    strftime('%Y-%m-%dT%H:%M:%fZ', timestamp) AS t,
                    CASE
                      WHEN status = 'UP' COLLATE NOCASE AND response_time IS NOT NULL THEN response_time
                      ELSE 0
                    END AS ms
                  FROM service_status
                  WHERE server_id = ?
                    AND timestamp >= ${windowExpr}
                  ORDER BY timestamp ASC
                  LIMIT 1000`,
                [id, days],
                (err3, sparkRows) => {
                  if (err3) return res.status(500).json({ error: err3.message });

                  const total = counts?.total || 0;
                  const upCount = counts?.up_count || 0;
                  const uptimePercent = total
                    ? Math.round((upCount / total) * 1000) / 10
                    : null;

                  res.json({
                    server,
                    days,
                    uptimePercent,                // e.g., 99.9
                    averageResponseMs: avgRow?.avg_ms ?? null,
                    sparkline: sparkRows || []    // [{t, ms}, ...]
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

// Endpoint to update a service (PATCH /api/services/:id)
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
    res.status(200).json({ id: Number(id), serverName, serverUrl });
    stmt.finalize();
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
    db.all('SELECT * FROM service_status ORDER BY timestamp DESC', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

//Endpoint to get the status of a specific service (GET /api/status/:id)
router.post('/status/:id', (req, res) => {
    const serverId = req.params.id;

    db.get('SELECT * FROM servers WHERE id = ?', [serverId], async (err, row) => {
        if (err) {
            console.error('DB error:', err);
            return res.status(500).json({ error: err.message });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Service status not found' });
        }

        try {

            const result = await runHealthChecks([row], db);
            return res.json({result: result[0]});
            
        } catch (error) {
            console.error('Error checking service:', error);
            return res.status(500).json({ error: 'Error checking service' });
        }
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
      const results = await runHealthChecks(servers, db);
      res.json({checked: results.length, results});
    } catch (error) {
      console.error('Error checking services:', error);
      return res.status(500).json({ error: 'Error checking services' });
    }
});
});

// Endpoint to fetch last N checks across all servers (GET /api/globel-hitstory)
router.get('/global-history', (req, res) => {
  const limit = (Math.min(100, Number(req.query.limit) || 10));
  const statusFilter = req.query.status && req.query.status !== 'All' ? String(req.query.status) : null;

  const where = [];
  const params = [];

  if (statusFilter) {
    where.push("ss.status = ? COLLATE NOCASE");
    params.push(statusFilter);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const sql = `
    SELECT
      strftime('%Y-%m-%dT%H:%M:%fZ', ss.timestamp) AS time,
      s.name AS server,
      ss.status
    FROM service_status ss
    JOIN servers s ON s.id = ss.server_id
    ${whereSql}
    ORDER BY ss.timestamp DESC
    LIMIT ?`;

  params.push(limit);

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

module.exports = router;