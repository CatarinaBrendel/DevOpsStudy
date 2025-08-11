import React, { useState } from 'react';

export default function EditServerForm({ initial, onCancel, onSave }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [url, setUrl] = useState(initial?.url ?? '');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Name is required';
    try { new URL(url); } catch { e.url = 'Enter a valid URL (https://...)'; }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    onSave?.({ name: name.trim(), url: url.trim() });
  };

  return (
    <form onSubmit={submit}>
      <h4 className="mb-3">Edit Server</h4>

      <div className="mb-3">
        <label className="form-label">Name</label>
        <input
          className={`form-control ${errors.name ? 'is-invalid' : ''}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        {errors.name && <div className="invalid-feedback">{errors.name}</div>}
      </div>

      <div className="mb-3">
        <label className="form-label">URL</label>
        <input
          className={`form-control ${errors.url ? 'is-invalid' : ''}`}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/health"
        />
        {errors.url && <div className="invalid-feedback">{errors.url}</div>}
      </div>

      <div className="d-flex justify-content-end gap-2">
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary btn-sm">Save</button>
      </div>
    </form>
  );
}
