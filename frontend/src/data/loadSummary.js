const API_BASE = 'http://localhost:3001/api';

export async function loadSummary(serverId, days=30) {
    try {
        const url = new URL(`${API_BASE}/servers/${serverId}/summary`);

        if(days && days != 30) {
            url.searchParams.set('days', days);
        };

        const res = await fetch(url);
        const resData = await res.json();

        return resData;
    } catch (error) {
        console.log('Error fetchig summary: ', error.message);
    }
}