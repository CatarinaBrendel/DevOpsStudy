import React, { useEffect, useState, useCallback } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import './App.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import Sidebar from './components/Sidebar';
import ServerDetails from './components/ServerDetails';
import EmptyServerState from './components/EmptyServerState';
import GlobalHistory from './components/GlobalHistory';

import {
  onFetchSidebarItems,
  triggerCheck,
  onAddServer,
  onUpdateServer,
  onDeleteServer,
  onRefreshAll,
  loadGlobalHistory, // <-- from data/api, not the component file
} from './data/api';

function App() {
  const [servers, setServers] = useState([]);
  const [selectedServerId, setSelectedServerId] = useState(null);
  const [isRefreshAll, setIsRefreshingAll] = useState(false);
  const [checkingId, setCheckingId] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const selected = servers.find((s) => s.id === selectedServerId);

  // Fetch global history
  const refreshHistory = useCallback(async () => {
    try {
      setIsHistoryLoading(true);
      const data = await loadGlobalHistory();
      setHistoryData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching Global History Data:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  // Fetch server list
  const fetchServers = async () => {
    try {
      const data = await onFetchSidebarItems();
      setServers(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      console.error('Error fetching servers:', err);
      const msg = err.response?.data?.message || err.message || 'Request failed';
      toast.error(msg, { position: 'top-right', autoClose: 3000 });
    }
  };

  // Initial load
  useEffect(() => {
    fetchServers();
    refreshHistory();
  }, [refreshHistory]);

  const handleTriggerCheck = async (serverId) => {
    if (!serverId || checkingId) return;
    setCheckingId(serverId);

    try {
      await triggerCheck(serverId);
      await fetchServers();
      toast.success(`Server status was refreshed successfully.`, { position: 'top-right', autoClose: 3000 });
    } catch (err) {
      console.error('Error checking server:', err);
      const msg = err.response?.data?.message || err.message || 'Request failed';
      toast.error(msg, { position: 'top-right', autoClose: 3000 });
    } finally {
      setCheckingId(null);
    }
  };

  const handleAddServer = async ({ serverName, serverUrl }) => {
    try {
      await onAddServer(serverName, serverUrl);
      await fetchServers();
      setSelectedServerId(null);
      toast.success(`Server "${serverName}" added successfully.`, { position: 'top-right', autoClose: 3000 });
    } catch (err) {
      console.error('Error adding server:', err);
      const msg = err.response?.data?.message || err.message || 'Request failed';
      toast.error(msg, { position: 'top-right', autoClose: 3000 });
    }
  };

  const handleUpdateServer = async (id, updatedData) => {
    try {
      await onUpdateServer(id, updatedData);
      await fetchServers();
      setSelectedServerId(null);
      toast.success(`Server "${updatedData.serverName}" updated successfully.`, { position: 'top-right', autoClose: 3000 });
    } catch (err) {
      console.error('Error updating server:', err);
      const msg = err.response?.data?.message || err.message || 'Request failed';
      toast.error(msg, { position: 'top-right', autoClose: 3000 });
    }
  };

  const handleDeleteServer = async (id) => {
    try {
      await onDeleteServer(id);
      await fetchServers();
      toast.success(`Server deleted successfully.`, { position: 'top-right', autoClose: 3000 });
    } catch (err) {
      console.error('Error deleting server:', err);
      const msg = err.response?.data?.message || err.message || 'Request failed';
      toast.error(msg, { position: 'top-right', autoClose: 3000 });
    }
  };

  const handleRefreshAll = async () => {
    setIsRefreshingAll(true);
    try {
      await onRefreshAll();
      await fetchServers();
      await refreshHistory(); // <-- refresh Global History too

      setRefreshKey((prev) => prev + 1); // trigger filter reset

      toast.success(`Servers have been refreshed`, { position: 'top-right', autoClose: 3000 });
    } catch (err) {
      console.error('Error refreshing all:', err);
      const msg = err.response?.data?.message || err.message || 'Request failed';
      toast.error(msg, { position: 'top-right', autoClose: 3000 });
    } finally {
      setIsRefreshingAll(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="app-sidebar">
        <Sidebar
          items={servers}
          selectedId={selectedServerId}
          onSelect={setSelectedServerId}
          onAddServer={handleAddServer}
          onRefreshAll={handleRefreshAll}
          refreshing={isRefreshAll}
        />
      </div>

      <main className="app-main">
        {selectedServerId ? (
          <ServerDetails
            serverId={selectedServerId}
            lastChecked={selected?.lastChecked}
            onUpdateServer={handleUpdateServer}
            onTriggerCheck={handleTriggerCheck}
            isTriggering={checkingId === selectedServerId}
            onDeleteServer={async (id) => {
              await handleDeleteServer(id);
              setSelectedServerId((prev) => (prev === id ? null : prev));
            }}
          />
        ) : (
          <EmptyServerState
            hasServers={servers.length > 0}
            onAddServer={handleAddServer}
            onSelectServer={() => toast('Select a server from the left')}
          />
        )}
      </main>

      <div className="app-right">
        <GlobalHistory
          historyData={historyData}
          servers={servers.map(s => s.serverName)}
          onRefresh={refreshHistory}
          loading={isHistoryLoading}
          refreshTrigger={refreshKey}
        />
      </div>

      <ToastContainer />
    </div>
  );
}

export default App;
