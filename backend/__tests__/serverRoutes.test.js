/* eslint-env node */
process.env.DB_PATH = ':file:memdb1?mode=memory&cache=shared'; // Use in-memory SQLite DB for fast, isolated tests
jest.setTimeout(15000); // 15 seconds
process.env.NODE_ENV = 'test'; // Set environment to test

const request = require('supertest');
const getDb = require('../db/index'); // Import the database connection
const util = require('util');

let app;

async function seedDatabaseForTests ({withHistory = false}) {
    const db = getDb(); // Get the database connection
    const runAsync = util.promisify(db.run.bind(db));
    const getAsync = util.promisify(db.get.bind(db));

    await runAsync(`PRAGMA foreign_keys = ON`);
    
    await runAsync(`CREATE TABLE IF NOT EXISTS servers (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        name TEXT NOT NULL, 
        url TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT,
        response_time INTEGER,
        last_checked DATETIME DEFAULT CURRENT_TIMESTAMP)`);

    await runAsync(`CREATE TABLE IF NOT EXISTS service_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        response_time INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
    )`);
    
    // Clear tables to avoid conflicts
    await runAsync(`DELETE FROM service_status`);
    await runAsync(`DELETE FROM servers`);

    // one server
    const now = new Date();
    const iso = (d) => d.toISOString();
    
    await runAsync(`INSERT INTO servers (name, url, created_at, status, response_time, last_checked) VALUES (?, ?, ?, ?, ?, ?) `, ['Test Server Name', 'http://test.com', new Date().toISOString(), 'UP', 100, new Date().toISOString()]);
    
    const row = await getAsync('SELECT id FROM servers ORDER BY id DESC LIMIT 1');
    const insertedServerId = row.id;
    
    if(withHistory) {
        // Seed 3 history points
        await runAsync(
        `INSERT INTO service_status (server_id, status, response_time, timestamp) VALUES (?, ?, ?, ?)`,
            [insertedServerId, 'UP', 100, iso(new Date(now.getTime() - 3 * 60 * 1000))]
        );

        await runAsync(
            `INSERT INTO service_status (server_id, status, response_time, timestamp) VALUES (?, ?, ?, ?)`,
            [insertedServerId, 'DOWN', null, iso(new Date(now.getTime() - 2 * 60 * 1000))]
        );

        await runAsync(
            `INSERT INTO service_status (server_id, status, response_time, timestamp) VALUES (?, ?, ?, ?)`,
            [insertedServerId, 'UP', 90, iso(new Date(now.getTime() - 1 * 60 * 1000))]
        );
    }

    return {insertedServerId, runAsync, getAsync};
}
  
beforeAll(async () => {
    app = require ('../app');
});

afterAll(async () => {
    const db = getDb(); // Get the database connection
    const closeAsync = util.promisify(db.close.bind(db));
    await closeAsync(); // Close the database connection
});
    
describe('Server API Endpoints', () => {
  let insertedServerId, getAsync;

  beforeEach(async () => {
    const seeded = await seedDatabaseForTests({ withHistory: false }); // no history needed for CRUD basics
    insertedServerId = seeded.insertedServerId;
    getAsync = seeded.getAsync;
  });

  it('POST /api/servers should add new server', async () => {
    const res = await request(app)
      .post('/api/servers')
      .send({ serverName: 'Test Server', serverUrl: 'https://testserver.com' })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Test Server');
  });

  it('GET /api/servers should return all servers', async () => {
    const res = await request(app).get('/api/servers').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Should at least contain the seeded one
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: insertedServerId,
          name: 'Test Server Name',
          url: 'http://test.com',
          created_at: expect.anything(),
          status: 'UP',
          response_time: 100,
          last_checked: expect.anything(),
        }),
      ])
    );
  });

  it('PATCH /api/servers/:id should update server', async () => {
    const res = await request(app)
      .patch(`/api/servers/${insertedServerId}`)
      .send({ serverName: 'Updated Test Server', serverUrl: 'https://updatedtestserver.com' })
      .expect(200);

    expect(res.body).toMatchObject({ id: insertedServerId });
  });

  it('DELETE /api/servers/:id should delete an existing server and return 204', async () => {
    await request(app).delete(`/api/servers/${insertedServerId}`).expect(204);

    // Confirm it's really gone using local helper
    const deleted = await getAsync('SELECT * FROM servers WHERE id = ?', [insertedServerId]);
    expect(deleted).toBeUndefined();
  });

  it('DELETE should return 404 if server does not exist', async () => {
    const res = await request(app).delete('/api/servers/999999').expect(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});

describe('Status API Endpoints', () => {
  let insertedServerId;

  beforeEach(async () => {
    const seeded = await seedDatabaseForTests({ withHistory: false });
    insertedServerId = seeded.insertedServerId;
  });

  it('POST /api/status/:id should run a health check and return the result', async () => {
    const res = await request(app).post(`/api/status/${insertedServerId}`).expect(200);
    expect(res.body.result).toEqual(
      expect.objectContaining({
        id: insertedServerId,
        name: 'Test Server Name',
      })
    );
  });

  it('POST /api/check should check all servers and return their statuses', async () => {
    const res = await request(app).post('/api/check').expect(200);
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.checked).toBeGreaterThanOrEqual(1);
  });
});


describe('Global-History API Endpoint', () => {
    let insertedServerId;
    beforeEach(async () => {
        const seeded = await seedDatabaseForTests({ withHistory: true }); // <-- includes 3 history rows
        insertedServerId = seeded.insertedServerId;
    });

    it('GET /api/servers/:id/history returns 3 rows sorted DESC', async () => {
        const res = await request(app)
        .get(`/api/servers/${insertedServerId}/history?limit=50`)
        .expect(200);

        expect(res.body.length).toBe(3);
        const times = res.body.map(r => +new Date(r.time));
        expect(times).toEqual([...times].sort((a, b) => b - a));
    });

    it('GET /api/global-history should return a list', async () => {
        const res = await request(app).get('/api/global-history');
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(3);
    });
});