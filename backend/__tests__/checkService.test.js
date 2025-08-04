const checkService = require('../checkService');
const axios = require('axios');

jest.mock('axios');

describe('checkService', () => {
    const mockDB = {
        run: jest.fn(),
    };  

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('INSERT UP when sevice responds', async () => {
        axios.get.mockResolvedValue({ status: 200 });
        await checkService({ name: 'Test Service', url: 'https://test.com' }, mockDB);  

        expect(mockDB.run).toHaveBeenCalledWith(
            expect.stringContaining(`INSERT INTO service_status (service_name, status, response_time) VALUES (?, ?, ?)`), ['Test Service', 'UP', expect.any(Number)]);
    });

    it('INSERT DOWN when service does not respond', async () => {
        axios.get.mockRejectedValue(new Error('Network error'));
        await checkService({ name: 'Test Service', url: 'https://test.com' }, mockDB);

        expect(mockDB.run).toHaveBeenCalledWith(
            expect.stringContaining(`INSERT INTO service_status (service_name, status, response_time) VALUES (?, ?, ?)`), ['Test Service', 'DOWN', null]);
    });
}); 