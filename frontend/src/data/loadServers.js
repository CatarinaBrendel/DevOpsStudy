import {mapServersFromDB} from './adapters/mapServer';

const API_BASE = 'http://localhost:3001/api';

export async function fetchSidebarItems() {
    try {
        const servers = await fetch(`${API_BASE}/servers`);
        const serversData = await servers.json();

        const serviceStatus = await fetch(`${API_BASE}/status`);
        const serviceSatusData = await serviceStatus.json();
        //const serviceSatus = [];

        const mappedServers = mapServersFromDB({ servers: serversData, serviceStatus: serviceSatusData });

        return mappedServers
    } catch (error) {
        console.error('Error fetching sidebar items:', error);
    }
}