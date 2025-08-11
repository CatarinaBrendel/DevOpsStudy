import React from "react";
import { Search, Funnel, ArrowRepeat, HddStack } from "react-bootstrap-icons";

export default function EmptyServerState({
  hasServers = true,
  onAddServer,
  onSelectServer,
}) {
  return (
    <section
      className="empty-state d-flex align-items-center justify-content-center w-100"
      style={{
        background:
          "radial-gradient(circle at 1px 1px, color-mix(in oklab, var(--bs-primary) 16%, transparent), transparent 2px) 0 0/24px 24px",
      }}
    >
      <div className="empty-card card shadow border-0">
        <div className="card-body p-4 p-md-5 text-center">
          <div
            className="mx-auto mb-3 d-inline-flex align-items-center justify-content-center rounded-circle border bg-white"
            style={{ width: 96, height: 96, borderColor: "#e9ecef" }}
          >
            <HddStack size={40} className="text-primary" />
          </div>

          <h2 className="fw-semibold mb-1">
            {hasServers ? "No server selected" : "No servers yet"}
          </h2>

          <p className="text-body-secondary mb-4 mx-auto" style={{ maxWidth: 520 }}>
            {hasServers
              ? "Select a server from the list on the left to view its status, uptime, and response metrics."
              : "Add your first server to start monitoring uptime, latency, and trends—all in one place."}
          </p>

          <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center mb-4">
            {hasServers ? (
              <button type="button" className="btn btn-primary" onClick={onSelectServer}>
                Select a server
              </button>
            ) : (
              <button type="button" className="btn btn-success" onClick={onAddServer}>
                + Add your first server
              </button>
            )}
          </div>

          <div className="row g-2 g-sm-3 justify-content-center">
            <div className="col-auto">
              <Tip icon={<Search size={16} />} title="Search" desc="Find servers by name" />
            </div>
            <div className="col-auto">
              <Tip icon={<Funnel size={16} />} title="Filter" desc="Show Up / Down / Warn" />
            </div>
            <div className="col-auto">
              <Tip icon={<ArrowRepeat size={16} />} title="Auto‑refresh" desc="Live pings every 60s" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Tip({ icon, title, desc }) {
  return (
    <div
      className="d-flex align-items-start gap-2 p-2 border rounded-3 bg-white"
      style={{ minWidth: 220, borderColor: "#e9ecef" }}
    >
      <div
        className="d-flex align-items-center justify-content-center rounded-2 border border-primary-subtle bg-primary-subtle"
        style={{ width: 36, height: 36 }}
      >
        {icon}
      </div>
      <div className="text-start small">
        <div className="fw-medium text-body-emphasis">{title}</div>
        <div className="text-body-secondary">{desc}</div>
      </div>
    </div>
  );
}
