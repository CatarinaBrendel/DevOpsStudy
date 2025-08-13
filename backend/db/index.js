// db/index.js
const fs = require('fs');
const path = require('path');

let dbSingleton = null;

function toPgPlaceholders(sql, params) {
  // If query already uses $1, $2... keep it
  if (/\$\d+/.test(sql)) return { text: sql, values: params || [] };
  // Convert '?' to $1,$2,... for Postgres
  let i = 0;
  const text = sql.replace(/\?/g, () => `$${++i}`);
  return { text, values: params || [] };
}

function getDb() {
  if (dbSingleton) return dbSingleton;

  // If DATABASE_URL exists, use Postgres; else SQLite
  if (process.env.DATABASE_URL) {
    // --- PostgreSQL branch ---
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // works on Render
      max: 5,
      idleTimeoutMillis: 30000,
      keepAlive: true,
    });

    // Shim with sqlite-like methods: all/get/run/close
    const pgDb = {
        serialize(fn) { if (typeof fn === 'function') fn(); },
      // db.all(sql, params?, cb?)
      all(sql, params, cb) {
        if (typeof params === 'function') { cb = params; params = []; }
        const { text, values } = toPgPlaceholders(sql, params);
        const p = pool.query(text, values).then(r => r.rows);
        return cb ? p.then(rows => cb(null, rows)).catch(cb) : p;
      },

      // db.get(sql, params?, cb?) -> first row or undefined
      get(sql, params, cb) {
        if (typeof params === 'function') { cb = params; params = []; }
        const { text, values } = toPgPlaceholders(sql, params);
        const p = pool.query(text, values).then(r => r.rows[0]);
        return cb ? p.then(row => cb(null, row)).catch(cb) : p;
      },

      // db.run(sql, params?, cb?) -> { changes, lastID? } if you use RETURNING id
      run(sql, params, cb) {
        if (typeof params === 'function') { cb = params; params = []; }
        const { text, values } = toPgPlaceholders(sql, params);

        const promise = pool.query(text, values).then((r) => {
            // emulate sqlite: changes = rowCount; lastID only if you used RETURNING id
            let lastID;
            if (r.rows && r.rows[0]) {
            if ('id' in r.rows[0]) lastID = r.rows[0].id;
            else if ('lastid' in r.rows[0]) lastID = r.rows[0].lastid;
            }
            return { changes: r.rowCount, lastID };
        });

        if (cb) {
            return promise
            .then(({ changes, lastID }) => {
                // sqlite's run invokes cb(err) and binds `this` with metadata
                cb.call({ changes, lastID }, null);
            })
            .catch((err) => cb(err));
        }

        // promise form: resolves to { changes, lastID }
        return promise;
        },

      // db.close(cb?)
      close(cb) {
        const p = pool.end();
        return cb ? p.then(() => cb(null)).catch(cb) : p;
      }
    };

    console.log('DB: using PostgreSQL (DATABASE_URL present).');
    dbSingleton = pgDb;
    return dbSingleton;
  }

  // --- SQLite branch (unchanged behavior for local dev/tests) ---
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'status.db');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const sqliteDb = new sqlite3.Database(
    dbPath,
    sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
    (err) => {
      if (err) {
        console.error('Error opening SQLite database:', err.message);
      } else {
        console.log(`DB: using SQLite at ${dbPath}`);
      }
    }
  );

  dbSingleton = sqliteDb; // returns the real sqlite3 db (so tests keep working)
  return dbSingleton;
}

module.exports = getDb;
