/**
 * @module TaskItem
 * @description Individual task card with status toggle, edit, and delete actions
 */
import React, { useState } from 'react';
import './TaskItem.css';

const STATUS_CYCLE = { pending: 'in-progress', 'in-progress': 'completed', completed: 'pending' };
const PRIORITY_COLORS = { high: 'var(--red)', medium: 'var(--yellow)', low: 'var(--green)' };
const STATUS_COLORS = {
  pending: 'var(--text-muted)',
  'in-progress': 'var(--blue)',
  completed: 'var(--green)',
};

/**
 * Format ISO date string to readable date
 * @param {string} dateStr
 * @returns {string}
 */
const formatDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Check if a date is overdue
 * @param {string} dateStr
 * @returns {boolean}
 */
const isOverdue = (dateStr) => {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
};

/**
 * TaskItem renders a single task card
 * @param {{ task: object, onEdit: Function, onDelete: Function, onStatusChange: Function }} props
 */
const TaskItem = ({ task, onEdit, onDelete, onStatusChange }) => {
  const [statusLoading, setStatusLoading] = useState(false);

  /**
   * Cycle task status to next value
   */
  const handleStatusToggle = async () => {
    const nextStatus = STATUS_CYCLE[task.status];
    setStatusLoading(true);
    try {
      await onStatusChange(task._id, nextStatus);
    } finally {
      setStatusLoading(false);
    }
  };

  const overdue = task.status !== 'completed' && isOverdue(task.dueDate);

  return (
    <article className={`task-item ${task.status === 'completed' ? 'task-item--done' : ''}`}>
      <div
        className="task-item__priority-bar"
        style={{ background: PRIORITY_COLORS[task.priority] }}
        title={`${task.priority} priority`}
      />

      <div className="task-item__main">
        <div className="task-item__header">
          <button
            className={`task-item__status-btn ${statusLoading ? 'task-item__status-btn--loading' : ''}`}
            onClick={handleStatusToggle}
            disabled={statusLoading}
            title={`Current: ${task.status} — click to advance`}
            style={{ color: STATUS_COLORS[task.status] }}
            aria-label={`Status: ${task.status}`}
          >
            {statusLoading ? (
              <span className="spinner-sm" />
            ) : (
              <span className="task-item__status-dot" />
            )}
            <span className="task-item__status-label">{task.status}</span>
          </button>

          <div className="task-item__actions">
            <button
              className="task-item__action-btn"
              onClick={() => onEdit(task)}
              aria-label="Edit task"
              title="Edit"
            >
              ✎
            </button>
            <button
              className="task-item__action-btn task-item__action-btn--danger"
              onClick={() => onDelete(task._id)}
              aria-label="Delete task"
              title="Delete"
            >
              ✕
            </button>
          </div>
        </div>

        <h3 className="task-item__title">{task.title}</h3>

        {task.description && (
          <p className="task-item__description">{task.description}</p>
        )}

        <div className="task-item__meta">
          {task.dueDate && (
            <span className={`task-item__due ${overdue ? 'task-item__due--overdue' : ''}`}>
              {overdue ? '⚠ ' : ''}
              {formatDate(task.dueDate)}
            </span>
          )}

          <span className="task-item__priority" style={{ color: PRIORITY_COLORS[task.priority] }}>
            {task.priority}
          </span>

          {task.tags && task.tags.length > 0 && (
            <div className="task-item__tags">
              {task.tags.map((tag) => (
                <span key={tag} className="task-item__tag">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default TaskItem;
