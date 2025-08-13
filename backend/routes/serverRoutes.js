const express = require('express');
const getDb = require('../db/index'); // Import the database connection
const db = getDb(); // Get the database instance
const runHealthChecks = require('../services/checkService');

const router = express.Router();
const isPg = !!process.env.DATABASE_URL;

// Dialect helpers
const TIME_EXPR = isPg
  ? `to_char(ss."timestamp" AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`
  : `strftime('%Y-%m-%dT%H:%M:%fZ', ss.timestamp)`;

const ORDER_TS = isPg ? `ss."timestamp"` : `ss.timestamp`;
const ORDER_TS_RAW = isPg ? `"timestamp"` : `timestamp`; // when not using alias
const WINDOW_EXPR = isPg
  ? `(now() - make_interval(days => ?))`
  : `datetime('now', '-' || ? || ' days')`;

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
router.post('/servers', (req, res, next) => {
    const { serverName, serverUrl } = req.body;
    
    if (!serverName || !serverUrl) {
        return res.status(400).json({ error: 'Name and URL are required' });
    }   

    if (isPg) {
      const sql = `
        INSERT INTO servers (name, url)
        VALUES (?, ?)
        RETURNING id, name, url, created_at, last_checked
      `;
      db.all(sql, [serverName, serverUrl], (err, rows) => {
        if (err) return next(err);
        res.status(201).json(rows && rows[0]);
      });
    } else {
      const stmt = db.prepare('INSERT INTO servers (name, url) VALUES (?, ?)');
      stmt.run(serverName, serverUrl, function(err) {
          if (err) {
              return res.status(500).json({ error: err.message });
          }
          res.status(201).json({ id: this.lastID, name: serverName, url: serverUrl });
          stmt.finalize();
      });
    }
});

// Endpoit to get history for specific server (GET /api/services/:id/history)
router.get('/servers/:id/history', (req, res, next) => {
    const id = Number(req.params.id);
    const limit = Math.min(200, Number(req.query.limit) || 50);
    const status = req.query.status && req.query.status != 'All' ? String(req.query.status) : null;

    db.get('SELECT id FROM servers WHERE id = ?', [id], (existErr, server) => {
        if (existErr) return next(existErr);
        if(!server) return res.status(404).json({error: 'Server not found'});
        
        const where = ['ss.server_id = ?'];
        const params = [id];
        if (status) {
          where.push('LOWER(ss.status) = LOWER(?)');
          params.push(status);
        }
        const sql = `
          SELECT
            ${TIME_EXPR} AS time,
            ss.status,
            ss.response_time
          FROM service_status ss
          WHERE ${where.join(' AND ')}
          ORDER BY ${ORDER_TS} DESC
          LIMIT ?
        `;
        params.push(limit);

        db.all(sql, params, (err, rows) => (err ? next(err) : res.json(rows)));
    });
});

