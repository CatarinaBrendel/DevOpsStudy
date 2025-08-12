import { exportServerCSV, exportServerXLSX } from "../utils/exporters";

export default function ExportButtons({ server, filenameBase, onExport }) {
  if (!server) return null;

  const handleCSV = async (e) => {
    e.stopPropagation();
    exportServerCSV(server, filenameBase);
    onExport?.("csv");
  };

  const handleXLSX = async (e) => {
    e.stopPropagation();
    await exportServerXLSX(server, filenameBase);
    onExport?.("xlsx");
  };

  return (
    <div className="d-flex export-buttons gap-2">
          <button className="btn btn-outline-primary btn-sm" onClick={handleCSV}>Export CSV</button>
          <button className="btn btn-outline-primary btn-sm" onClick={handleXLSX}>Export Excel</button>
    </div>
  );
}
