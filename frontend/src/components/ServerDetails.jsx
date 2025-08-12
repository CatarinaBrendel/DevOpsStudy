import React, {useEffect, useState, useCallback, useMemo} from "react";
import TrendChart from "./TrendChart";
import { loadSummary, loadHistory } from "../data/api.js";
import RefreshItemButton from "./RefreshItemButton";
import EditServerForm from './EditServerForm';
import EditItemButton from './EditItemButton';
import Modal from "./Modal";
import DeleteItemButton from "./DeleteItemButton";
import ExportButtons from "./ExportButtons";

export default function ServerDetails({ serverId, onTriggerCheck, isTriggering, onUpdateServer, onDeleteServer }) {
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('newest');
  const [latencyFilter, setLatencyFilter] = useState("ALL");
  const [refreshing, setRefreshing] = useState(false);  
  
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

  const handleRefreshClick = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await onTriggerCheck?.(serverId);
      await load();
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  };
  
  const filteredHistory = useMemo(() => {
    let data = Array.isArray(history) ? [...history] : [];

    // Status filter
    if (statusFilter !== 'ALL') {
      data = data.filter(h => h.status === statusFilter);
    }

    // Latency filter (if at leas one boud is provided)
    if (latencyFilter !== "ALL") {
    data = data.filter(h => {
      const l = getRowLatency(h);
      if (!Number.isFinite(l)) return false;

      switch (latencyFilter) {
        case "FAST":   return l < 100;
        case "MEDIUM": return l >= 100 && l <= 500;
        case "SLOW":   return l > 500;
        default:       return true;
      }
    });
  }

    // Time sort 
    data.sort((a, b) => {
      const ta = getRowTs(a);
      const tb = getRowTs(b);

      const aValid = Number.isFinite(ta);
      const bValid = Number.isFinite(tb);

      // push invalid timestamps to the bottom consistently
      if (!aValid && !bValid) return 0;
      if (!aValid) return 1;
      if (!bValid) return -1;

      return sortOrder === 'newest' ? tb - ta : ta - tb;
    });

    return data;
  }, [history, statusFilter, sortOrder, latencyFilter]);
  
  const exportData = useMemo(() => {
    if(!summary) return null;

    const latestRow = Array.isArray(history) && history.length ? history[0] : null;

    // Build detailed rows: time, status, latency, httpStatus
    const historyDetailed = (history || []).map((row) => ({
      time: (() => {
        const ms = getRowTs(row);
        return Number.isFinite(ms) ? new Date(ms).toISOString() : "";
      })(),
      status: row.status ?? "UNKNOWN",
      responseTimeMs: (() => {
        const n = getRowLatency(row);
        return Number.isFinite(n) ? n : null;
      })(),
      httpStatus: row.httpStatus ?? row.code ?? row.statusCode ?? null,
    }));

    return {
      id: summary.server.id ?? serverId,
      name: summary.server.name,
      url: summary.server.url,
      status: summary.server.status || latestRow?.status || "UNKNOWN",
      httpStatus: latestRow?.httpStatus || latestRow?.statusCode,
      responseTime: (() => {
        const n = latestRow ? getRowLatency(latestRow) : NaN;
        return Number.isFinite(n) ? n : null;
      })(),
      lastCheckedAt: 
        summary.lastChecked ??
        latestRow?.ts ??
        latestRow?.timestamp ??
        latestRow?.time ??
        latestRow?.createdAt ??
        latestRow?.checked_at,
      // history for CSV/XLSX (just numbers)
      historyDetailed,
    };
  }, [summary, history, serverId]);

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
            <RefreshItemButton 
              onClick={handleRefreshClick}
              loading={isTriggering}
            />
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
        <h4 className="border-bottom pb-2">History</h4>
        <div className="table-responsive mb-2" style={{ maxHeight: 400, overflow: 'auto' }}>
          <table className="table table-striped table-hover table-sm align-middle">
            <thead className="table-light">
              <tr>
                <th>
                  Time
                  <div>
                    <select 
                      className="form-select form-select-sm mt-1"
                      value={sortOrder}
                      onChange={e => setSortOrder(e.target.value)}
                    >
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                    </select>
                  </div>
                </th>
                <th>
                  Status
                  <div >
                    <select
                      className="form-select form-select-sm mt-1"
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                    >
                      <option value="ALL">All</option>
                      <option value="UP">Up</option>
                      <option value="DOWN">Down</option>
                      <option value="WARN">Warn</option>
                    </select>
                  </div>
                </th>
                <th>
                  Response Time
                  <div>
                    <select
                      className="form-select form-select-sm mt-1"
                      value={latencyFilter}
                      onChange={e => setLatencyFilter(e.target.value)}
                    >
                      <option value="ALL">All</option>
                      <option value="FAST">&lt; 100ms</option>
                      <option value="MEDIUM">100–500ms</option>
                      <option value="SLOW">&gt; 500ms</option>
                    </select>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((row, idx) => {
                // be flexible about backend keys
                const ts = row.ts ?? row.timestamp ?? row.time ?? row.createdAt ?? row.checked_at;
                const timeDisplay = formatDateTime(ts);

                return (
                  <tr key={idx}>
                    <td>{timeDisplay}</td>
                    <td>
                      <span
                        className={`badge ${
                          row.status === 'UP'
                            ? 'bg-success'
                            : row.status === 'DOWN'
                            ? 'bg-danger'
                            : 'bg-warning text-dark'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td>{row.response_time ?? row.responseMs ?? row.latencyMs ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>

          </table>
        </div>
      </div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="d-flex ms-auto gap-2">
          <ExportButtons
              server={exportData}
              filenameBase={`server-${serverId}`}
              onExport={(type) => console.log(`Exported ${type}`)}
            />
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

function toMillis(ts) {
  if (ts == null) return NaN;
  if (typeof ts === 'number') {
    // epoch seconds vs ms
    return ts < 1e12 ? ts * 1000 : ts;
  }
  const t = Date.parse(ts);
  return Number.isFinite(t) ? t : NaN;
}

// Normaliye latency field from API
function getRowLatency(r) {
  const v = r.response_time ?? r.responseMs ?? r.latencyMs ?? r.responseTime;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function formatDateTime(tsLike) {
  const t = toMillis(tsLike);
  if (!Number.isFinite(t)) return '—';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short', // "Aug" style
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(t);
}

function getRowTs(row) {
  const ts = row.ts ?? row.timestamp ?? row.time ?? row.createdAt ?? row.checked_at;
  return toMillis(ts);
}


