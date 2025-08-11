import React, {useEffect, useState} from 'react';
import {toast, ToastContainer} from 'react-toastify';
import './App.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Sidebar from './components/Sidebar';
import { fetchSidebarItems } from './data/loadServers';
import ServerDetails from './components/ServerDetails';
import EmptyServerState from './components/EmptyServerState';

const API_BASE = 'http://localhost:3001/api';

function App() {
  const [servers, setServers] = useState([]);
  const [selectedServerId, setSelectedServerId] = useState(null);
  
  //Load servers from API
  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      //const response = await fetch(`${API_BASE}/servers`);
      //const data = await response.json();

      const data = await fetchSidebarItems();
      setServers(Array.isArray(data) ? data: []);
      return data;
    } catch (error) {
      console.error('Error fetching servers:', error);
    }
};  

  const handleAddServer = async ({serverName, serverUrl}) => {
    try {
      await fetch(`${API_BASE}/servers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverName, serverUrl }),
      });
      
      await fetchServers();
      setSelectedServerId(null);

      toast.success(`Server "${serverName}" added successfully`, {
        position: 'top-right',
        autoClose: 3000
      });

    } catch (error) {
      console.error('Error adding server:', error);
      toast.error('Failed to add server. Please try again.', {
        position: 'top-right',
        autoClose: 3000
      })
    }
  };

  const handleUpdateServer = async (id, updatedData) => {
    try {
      await fetch(`${API_BASE}/servers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      
      await fetchServers();
      setSelectedServerId(null);
      
      toast.success(`Server "${updatedData.serverName}" updated successfully`, {
        position: 'top-right',
        autoClose: 3000
      });

    } catch (err) {
      console.error('Error updating server:', err);
      toast.error(`Error updating "${updatedData.serverName}" server. Please try again.`, {
        position: 'top-right',
        autoClose: 3000
      });
    }
  };
  
  const handleDeleteServer = async (id) => {
    try {
      await fetch(`${API_BASE}/servers/${id}`, {
        method: 'DELETE',
      });
      
      fetchServers();

      toast.success(`Server deleted successfully`, {
        position: 'top-right',
        autoClose: 3000
      });

    } catch (err) {
      console.error('Error deleting server:', err);
      toast.error(`Error deleting the server. Please try again.`, {
        position: 'top-right',
        autoClose: 3000
      });
    }
  };

  const handleCheckServer = async (id) => {
    try {
      await fetch(`${API_BASE}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchServers();
    } catch (err) {
      console.error('Error checking server:', err);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', height: '100vh'   }}>
      <Sidebar 
        items={servers} 
        selectedId={selectedServerId} 
        onSelect={setSelectedServerId} 
        onAddServer={handleAddServer}
      />
      <main style={{padding: 16}} className="main-content">
        {selectedServerId ? (
          <ServerDetails 
            serverId={selectedServerId}
            onUpdateServer={handleUpdateServer}
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

