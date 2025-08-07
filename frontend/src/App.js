import React, {useEffect, useState} from 'react';
import './App.css';
import ServerList from './components/ServerList';
import ServerRow from './components/ServerRow';
import AddServerForm from './components/AddServerForm';

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
    <div className="container mt-4">
      <h1 className="mb-4">Service Status Dashboard</h1>

      <AddServerForm onAdd={handleAddServer} />
      <ServerList
        servers={servers}
        onDelete={handleDeleteServer}
        onCheck={handleItemStatusCheck}
        onUpdate={handleUpdateServer}
      />
    </div>
  );
}

export default App;

