import React, {useState} from "react";

const ServerRow = ({ server, onDelete, onCheck, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [serverName, setServerName] = useState(server.name);
    const [serverUrl, setServerUrl] = useState(server.url);

    const handleSave = () => {
        if (!serverName || !serverUrl) {
            alert("Name and URL are required");
            return;
        }
        onUpdate(server.id, { serverName: serverName, serverUrl: serverUrl });
        setIsEditing(false);
    };  

    return (
        <tr>
            <td>
                {isEditing ? (
                    <input
                    className="form-control form-control-sm"
                    value={serverName}
                    onChange={(e) => setServerName(e.target.value)}
                    />
                ) : (
                    server.name
                )}
            </td>
            <td>
               {isEditing ? (
                    <input
                        className="form-control form-control-sm"
                        value={serverUrl}
                        onChange={(e) => setServerUrl(e.target.value)}
                    />
                    ) : (
                    server.url
                )}
            </td>
            <td>
                <span className={`badge ${server.status === 'UP' ? 'bg-success' : 'bg-danger'}`}>
                    {server.status || 'UNKNOWN'}
                </span>
            </td>
            <td>{server.response_time ?? '-'} ms</td>
            <td>{server.last_checked ?? '-'}</td>
            <td>
                {isEditing ? (
                    <>
                        <button className="btn btn-sm btn-success me-2" onClick={handleSave}>
                        Save
                        </button>
                        <button className="btn btn-sm btn-secondary me-2" onClick={() => setIsEditing(false)}>
                        Cancel
                        </button>
                    </>
                    ) : (
                    <>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => onCheck(server.id)}>
                        Check
                        </button>
                        <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => setIsEditing(true)}>
                        Edit
                        </button>
                        <button className="btn btn-sm btn-outline-danger me-2" onClick={() => onDelete(server.id)}>
                        Delete
                        </button>
                    </>
                    )}
            </td>
        </tr>
    );
}

export default ServerRow;