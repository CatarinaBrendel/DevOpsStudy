// src/api.js
import axios from "axios";
import {mapServersFromDB} from './adapters/mapServer';

const API_BASE = 'http://localhost:3001/api';

// Reusable axios instance
const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Optional: help avoid browser/proxy caching on GETs
const noStore = () => ({
  headers: { "Cache-Control": "no-store" },
  params: { _ts: Date.now() }, // cache-buster
});

export async function triggerCheck(serverId) {
  return axios.post(`${API_BASE}/status/${serverId}`);
}

export async function loadSummary(serverId, days = 30) {
  const params = {};
  if (days && days !== 30) params.days = days;
  const { data } = await api.get(`/servers/${serverId}/summary`, {
    ...noStore(),
    params,
  });
  return data;
}

export async function onFetchSidebarItems() {
  const [serversRes, statusRes] = await Promise.all([
    api.get("/servers", noStore()),
    api.get("/status", noStore()),
  ]);
  return mapServersFromDB({
    servers: serversRes.data,
    serviceStatus: statusRes.data,
  });
}

export async function loadHistory(serverId, limit = 50, status = "All") {
  const params = { limit };
  if (status && status !== "All") params.status = status;

  const { data } = await api.get(`/servers/${serverId}/history`, {
    ...noStore(),
    params,
  });
  return data;
}

export async function onAddServer(serverName, serverUrl) {
  await api.post("/servers", { serverName, serverUrl });
}

export async function onUpdateServer(id, updatedData) {
  await api.patch(`/servers/${id}`, updatedData);
}

export async function onDeleteServer(id) {
  await api.delete(`/servers/${id}`);
}

export async function onRefreshAll() {
  await api.post("/check", {}, noStore());
}

export async function loadGlobalHistory() {
  const res = await api.get(`/global-history`);
  return res.data;
}