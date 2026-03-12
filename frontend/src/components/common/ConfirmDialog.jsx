/**
 * @module ConfirmDialog
 * @description Modal confirmation dialog for destructive actions
 */
import React from 'react';
import './ConfirmDialog.css';

/**
 * ConfirmDialog renders a modal asking user to confirm an action
 * @param {{ message: string, onConfirm: Function, onCancel: Function, loading: boolean }} props
 */
const ConfirmDialog = ({ message, onConfirm, onCancel, loading = false }) => (
  <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
    <div className="confirm-dialog" role="alertdialog" aria-modal="true">
      <div className="confirm-dialog__icon">!</div>
      <h3 className="confirm-dialog__title">Confirm Action</h3>
      <p className="confirm-dialog__message">{message}</p>
      <div className="confirm-dialog__actions">
        <button className="btn btn--ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button className="btn btn--danger" onClick={onConfirm} disabled={loading}>
          {loading ? <span className="btn-spinner" /> : null}
          Delete
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmDialog;
