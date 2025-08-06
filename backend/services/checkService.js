const axios = require('axios');

async function runHealthChecks(services, db) {
    const results = [];

    for(const service of services) {
        const start = Date.now();
        let status = 'DOWN';
        let responseTime = null;
        
        try {
           const response = await axios.get(service.url, { timeout: 5000 });
           if (response.status >= 200 && response.status < 400) {
               status = 'UP';
               responseTime = Date.now() - start;
           }
        } catch (error) {
            responseTime = null;
        }

        db.run(
        `INSERT INTO service_status (server_id, status, response_time) VALUES (?, ?, ?)`,
        [service.id, status, responseTime]
        );

        // Optionally update the servers table as well
        db.run(
        `UPDATE servers SET status = ?, response_time = ?, last_checked = CURRENT_TIMESTAMP WHERE id = ?`,
        [status, responseTime, service.id]
        );

        results.push({
        id: service.id,
        name: service.name,
        status,
        responseTime,
        });
    }

    return results;
}

module.exports = runHealthChecks;