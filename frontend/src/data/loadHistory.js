const API_BASE = 'http://localhost:3001/api';

export async function loadHistory(serverId, limit=50, status='All') {
    try {
        const url = new URL(`${API_BASE}/servers/${serverId}/history`);
        url.searchParams.set('limit', limit);
        
        if(status && status != 'All') {
            url.searchParams.set('status', status);
        };
        
        const res = await fetch(url);
        const resData = await res.json();

        return resData;
    } catch (error) {
        console.log('Error fetchig history: ', error.message);
    }
}