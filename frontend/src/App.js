import React, {useEffect, useState} from 'react';
import {toast, ToastContainer} from 'react-toastify';
import './App.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Sidebar from './components/Sidebar';
import { onFetchSidebarItems, triggerCheck, onAddServer, onUpdateServer, onDeleteServer, onRefreshAll } from './data/api';
import ServerDetails from './components/ServerDetails';
import EmptyServerState from './components/EmptyServerState';

function App() {
  const [servers, setServers] = useState([]);
  const [selectedServerId, setSelectedServerId] = useState(null);
  const [isRefreshAll, setIsRefreshingAll] = useState(false);
  const [checkingId, setCheckingId] = useState(null);
  const selected = servers.find(s => s.id == selectedServerId);
  
  //Load servers from API
  useEffect(() => {
      fetchServers();
  }, []);

  const fetchServers = async () => {
      try {
        const data = await onFetchSidebarItems();
        setServers(Array.isArray(data) ? data: []);
        return data;
      } catch (error) {
        console.error('Error checking server:', err);
        const msg = err.response?.data?.message || err.message || 'Request failed';
        toast.error(msg, {
          position: 'top-right',
          autoClose: 3000
        });
      }
  };  

  const handleTriggerCheck = async (serverId) => {
    if (!serverId || checkingId) return;
    setCheckingId(serverId);
    
    try {
      await triggerCheck(serverId);

      await fetchServers();
      
      toast.success(`Server status was refreshed successfully.`, {
        position: 'top-right',
        autoClose: 3000
      })

    } catch (err) {
      console.error('Error checking server:', err);
      const msg = err.response?.data?.message || err.message || 'Request failed';
      toast.error(msg, {
        position: 'top-right',
        autoClose: 3000
      });
    } finally {
      setCheckingId(null);
    }
  };

  const handleAddServer = async ({serverName, serverUrl}) => {
    try {
      await onAddServer(serverName, serverUrl);
      
      await fetchServers();
      setSelectedServerId(null);

      toast.success(`Server "${serverName}" added successfully.`, {
        position: 'top-right',
        autoClose: 3000
      });

    } catch (error) {
      console.error('Error checking server:', err);
      const msg = err.response?.data?.message || err.message || 'Request failed';
      toast.error(msg, {
        position: 'top-right',
        autoClose: 3000
      });
    }
  };

  const handleUpdateServer = async (id, updatedData) => {
    try {
      await onUpdateServer(id, updatedData);
      await fetchServers();
      setSelectedServerId(null);
      
      toast.success(`Server "${updatedData.serverName}" updated successfully.`, {
        position: 'top-right',
        autoClose: 3000
      });

    } catch (err) {
      console.error('Error checking server:', err);
      const msg = err.response?.data?.message || err.message || 'Request failed';
      toast.error(msg, {
        position: 'top-right',
        autoClose: 3000
      });
    }
  };
  
  const handleDeleteServer = async (id) => {
    try {
      await onDeleteServer(id);
      await fetchServers();

      toast.success(`Server deleted successfully.`, {
        position: 'top-right',
        autoClose: 3000
      });

    } catch (err) {
      console.error('Error checking server:', err);
      const msg = err.response?.data?.message || err.message || 'Request failed';
      toast.error(msg, {
        position: 'top-right',
        autoClose: 3000
      });
    }
  };

  const handleRefreshAll = async () => {
    setIsRefreshingAll(true);

    try {
      await onRefreshAll();

      await fetchServers();

      toast.success(`Servers have been refreshed`, {
        position: 'top-right',
        autoClose: 3000
      });
    } catch (err) {
      console.error('Error checking server:', err);
      const msg = err.response?.data?.message || err.message || 'Request failed';
      toast.error(msg, {
        position: 'top-right',
        autoClose: 3000
      });
    } finally {
      setIsRefreshingAll(false);
    }
  };

  return (
    <div className='app-shell'>
      <div className='app-sidebar'>
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
          />) : (
            <>
              <EmptyServerState
              hasServers={servers.length > 0}
              onAddServer={handleAddServer}
              onSelectServer={() => toast('Select a server from the left')} />
            </>
          )}
      </main>
      <ToastContainer />
    </div>
  );
}

export default App;

