export default function RefreshItemButton ({onClick, loading}) {
    return (
        <button
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
            type="button"
            onClick={onClick}
            disabled={loading}
            aria-label="Trigger health check"
            aria-busy={loading || undefined}
        >
        <i className="bi bi-arrow-clockwise"></i>
        {loading ? 'Checking…' : 'Refresh Status'}
        </button>
  );
  };