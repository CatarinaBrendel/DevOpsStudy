import React from "react";

const AddServerForm = ({ onAdd }) => {
    const [serverName, setServerName] = React.useState("");
    const [serverUrl, setServerUrl] = React.useState("");
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if ((!serverName || !serverUrl)) return;

        await onAdd({ serverName: serverName.trim(), serverUrl: serverUrl.trim() });
        setServerName('');
        setServerUrl('');
    };
    
    return (
        <form onSubmit={handleSubmit} className="row g-3 mb-4">
        <div className="col-md-4">
            <input
            type="text"
            className="form-control"
            placeholder="Server Name"
            value={serverName}
            onChange={(e) => setServerName(e.target.value)}
            required
            />
        </div>
        <div className="col-md-6">
            <input
            type="url"
            className="form-control"
            placeholder="https://your-api.com/"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            required
            />
        </div>
        <div className="col-md-2">
           <button type="submit" className="btn btn-success w-100">Add Server</button>
        </div>
        </form>
    );
};

export default AddServerForm;