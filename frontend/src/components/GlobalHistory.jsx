import React, {useEffect, useState} from "react";

export default function GlobalHistory() {
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/global-history"); // Your endpoint
        const data = await res.json();
        setHistoryData(data.slice(0, 10)); // Keep last 10 entries
      } catch (err) {
        console.error("Error fetching history:", err);
      }
    }
    fetchData();
  }, []);

  const formatRelative = (time) => {
    const diff = Math.floor((Date.now() - new Date(time)) / 1000);
    if (diff < 60) return `${diff} sec ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return new Date(time).toLocaleDateString();
  };

  const formatExact = (time) => {
    return new Date(time).toLocaleString();
  };

  return (
    <div className="global-history">
      <h2>Global History</h2>
      <table className="history-table">
        <thead>
          <tr>
            <th>Last Checked</th>
            <th>Server</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {historyData.map((item, idx) => (
            <tr key={idx}>
              <td title={formatExact(item.time)}>{formatRelative(item.time)}</td>
              <td>{item.server}</td>
              <td>
                <span className={`status ${item.status.toLowerCase()}`}>
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
