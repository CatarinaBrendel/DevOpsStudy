import { useEffect, useMemo, useState } from "react";
import { fetchSidebarItems } from "../data/loadServers";
import Sparkline from './Sparkline';
import Modal from './Modal';

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
    //const [servers, setServers] = useState(items);
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');   
    const [showModal, setShowModal] = useState(false);
    const [serverName, setServerName] = useState("");
    const [serverUrl, setServerUrl] = useState("");
    
    const handleClick = async (e) => {
        e.preventDefault();
        onAddServer({serverName, serverUrl});
        setShowModal(false);
        setServerName("");
        setServerUrl("");       
    }; 

    const filtered = useMemo(() => {
        const qry = query.trim().toLowerCase();
        return items.filter(s => {
            const byQ = !qry || s.name.toLowerCase().includes(qry);
            const byStatus = statusFilter === 'all' || s.status === statusFilter;
            return byQ && byStatus;
        })
    }, [items, query, statusFilter]);

    return (
        <div>
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
                    <StatusChip value="warn" active={statusFilter === 'warn'} onClick={setStatusFilter}>WARN</StatusChip>
                </div>
                <nav className="sidebar__list" aria-label="Servers">
                    {filtered.map(server => (
                        <button 
                            type="button" 
                            className={`row ${server.id === selectedId ? 'row--selected' : ''}`} 
                            key={server.id}
                            onClick={() => onSelect(server.id)}>
                            <div className="row__left">
                                <StatusDot status={server.status} />
                                <div className="row__text">
                                    <div className="row__name">{server.name}</div>
                                </div>
                            </div>
                                <div className="row__right">
                                    <div className="row__spark">
                                        <Sparkline points={server.history} status={server.status} />
                                    </div>
                                    <div className="row__meta">
                                        {server.status === 'down' && <span className="badge badge--down">Down</span>}
                                        {server.status === 'warn' && <span className="badge badge--warn">Warn</span>}
                                        {server.status === 'up' && <span className="badge badge--up">Up</span>}
                                        <span className="latency">{server.responseTime} ms</span>
                                    </div>
                                </div>
                        </button>
                    ))}
                </nav>
                <div className="sidebar__footer">
                    <button type="button" className="btn tbn-light " onClick={() => setShowModal(true)}> + Add Server</button>
                    <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
                        <h3>Add New Server</h3>
                        <form onSubmit={handleClick}>
                            <input
                            type="text"
                            placeholder="Server Name"
                            value={serverName}
                            onChange={(e) => setServerName(e.target.value)}
                            required
                            />
                            <input
                            type="text"
                            placeholder="Server Url"
                            value={serverUrl}
                            onChange={(e) => setServerUrl(e.target.value)}
                            required
                            />
                            <div className="modal-buttons">
                            <button type="submit" className="btn primary">Add</button>
                            <button type="button" className= "btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            </div>
                        </form>
                        </Modal>
                </div>
            </aside>
        </div>
    );
}

