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

describe('Server API Endpoints', () => {
    
    beforeAll(async () => {
        db = getDb(); // Get the database connection
        runAnsync = util.promisify(db.run.bind(db));
        closeAsync = util.promisify(db.close.bind(db));
        
        await runAnsync(`CREATE TABLE IF NOT EXISTS servers (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            name TEXT NOT NULL, 
            url TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT,
            response_time INTEGER,
            last_checked DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        
            app = require('../app'); // Import the Express app after setting up the database
    });

    afterAll(async () => {
        await closeAsync(); // Close the database connection
    });

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