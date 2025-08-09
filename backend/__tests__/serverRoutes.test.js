/* eslint-env node */
process.env.DB_PATH = ':memory:'; // Use in-memory SQLite DB for fast, isolated tests
jest.setTimeout(15000); // 15 seconds
process.env.NODE_ENV = 'test'; // Set environment to test

const request = require('supertest');
const getDb = require('../db/index'); // Import the database connection
const util = require('util');

let app;
let db;
let runAsync;
let closeAsync;
let getAsync;
let allAsync;
let createdId;
let insertedServerId;

beforeAll(async () => {
    db = getDb(); // Get the database connection
    runAsync = util.promisify(db.run.bind(db));
    getAsync = util.promisify(db.get.bind(db));
    allAsync = util.promisify(db.all.bind(db)) 

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
    insertedServerId = row.id;
    
    
    // three history points: two Up, one Down
    await runAsync(`INSERT INTO service_status (server_id, status, response_time, timestamp) VALUES (?, ?, ?, ?) `, 
    [insertedServerId, 'UP', 100, iso(new Date(now.getTime() - 3 * 60 * 1000))]);  
    
    await runAsync(`INSERT INTO service_status (server_id, status, response_time, timestamp) VALUES (?, ?, ?, ?) `, 
    [insertedServerId, 'DOWN', null, iso(new Date(now.getTime() - 2 * 60 * 1000))]);   

    await runAsync(`INSERT INTO service_status (server_id, status, response_time, timestamp) VALUES (?, ?, ?, ?) `, 
    [insertedServerId, 'UP', 90, iso(new Date(now.getTime() - 1 * 60 * 1000))]);   
    
    app = require('../app'); // Import the Express app after setting up the database
});
    
afterAll(async () => {
    db = getDb(); // Get the database connection
    closeAsync = util.promisify(db.close.bind(db));
    await closeAsync(); // Close the database connection
});
    
describe('Server API Endpoints', () => {
    it('POST /api/servers should add new server', async () => {
            try {
            const res = await request(app)
            .post('/api/servers')
            .send({ serverName: 'Test Server', serverUrl: 'https://testserver.com'     
        });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('id');
        createdId = Number(res.body.id); // Store the created ID for later tests
        expect(res.body.name).toBe('Test Server');
        } catch (error) {
            console.error('Error in POST /api/servers:', error.message);
            throw error; // Fail the test if there's an error
        }   
    });

    it('GET /api/servers should return all servers', async () => {
        const res = await request(app).get('/api/servers');

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: Number(createdId),
                    name: 'Test Server',
                    url: 'https://testserver.com',
                    created_at: expect.anything(),
                    status: null,
                    response_time: null,
                    last_checked: expect.anything()
                })
            ])
        );
    });

    it('GET /api/servers/:id/history should return history rows in descending time order with default fields', async () => {
        const res = await request(app).get(`/api/servers/${insertedServerId}/history`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(3);

        const first = res.body[0];
        expect(first).toHaveProperty('time');
        expect(first).toHaveProperty('status');
        expect(first).toHaveProperty('response_time');

        const times = res.body.map(r => r.time);
        const sorted = [...times].sort().reverse();
        expect(times).toEqual(sorted);

    });
    
    it('filters by status=UP', async () => {
        const res = await request(app)
        .get(`/api/servers/${insertedServerId}/history?status=UP&limit=50`)
        .expect(200);

        expect(res.body.length).toBeGreaterThan(0);
        res.body.forEach(row => expect(row.status).toBe('UP'));
    });

    it('respects limit parameter', async () => {
        const res = await request(app)
        .get(`/api/servers/${insertedServerId}/history?limit=2`)
        .expect(200);

        expect(res.body.length).toBeLessThanOrEqual(2);
    });


    it('PATCH /api/servers/:id should update server', async () => {
        const res = await request(app)
            .patch(`/api/servers/${createdId}`)
            .send({ serverName: 'Updated Test Server', serverUrl: 'https://updatedtestserver.com' });

        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({
            id: Number(createdId)
        });
    });

    it('DELETE /api/servers/:id should delete an existing server and return 204', async () => {
        const res = await request(app).delete(`/api/servers/${insertedServerId}`);
        expect(res.status).toBe(204);

        // Confirm it's really gone
        const deleted = await getAsync('SELECT * FROM servers WHERE id = ?', [insertedServerId]);
        expect(deleted).toBeUndefined(); // or: expect(deleted).toBeFalsy();
    });

    it('DELETE should return 404 if server does not exist', async () => {
        const res = await request(app).delete('/api/servers/999999');
        console.log('Response body:', res.body); // Log the response body for debugging
        expect(res.status).toBe(404);
        expect(res.body.error).toMatch(/not found/i);
    });
});

describe('Status API Endpoints', () => {
    it('POST /api/status/id should run a health check and return the result', async () => {
        const res = await request(app).post(`/api/status/${createdId}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.result).toEqual(
            expect.objectContaining({
                id: Number(createdId),
                name: expect.any(String),
                status: expect.any(String),
                responseTime: null
            })
        );
    });

    it('POST /api/check should check all servers and return their statuses', async () => {
        const res = await request(app).post('/api/check');
        console.log('Response body:', res.body); // Log the response body for debugging
        expect(res.statusCode).toEqual(200);
        expect(res.body.results).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: Number(createdId),
                    name: 'Updated Test Server',
                    status: 'DOWN',
                    responseTime: null
                })
            ])
        );
    });
});