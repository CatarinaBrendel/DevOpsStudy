import { useEffect, useMemo, useState } from "react";
import { fetchSidebarItems } from "../data/loadServers";
import Sparkline from './Sparkline';

const StatusChip = ({ value, active, onClick, children }) => (
    <button
        className={`chip ${active ? 'chip--active' : ''}`}
        onClick={() => onClick(value)}
    >
        {children}
    </button>
);

const StatusDot = ({ status }) => (
    <span className={`dot dot--${status}`} aria-label={status} />
);

export default function Sidebar({ items=[], selectedId, onSelect, onAddServer}) {
    const [servers, setServers] = useState(items);
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');    

    useEffect(() => {
        let alive = true;
        const load = async () => {
            try {
                const data = await fetchSidebarItems();
                console.log("Data: ", data);

                if (alive) setServers(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error('[Sidebar] fetch failed', e);
            }
        };

        load();
        
        const interval = setInterval(load, 30000); // refresh every 30 seconds
        
        return () => {alive = false; clearInterval(interval);}
    }, []); // Refresh every 10 seconds 
    
    const filtered = useMemo(() => {
        const qry = query.trim().toLowerCase();
        return servers.filter(s => {
            const byQ = !qry || s.name.toLowerCase().includes(qry);
            const byStatus = statusFilter === 'all' || s.status === statusFilter;
            return byQ && byStatus;
        })
    }, [servers, query, statusFilter]);

    return (
        <aside className="sidebar">
            <div className="sidebar__search">
                <input 
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search servers..."
                    aria-label="Search servers"
                    className="search-input"
                />
            </div>
            <div className="sidebar__chips">
                <StatusChip value="all" active={statusFilter === 'all'} onClick={setStatusFilter}>All</StatusChip>
                <StatusChip value="up" active={statusFilter === 'up'} onClick={setStatusFilter}>UP</StatusChip>
                <StatusChip value="down" active={statusFilter === 'down'} onClick={setStatusFilter}>DOWN</StatusChip>
                <StatusChip value="unknown" active={statusFilter === 'unknown'} onClick={setStatusFilter}>UNKNOWN</StatusChip>
            </div>
            <nav className="server__list" aria-label="Servers">
                {filtered.map(server => (
                    <button className="row" /* ... */>
                        <StatusDot status={server.status} />
                        <div className="row__main">
                            <div className="row__name">{server.name}</div>
                            <Sparkline points={server.history} status={server.status} />
                        </div>
                        <div className="row__meta">
                            {server.status === 'down' ? '' : `${server.responseTime} ms`}
                        </div>
                    </button>
                ))}
            </nav>
            <div className="sidebar__footer">
                <button className="add" onClick={onAddServer}> + Add Server</button>
            </div>
        </aside>
    );
}

