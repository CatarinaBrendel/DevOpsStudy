const runHealthChecks = require('../services/checkService'); 
const axios = require('axios');

jest.mock('axios');

describe('runHealthChecks', () => {
    const mockDB = {
        run: jest.fn((sql, params, callback) => {
            if (callback) {
                callback();
            }
        }),
    };  

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const testServices = {
        id: 1,
        name: 'Test Service',
        url: 'https://test.com'
    };

    it('INSERT UP when sevice responds', async () => {
        axios.get.mockResolvedValue({ status: 200 });
        const result = await runHealthChecks([testServices], mockDB);

        expect(mockDB.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO service_status'),
        [testServices.id, 'UP', expect.any(Number)]
        );

        expect(mockDB.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE servers'),
        ['UP', expect.any(Number), testServices.id]
        );

        expect(result).toEqual([
        expect.objectContaining({
            id: testServices.id,
            name: testServices.name,
            status: 'UP',
            responseTime: expect.any(Number),
        }),
        ]);
    });

    it('INSERT DOWN when service does not respond', async () => {
        axios.get.mockRejectedValue(new Error('Network error'));
        const result = await runHealthChecks([testServices], mockDB);

        expect(mockDB.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO service_status'),
        [testServices.id, 'DOWN', null]
        );

        expect(mockDB.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE servers'),
        ['DOWN', null, testServices.id]
        );

        expect(result).toEqual([
        expect.objectContaining({
            id: testServices.id,
            name: testServices.name,
            status: 'DOWN',
            responseTime: null,
        }),
        ]);
    });
}); 