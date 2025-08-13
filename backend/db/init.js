const getDb = require('./index'); // Import the database connection
const { promisify } = require('node:util');

// unified async runner without `new Promise`
function run(db, sql, params = []) {
  const maybe = db.run(sql, params);
  if (maybe && typeof maybe.then === 'function') {
    // Postgres shim: already a Promise
    return maybe;
  }
  // sqlite3: callback API -> promisify the bound method
  const runAsync = promisify(db.run.bind(db));
  return runAsync(sql, params);
}

async function ensureSchema() {
  const db = getDb();
  const isPg = !!process.env.DATABASE_URL;

  const stmts = isPg
    ? [
        `CREATE TABLE IF NOT EXISTS servers (
           id BIGSERIAL PRIMARY KEY,
           name TEXT NOT NULL,
           url  TEXT NOT NULL,
           created_at   TIMESTAMPTZ DEFAULT now(),
           status       TEXT,
           response_time INTEGER,
           last_checked TIMESTAMPTZ DEFAULT now()
         )`,
        `CREATE TABLE IF NOT EXISTS service_status (
           id BIGSERIAL PRIMARY KEY,
           server_id BIGINT NOT NULL REFERENCES servers(id),
           status TEXT NOT NULL,
           response_time INTEGER,
           "timestamp" TIMESTAMPTZ DEFAULT now()
         )`,
        `CREATE INDEX IF NOT EXISTS idx_servers_last_checked
           ON servers(last_checked)`,
        `CREATE INDEX IF NOT EXISTS idx_service_status_server_time
           ON service_status(server_id, "timestamp")`,
      ]
    : [
        `PRAGMA foreign_keys = ON`,
        `CREATE TABLE IF NOT EXISTS servers (
           id INTEGER PRIMARY KEY AUTOINCREMENT,
           name TEXT NOT NULL,
           url  TEXT NOT NULL,
           created_at   TEXT DEFAULT (datetime('now')),
           status       TEXT,
           response_time INTEGER,
           last_checked TEXT DEFAULT (datetime('now'))
         )`,
        `CREATE TABLE IF NOT EXISTS service_status (
           id INTEGER PRIMARY KEY AUTOINCREMENT,
           server_id INTEGER NOT NULL,
           status TEXT NOT NULL,
           response_time INTEGER,
           timestamp TEXT DEFAULT (datetime('now')),
           FOREIGN KEY (server_id) REFERENCES servers(id)
         )`,
        `CREATE INDEX IF NOT EXISTS idx_servers_last_checked
           ON servers(last_checked)`,
        `CREATE INDEX IF NOT EXISTS idx_service_status_server_time
           ON service_status(server_id, timestamp)`,
      ];

  for (const sql of stmts) {
    await run(db, sql);
  }

  console.log('DB schema ready.');
}

module.exports = { ensureSchema };