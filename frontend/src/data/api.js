// src/api.js
import axios from "axios";
import {mapServersFromDB} from './adapters/mapServer';

const API_BASE = 'http://localhost:3001/api';

export async function triggerCheck(serverId) {
  return axios.post(`${API_BASE}/status/${serverId}`);
}

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

export async function onFetchSidebarItems() {
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

export async function onAddServer (serverName, serverUrl) {
    try {
        console.log(`servername: ${serverName}, serverurl: ${serverUrl}`);
        await fetch(`${API_BASE}/servers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ serverName, serverUrl }),
        });

    } catch (error) {
      console.error('Error adding server:', error);
    }
};

export async function onUpdateServer (id, updatedData) {
    try {
        await fetch(`${API_BASE}/servers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
        });

    } catch (err) {
        console.error('Error updating server:', err);
    }
};

export async function onDeleteServer (id) {
    try {
      await fetch(`${API_BASE}/servers/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Error deleting server:', err);
    }
};

export async function onRefreshAll () {
    try {
      await fetch(`${API_BASE}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
    } catch (err) {
      console.error('Error checking server:', err);
    }
};