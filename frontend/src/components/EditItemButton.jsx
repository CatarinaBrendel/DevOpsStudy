// src/components/EditItemButton.jsx
import React from 'react';

export default function EditItemButton({ onClick }) {
  return (
    <button
      type="button"
      className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
      onClick={onClick}
      aria-label="Edit server name and URL"
      title="Edit"
    >
      <i className="bi bi-pencil"></i>
      Edit
    </button>
  );
}
