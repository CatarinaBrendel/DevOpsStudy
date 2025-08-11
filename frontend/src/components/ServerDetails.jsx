import React, {useEffect, useState, useCallback} from "react";
import TrendChart from "./TrendChart";
import { loadHistory } from "../data/loadHistory";
import { loadSummary } from "../data/loadSummary";
import RefreshItemButton from "./RefreshItemButton";
import EditServerForm from './EditServerForm';
import EditItemButton from './EditItemButton';
import Modal from "./Modal";
import DeleteItemButton from "./DeleteItemButton";

export default function ServerDetails({ serverId, onUpdateServer, onDeleteServer }) {
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  const load = useCallback(async () => {
    if(!serverId) return;
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
  }, [serverId]);

  const handleSave = async({name, url}) => {
    await onUpdateServer?.(serverId, {serverName: name, serverUrl: url});
    setShowEdit(false);
    load();
  };

  useEffect(() => {
    load();
  }, [load]);

  if (!summary) {
    return (
      <div className="p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
           <h3 className="mb-0">Server Details</h3>
           <div className="ms-auto">
              <RefreshItemButton serverId={serverId} onRefresh={load} />
           </div>
        </div>
        {loading ? <div>Loading...</div> : <div className="text-muted">No data!</div>}
      </div>)
  }

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h3 className="mb-1">Server Details</h3>
        <div className="ms-auto">
            <RefreshItemButton serverId={serverId} onRefresh={load} />
        </div>
      </div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h2 className="mb-1">{summary.server.name}</h2>
        <div className="ms-auto">
          <EditItemButton onClick={() => setShowEdit(true)}/>
        </div>
      </div>
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
        <TrendChart 
          key={`${serverId} : ${summary?.lastChecked ?? ''}`}
          points={summary.sparkline} height={180} />
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
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="ms-auto">
          <DeleteItemButton
              itemName={summary.server.name}
              onConfirm={() => onDeleteServer?.(serverId)}
            />
        </div>
      </div>
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)}>
        <EditServerForm 
          initial={{ name: summary.server.name, url: summary.server.url }}
          onCancel={() => setShowEdit(false)}
          onSave={handleSave}
        />
      </Modal>
    </div>
  );
}
