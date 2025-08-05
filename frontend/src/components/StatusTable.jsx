import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StatusTable = ({refreshKey}) => {
 const [statusData, setStatusData] = useState([]);
  useEffect(() => {
    fetchStatusData();
  }, [refreshKey]);
  
  const fetchStatusData = async () => {
    try {
      const response = await axios.get('http://localhost:3001/status');
      setStatusData(response.data);
    } catch (error) {
      console.error('Error fetching status data:', error);
    }
  };


  return (
    <div className="container mt-5">
      <h1 className="mb-4">Service Status Dashboard</h1>
      <table className="table table-bordered table-striped">
        <thead className="table-light">
          <tr>
            <th>Service</th>
            <th>Status</th>
            <th>Response Time (ms)</th>
            <th>Checked at</th>
          </tr>
        </thead>
        <tbody>
          {statusData.map((row) => (
            <tr key={row.id}>
              <td>{row.service_name}</td>
              <td style={{color: row.status === 'UP' ? 'green' : 'red'}}>{row.status}</td>
              <td>{row.response_time}</td>
              <td>{row.checked_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StatusTable;
