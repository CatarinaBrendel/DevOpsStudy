const axios = require('axios');

async function checkService(service, db) {
    try {
        const start = Date.now();
        await axios.get(service.url);
        const resposeTime = Date.now() - start;
        
        db.run(
            `INSERT INTO service_status (service_name, status, response_time) VALUES (?, ?, ?)`,
            [service.name, 'UP', resposeTime]
        );
    } catch (error) {
        db.run(
            `INSERT INTO service_status (service_name, status, response_time) VALUES (?, ?, ?)`,
            [service.name, 'DOWN', null]
        );
    }
}

module.exports = checkService;