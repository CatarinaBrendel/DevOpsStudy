// src/components/EditItemButton.jsx
import React, { useState } from 'react';
import Modal from './Modal';

export default function DeleteItemButton({ itemName = 'this server', onConfirm }) {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);

    const handleDelete = async () => {
        try {
            setBusy(true);
            await onConfirm?.();
            setOpen(false);
        } catch(error) {
            console.log('Error trying to delete item: ', error.message);
        } finally {
            setBusy(false);
        }
    };

    return (
    <div>
        <button
        type="button"
        className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        aria-label={`Delete ${itemName}`}
        title="Delete"
      >
        <i className="bi bi-trash"></i>
        Delete
      </button>

      <Modal isOpen={open} onClose={() => !busy && setOpen(false)}>
        <h4 className="mb-2">Delete {itemName}?</h4>
        <p className="text-muted">This action cannot be undone.</p>
        <div className="d-flex justify-content-end gap-2 mt-3">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete} disabled={busy}>
            {busy ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