// Endpoint to list the sumary information of specific service GET /api/servers/:id/sumary)
router.get('/servers/:id/summary', (req, res, next) => {
  const id = Number(req.params.id);
  const days = Number(req.query.days) || 30;

  // 0) ensure server exists
  db.get(
    'SELECT id, name, url, status, response_time, last_checked, created_at FROM servers WHERE id = ?',
    [id],
    (err, server) => {
      if (err) return next(err);
      if (!server) return res.status(404).json({ error: 'Server not found' });

      // 1) counts for uptime
      const sql1 = `
        SELECT COUNT(*) AS total,
               SUM(CASE WHEN LOWER(status)='up' THEN 1 ELSE 0 END) AS up_count
          FROM service_status
         WHERE server_id = ?
           AND ${ORDER_TS_RAW} >= ${WINDOW_EXPR}
      `;
      db.get(sql1, [id, days], (e1, counts) => {
        if (e1) return next(e1);

        // 2) average response for UP rows
        const sql2 = `
          SELECT ROUND(AVG(response_time)) AS avg_ms
            FROM service_status
           WHERE server_id = ?
             AND ${ORDER_TS_RAW} >= ${WINDOW_EXPR}
             AND LOWER(status)='up'
             AND response_time IS NOT NULL
        `;
        db.get(sql2, [id, days], (e2, avgRow) => {
          if (e2) return next(e2);

          // 3) sparkline (t, ms)
          const sql3 = `
            SELECT
              ${isPg
                ? `to_char("timestamp" AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`
                : `strftime('%Y-%m-%dT%H:%M:%fZ', timestamp)`} AS t,
              CASE
                WHEN LOWER(status)='up' AND response_time IS NOT NULL THEN response_time
                ELSE 0
              END AS ms
            FROM service_status
           WHERE server_id = ?
             AND ${ORDER_TS_RAW} >= ${WINDOW_EXPR}
           ORDER BY ${ORDER_TS_RAW} ASC
           LIMIT 1000
          `;
          db.all(sql3, [id, days], (e3, sparkRows) => {
            if (e3) return next(e3);

            const total = counts?.total || 0;
            const upCount = counts?.up_count || 0;
            const uptimePercent = total ? Math.round((upCount / total) * 1000) / 10 : null;

            res.json({
              server,
              days,
              uptimePercent,
              averageResponseMs: avgRow?.avg_ms ?? null,
              sparkline: sparkRows || [],
            });
          });
        });
      });
    }
  );
});

// Endpoint to update a service (PATCH /api/services/:id)
router.patch('/servers/:id', (req, res, next) => {
  const id = req.params.id;
  const { serverName, serverUrl } = req.body;

  if (!serverName || !serverUrl) {
    return res.status(400).json({ error: 'Name and URL required' });
  }

  if (isPg) {
    const sql = `
      UPDATE servers
         SET name = ?, url = ?
       WHERE id = ?
       RETURNING id, name, url, created_at, last_checked
    `;
    db.all(sql, [serverName, serverUrl, id], (err, rows) => {
      if (err) return next(err);
      if (!rows || rows.length === 0) return res.status(404).json({ error: 'Server not found' });
      res.json(rows[0]);
    });
  } else {

    const stmt = db.prepare('UPDATE servers SET name = ?, url = ? WHERE id = ?');
    stmt.run(serverName, serverUrl, id, function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Server not found' });
      res.status(200).json({ id: Number(id), serverName, serverUrl });
      stmt.finalize();
    });
  }
});

// Endpoint to delete a service (DELETE /api/services/:id)
router.delete('/servers/:id', (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

    db.run('DELETE FROM servers WHERE id = ?', [id], function (err) {
      if (err) return next(err);
      if (this.changes === 0) return res.status(404).json({ error: 'Server not found' });
      res.status(204).send();
  });
});

// Endpoint to get all service statuses (GET /api/status)
router.get('/status', (req, res, next) => {  
    const sql = `SELECT * FROM service_status ORDER BY ${ORDER_TS_RAW} DESC`;
  db.all(sql, (err, rows) => (err ? next(err) : res.json(rows)));
});

//Endpoint to get the status of a specific service (GET /api/status/:id)
router.post('/status/:id', (req, res, next) => {
    const serverId = req.params.id;

    db.get('SELECT * FROM servers WHERE id = ?', [serverId], async (err, row) => {
        if (err) return next(err);
        
        if (!row) {
            return res.status(404).json({ error: 'Service status not found' });
        }

        try {

            const result = await runHealthChecks([row], db);
            return res.json({result: result[0]});
            
        } catch (error) {
            console.error('Error checking service:', error);
            next(error);
        }
    });
});

// Endpoint to check the status of all services (POST /api/check)
router.post('/check', (req, res, next) => {
  db.all('SELECT * FROM servers;', async (err, servers) => {
    if (err) return next(err);

    try {
      const results = await runHealthChecks(servers, db);
      res.json({checked: results.length, results});
    } catch (error) {
      next(error);
    }
});
});

// Endpoint to fetch last N checks across all servers (GET /api/global-hitstory)
router.get('/global-history', (req, res) => {
  const limit = (Math.min(100, Number(req.query.limit) || 10));
  const statusFilter = req.query.status && req.query.status !== 'All' ? String(req.query.status) : null;

  const where = [];
  const params = [];
  const isPg = !!process.env.DATABASE_URL;

  if (statusFilter) {
    where.push('LOWER(ss.status) = LOWER(?)');
    params.push(statusFilter);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  // Time expression + order column per dialect
  const timeExpr = isPg
    ? `to_char(ss."timestamp" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`
    : `strftime('%Y-%m-%dT%H:%M:%fZ', ss.timestamp)`;

  const orderCol = isPg ? `ss."timestamp"` : `ss.timestamp`;


  const sql = `
    SELECT
      ${timeExpr} AS time,
      s.name AS server,
      ss.status
    FROM service_status ss
    JOIN servers s ON s.id = ss.server_id
    ${whereSql}
    ORDER BY ${orderCol} DESC
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