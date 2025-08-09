import React, {useEffect, useState} from "react";
import { loadHistory } from "../data/loadHistory";
import { loadSummary } from "../data/loadSummary";

export default function ServerDetails({ serverId }) {
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const summaryData = await loadSummary(serverId);
        const historyData = await loadHistory(serverId);

        setSummary(summaryData);
        setHistory(historyData);
      } catch (err) {
        console.error('Error loading server details', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [serverId]);

  if (loading) return <div>Loading...</div>;
  if (!summary) return <div>No data available.</div>;

  return (
    <div className="p-3">
      <h3 className="mb-1">Server Details</h3>
      <h2 className="mb-1">{summary.server.name}</h2>
      <p className="text-muted mb-2">URL: {summary.server.url}</p>
      <p><strong>Uptime (last {summary.days} days):</strong> {summary.uptimePercent ?? '-'}%</p>
      <div className="progress mt-1" style={{ height: "20px" }}>
          <div
            className={`progress-bar ${
              summary.uptimePercent >= 99
                ? "bg-success"
                : summary.uptimePercent >= 90
                ? "bg-warning text-dark"
                : "bg-danger"
            }`}
            role="progressbar"
            style={{ width: `${summary.uptimePercent ?? 0}%` }}
            aria-valuenow={summary.uptimePercent ?? 0}
            aria-valuemin="0"
            aria-valuemax="100"
          >
            {summary.uptimePercent ?? "-"}%
          </div>
      </div>
      {/* Sparkline chart placeholder */}
      <div className="mt-4">
        <h4 className="border-bottom pb-2">Response Time Trend</h4>
        <ul className="list-inline small text-muted">
          {summary.sparkline.map((p, idx) => (
            <li key={idx} className="list-inline-item">{p.t} — {p.ms}ms</li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <h4 className="border-bottomn pb-2">History</h4>
        <div className="table-responsive" style={{maxHeight: '400px'}}>
          <table className="table table-striped table-hover table-sm align-middle">
            <thead className="table-light">
              <tr>
                <th>Time</th>
                <th>Status</th>
                <th>Response Time</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.time}</td>
                  <td>
                    <span className={`badge ${row.status === 'UP' ? 'bg-success' : row.status == 'DOWN' ? 'bg-danger' : 'bg-warning text-dark' }`}>{row.status}</span>
                  </td>
                  <td>{row.response_time ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
