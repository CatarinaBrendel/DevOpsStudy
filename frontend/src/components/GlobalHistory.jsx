import React, {useCallback, useEffect, useState, useMemo} from "react";
import { loadGlobalHistory } from "../data/api";

export default function GlobalHistory({historyData, servers=[], onRefresh, loading, error, refreshTrigger}) {
  // Filters
  const [timeOrder, setTimeOrder] = useState("desc"); // 'desc' newest first, 'asc' oldest first
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'up' | 'down' | 'warn'
  const [serverFilter, setServerFilter] = useState(""); // '' = all

  useEffect(() => {
      setTimeOrder("desc");
      setStatusFilter("all");
      setServerFilter("");
    }, [refreshTrigger]);

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

  const badgeClass = (status) => {
    const s = String(status).toLowerCase();
    if (s === "up")   return "badge rounded-pill bg-success-subtle text-success-emphasis border border-success-subtle";
    if (s === "down") return "badge rounded-pill bg-danger-subtle text-danger-emphasis border border-danger-subtle";
    return "badge rounded-pill bg-warning-subtle text-warning-emphasis border border-warning-subtle";
  };

  const filteredHistory = useMemo(() => {
    let result = [...historyData];

    if (statusFilter !== "all") {
      result = result.filter((item) => item.status.toLowerCase() === statusFilter);
    }

    if (serverFilter) {
      result = result.filter((item) => item.server === serverFilter);
    }

    result.sort((a, b) => {
      const ta = new Date(a.time).getTime();
      const tb = new Date(b.time).getTime();
      return timeOrder === "asc" ? ta - tb : tb - ta;
    });

    return result;
  }, [historyData, timeOrder, statusFilter, serverFilter]);

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between">
          <h2 className="h4 fw-semibold mb-0">Global History</h2>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={onRefresh} 
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
        {/* Filters toolbar: Time, Status, Server */}
        <div className="d-flex flex-wrap gap-2 mt-3">
          
          {/* Time */}
        <div className="d-flex align-items-center gap-2">
          <label className="form-label mb-0 small text-body-secondary">Time</label>
          <select
            className="form-select form-select-sm"
            value={timeOrder}
            onChange={(e) => setTimeOrder(e.target.value)}
            style={{ minWidth: 80 }}
          >
            <option value="desc">Newest</option>
            <option value="asc">Oldest</option>
          </select>
        </div>

          {/* Status */}
        <div className="d-flex align-items-center gap-2">
          <label className="form-label mb-0 small text-body-secondary">Status</label>
          <select
            className="form-select form-select-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ minWidth: 70 }}
          >
            <option value="all">All</option>
            <option value="up">Up</option>
            <option value="down">Down</option>
            <option value="warn">Warn</option>
          </select>
        </div>

          {/* Server */}
          <div className="d-flex align-items-center gap-2">
            <label className="form-label mb-0 small text-body-secondary">Server</label>
            <select
              className="form-select form-select-sm"
              value={serverFilter}
              onChange={(e) => setServerFilter(e.target.value)}
              style={{ minWidth: 110 }}
            >
              <option value="">All servers</option>
              {servers.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <hr className="mt-3 mb-2" />

        {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}
        {loading && <div className="text-body-secondary mb-3">Loading…</div>}

        {!loading && (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col">Time</th>
                  <th scope="col">Server</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item, idx) => {
                  return (
                    <tr key={idx}>
                      <td title={formatExact(item.time)}>{formatRelative(item.time)}</td>
                      <td className="fw-medium">{item.server}</td>
                      <td><span className={badgeClass(item.status)}>{item.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
