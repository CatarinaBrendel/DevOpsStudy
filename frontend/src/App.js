import React, {useEffect, useState} from 'react';
import './App.css';
import ServerList from './components/ServerList';
import AddServerForm from './components/AddServerForm';
import Sidebar from './components/Sidebar';

const API_BASE = 'http://localhost:3001/api';

function App() {
  const [servers, setServers] = useState([]);
  
  //Load servers from API
  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      const response = await fetch(`${API_BASE}/servers`);
      const data = await response.json();
      setServers(data);
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
      fetchServers()
    } catch (error) {
      console.error('Error adding server:', error);
    }
  };

  const handleUpdateServer = async (id, updatedData) => {
    try {
      await fetch(`${API_BASE}/servers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      fetchServers();
    } catch (err) {
      console.error('Error updating server:', err);
    }
  };
  
  const handleDeleteServer = async (id) => {
    try {
      await fetch(`${API_BASE}/servers/${id}`, {
        method: 'DELETE',
      });
      fetchServers();
    } catch (err) {
      console.error('Error deleting server:', err);
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

  const handleItemStatusCheck = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/status/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }), 
      });

      if (!response.ok) {
        throw new Error(`Error checking service status: ${response.statusText}`);
      } 

      const data = await response.json();
      fetchServers();
    } catch (error) {
      console.error('Error checking service status:', error);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', height: '100vh'   }}>
      <Sidebar 
        items={servers} 
        selectedId={null} 
        onsSelect={() => {}} 
        onAddServer={handleAddServer} 
      />
      <main style={{padding: 16}} className="main-content">
        {/* placeholder for center/right panels */}
        Selected:
      </main>
    </div>
  );
}

export default App;

