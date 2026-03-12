/**
 * @module TaskList
 * @description Renders a list of TaskItem cards with loading, error, and empty states
 */
import React from 'react';
import TaskItem from '../TaskItem/TaskItem';
import './TaskList.css';

/**
 * Skeleton card for loading state
 */
const TaskSkeleton = () => (
  <div className="task-skeleton">
    <div className="task-skeleton__bar" />
    <div className="task-skeleton__main">
      <div className="task-skeleton__line task-skeleton__line--short" />
      <div className="task-skeleton__line task-skeleton__line--long" />
      <div className="task-skeleton__line task-skeleton__line--medium" />
    </div>
  </div>
);

/**
 * Empty state illustration
 */
const EmptyState = () => (
  <div className="task-list__empty">
    <div className="task-list__empty-icon">◫</div>
    <h3 className="task-list__empty-title">No tasks found</h3>
    <p className="task-list__empty-msg">
      Create a new task or adjust your filters to see results
    </p>
  </div>
);

/**
 * TaskList renders all tasks or appropriate fallback UI
 * @param {{
 *   tasks: object[],
 *   loading: boolean,
 *   error: string|null,
 *   pagination: object|null,
 *   onEdit: Function,
 *   onDelete: Function,
 *   onStatusChange: Function,
 *   onPageChange: Function
 * }} props
 */
const TaskList = ({ tasks, loading, error, pagination, onEdit, onDelete, onStatusChange, onPageChange }) => {
  if (loading) {
    return (
      <div className="task-list">
        {Array.from({ length: 4 }).map((_, i) => <TaskSkeleton key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="task-list__error">
        <span className="task-list__error-icon">!</span>
        <p>{error}</p>
      </div>
    );
  }

  if (!tasks.length) {
    return <EmptyState />;
  }

  return (
    <div className="task-list-wrapper">
      <div className="task-list">
        {tasks.map((task) => (
          <TaskItem
            key={task._id}
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="task-list__pagination">
          <button
            className="pagination-btn"
            disabled={!pagination.hasPrevPage}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            ← Prev
          </button>

          <span className="pagination-info">
            {pagination.page} / {pagination.totalPages}
          </span>

          <button
            className="pagination-btn"
            disabled={!pagination.hasNextPage}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskList;
