import React from 'react';
import ServerRow from './ServerRow';

const ServerList = ({ servers, onDelete, onCheck, onUpdate }) => {
    if (!servers || servers.length === 0) {
        return <div className="text-center text-gray-500">No servers being monitored yet</div>;
    }

    return (
        <table>
            <thead>
                <tr>
                    <th className="text-left">Server Name</th>
                    <th className="text-left">IP Address</th>
                    <th className="text-left">Status</th>
                    <th className="text-left">Response Time</th>
                    <th className="text-left">Last Checked</th>
                    <th className="text-left">Actions</th>
                </tr>
            </thead>
            <tbody>
                {servers.map((server) => (
                    <ServerRow
                        key={server.id}
                        server={server}
                        onDelete={onDelete}
                        onCheck={onCheck}
                        onUpdate={onUpdate}
                    />
                ))}
            </tbody>        
        </table>
    );
};

export default ServerList;