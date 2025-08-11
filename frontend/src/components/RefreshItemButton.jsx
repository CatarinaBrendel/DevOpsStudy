import { useState} from "react";
import axios from "axios";

const API_BASE = 'http://localhost:3001/api';

export default function RefreshItemButton ({serverId, onRefresh}) {
    const [loading, setLoading] = useState(false);

    const triggerCheck = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!serverId || loading) return;
        setLoading(true);
        try {
            await axios.post(`${API_BASE}/status/${serverId}`);
            if(onRefresh) onRefresh(); // Refresh data after check
        } catch (error) {
            console.error('Error triggering health check:', error);
        } finally {
            setLoading(false);
        } 
    };

    return (
        <button
        className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
        type="button"
        onClick={triggerCheck}
        disabled={!serverId || loading}
        aria-label="Trigger health check"
        style={{cursor: (!serverId || loading) ? 'not-allowed' : 'pointer'}}
        title={serverId ? 'Trigger health check' : 'Select a server first'}
        >
        <i className="bi bi-arrow-clockwise"></i>
        {loading ? 'Checking…' : 'Refresh Status'}
        </button>
  );
  };