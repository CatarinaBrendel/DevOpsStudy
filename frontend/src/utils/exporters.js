export function exportServerCSV(server, filenameBase) {
  if (!server) return;

  const header = [
    "id","name","url","status","httpStatus","responseTime","lastCheckedAt"
  ].join(",");

  const baseRow = [
    server.id ?? "",
    JSON.stringify(server.name ?? ""),
    JSON.stringify(server.url ?? ""),
    server.status ?? "",
    server.httpStatus ?? "",
    server.responseTime ?? "",
    server.lastCheckedAt ? new Date(server.lastCheckedAt).toISOString() : ""
  ].join(",");

  // Prefer detailed rows if present
  const detailed = Array.isArray(server.historyDetailed) ? server.historyDetailed : null;

  let historySectionHeader = "time,status,responseTimeMs,httpStatus";
  let historyLines = [];

  if (detailed) {
    historyLines = detailed.map(r =>
      [
        r.time ?? "",
        r.status ?? "",
        (r.responseTimeMs ?? "") === null ? "" : r.responseTimeMs,
        r.httpStatus ?? ""
      ]
      .map(v => (typeof v === "string" ? JSON.stringify(v) : v))
      .join(",")
    );
  } else {
    // fallback to numeric history
    historySectionHeader = "sampleIndex,responseTimeMs";
    const nums = Array.isArray(server.history) ? server.history : [];
    historyLines = nums.map((ms, i) => `${i + 1},${ms}`);
  }

  const csv = [
    "# Server Summary",
    header,
    baseRow,
    "",
    "# History",
    historySectionHeader,
    ...historyLines,
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const name = (filenameBase || (server.name || "server")).toString().trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "server";
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const filename = `${name}_${stamp}.csv`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export async function exportServerXLSX(server, filenameBase) {
  if (!server) return;
  const XLSX = await import("xlsx");

  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryAoa = [
    ["Id", server.id ?? ""],
    ["Name", server.name ?? ""],
    ["URL", server.url ?? ""],
    ["Status", server.status ?? ""],
    ["HTTP Status", server.httpStatus ?? ""],
    ["Response Time (ms)", server.responseTime ?? ""],
    ["Last Checked At", server.lastCheckedAt ? new Date(server.lastCheckedAt).toISOString() : ""],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  // History sheet
  if (Array.isArray(server.historyDetailed) && server.historyDetailed.length) {
    const wsHist = XLSX.utils.json_to_sheet(server.historyDetailed, {
      header: ["time", "status", "responseTimeMs", "httpStatus"],
    });
    XLSX.utils.book_append_sheet(wb, wsHist, "History");
  } else {
    const nums = Array.isArray(server.history) ? server.history : [];
    const rows = nums.map((ms, idx) => ({ sampleIndex: idx + 1, responseTimeMs: ms }));
    const wsHist = XLSX.utils.json_to_sheet(rows, { header: ["sampleIndex", "responseTimeMs"] });
    XLSX.utils.book_append_sheet(wb, wsHist, "History");
  }

  const name = (filenameBase || (server.name || "server")).toString().trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "server";
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  XLSX.writeFile(wb, `${name}_${stamp}.xlsx`);
}
