/* eslint-env node */
process.env.DB_PATH = ':memory:'; // Use in-memory SQLite DB for fast, isolated tests
jest.setTimeout(15000); // 15 seconds
process.env.NODE_ENV = 'test'; // Set environment to test

const request = require('supertest');
const getDb = require('../db/index'); // Import the database connection
const util = require('util');

let app;
let db;
let runAnsync;
let closeAsync;
let createdId;

beforeAll(async () => {
    db = getDb(); // Get the database connection
    runAnsync = util.promisify(db.run.bind(db));
    
    await runAnsync(`CREATE TABLE IF NOT EXISTS servers (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        name TEXT NOT NULL, 
        url TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT,
        response_time INTEGER,
        last_checked DATETIME DEFAULT CURRENT_TIMESTAMP)`);

    await runAnsync(`CREATE TABLE IF NOT EXISTS service_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        response_time INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (server_id) REFERENCES servers(id)
    )`);
       
    await runAnsync(`INSERT INTO service_status (server_id, status, response_time, timestamp) VALUES (?, ?, ?, ?) `, [1, 'up', 100, new Date().toISOString()]);   
    await runAnsync(`INSERT INTO servers (name, url, created_at, status, response_time, last_checked) VALUES (?, ?, ?, ?, ?, ?) `, ['Test Server Name', 'http://test.com', new Date().toISOString(), 'UP', 100, new Date().toISOString()]);
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

    it('PATCH /api/servers/:id should update server', async () => {
        const res = await request(app)
            .patch(`/api/servers/${createdId}`)
            .send({ serverName: 'Updated Test Server', serverUrl: 'https://updatedtestserver.com' });

        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({
            id: Number(createdId)
        });
    });
});

describe('POST /api/status/id', () => {
    it('should run a health check and return the result', async () => {
        const res = await request(app).post(`/api/status/${createdId}`);

        console.log(res.body); // Log the response body for debugging

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
});