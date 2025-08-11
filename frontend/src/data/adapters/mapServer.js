// adapters/mapServer.
export function mapServersFromDB({ servers = [], serviceStatus = [] }) {

  function normalizeStatus(status) {
    if(!status) return 'warn';
    
    const lower = status.toLowerCase();
    if (lower.includes('down')) return 'down';
    
    return 'up';
  } 
  
  // group service_status by server_id
  const byServer = new Map();
  for (const row of serviceStatus) {
    const serverId = row.server_id;
    if(!byServer.has(serverId)) byServer.set(serverId, []);
    byServer.get(serverId).push(row);
  }
  for (const server of byServer.values()) {
      server.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }
  
  // ensure newest last for sparkine (left to right)
  return servers.map(server => {
      const serverId = server.id;
      const historyRows = byServer.get(serverId) || [];
  
      // pick latest service_status row if present, otherwise use servers
      const latest = historyRows.length > 0 ? historyRows[historyRows.length - 1] : null;
  
      const status = normalizeStatus(latest ? latest.status : server.status);
      const responseTime = Number(latest?.response_time ?? server.response_time ?? 0);
      const history = historyRows
          .map(row => Number(row.response_time ?? 0))
          .filter(n => Number.isFinite(n))
          .slice(-24); // last 24h  
  
      return {
          id: String(serverId),
          name: server.name,
          url: server.url,
          status,
          responseTime,
          history: history.length ? history : Number.isFinite([responseTime]), // ensure at least one point
      };
  });
}