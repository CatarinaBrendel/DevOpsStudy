import React, {useEffect, useState} from 'react';
import './App.css';
import StatusTable from './components/StatusTable';
import RefreshButton from './components/RefreshButton';

function App() {
  const [refreshKey, setRefreshKey] = useState([0]);
  
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1); // triggers table re-fetch
  };

  return (
    <div>
      <StatusTable refreshKey={refreshKey}  />
      <RefreshButton onRefresh={handleRefresh}/>
    </div>
  );
}

export default App;

