import React, {useState} from 'react';
import axios from 'axios';

const RefreshButton = ({onRefresh}) => {
  const [loading, setLoading] = useState(false);

  const triggerCheck = async () => {
    setLoading(true);
    try {
      await axios.post('http://localhost:3001/check');
      onRefresh(); // Refresh data after check
    } catch (error) {
      console.error('Error triggering health check:', error);
    } finally {
      setLoading(false);
    } 
  };  

  return (
    <div className="text-center my-4">
      <button className="btn btn-primary" onClick={triggerCheck} disabled={loading}>
        {loading ? 'Checking...' : 'Check Now'}
      </button>
    </div>
  );
};

export default RefreshButton;
