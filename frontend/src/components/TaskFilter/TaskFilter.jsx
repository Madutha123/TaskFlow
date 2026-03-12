/**
 * @module TaskFilter
 * @description Filter and sort controls for the task list
 */
import React from 'react';
import { useTaskContext } from '../../context/TaskContext';
import './TaskFilter.css';

/**
 * TaskFilter renders dropdowns for status, priority, sort field, and order
 * @param {{ onFilter: Function }} props
 */
const TaskFilter = ({ onFilter }) => {
  const { state, setFilters } = useTaskContext();
  const { filters } = state;

  /**
   * Handle filter field change
   * @param {React.ChangeEvent<HTMLSelectElement>} e
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...filters, [name]: value };
    setFilters(updated);
    onFilter(updated);
  };

  const handleReset = () => {
    const reset = { q: '', status: '', priority: '', sortBy: 'createdAt', order: 'desc' };
    setFilters(reset);
    onFilter(reset);
  };

  const hasActiveFilters = (filters.q && filters.q.trim()) || filters.status || filters.priority;

  return (
    <div className="task-filter">
      <div className="task-filter__search">
        <label className="task-filter__search-label" htmlFor="filter-q">SEARCH</label>
        <div className="task-filter__search-wrapper">
          <span className="task-filter__search-icon">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="9" y1="9" x2="12.5" y2="12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
            </svg>
          </span>
          <input
            id="filter-q"
            type="text"
            name="q"
            className="task-filter__search-input"
            placeholder="Search by title..."
            value={filters.q || ''}
            onChange={handleChange}
            autoComplete="off"
          />
        </div>
      </div>
      <div className="task-filter__bottom">
      <div className="task-filter__controls">
        <div className="task-filter__group">
          <label className="task-filter__label" htmlFor="filter-status">STATUS</label>
          <select
            id="filter-status"
            name="status"
            className="task-filter__select"
            value={filters.status}
            onChange={handleChange}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="task-filter__group">
          <label className="task-filter__label" htmlFor="filter-priority">PRIORITY</label>
          <select
            id="filter-priority"
            name="priority"
            className="task-filter__select"
            value={filters.priority}
            onChange={handleChange}
          >
            <option value="">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="task-filter__group">
          <label className="task-filter__label" htmlFor="filter-sortBy">SORT BY</label>
          <select
            id="filter-sortBy"
            name="sortBy"
            className="task-filter__select"
            value={filters.sortBy}
            onChange={handleChange}
          >
            <option value="createdAt">Created</option>
            <option value="updatedAt">Updated</option>
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
          </select>
        </div>

        <div className="task-filter__group">
          <label className="task-filter__label" htmlFor="filter-order">ORDER</label>
          <select
            id="filter-order"
            name="order"
            className="task-filter__select"
            value={filters.order}
            onChange={handleChange}
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <button className="task-filter__reset" onClick={handleReset} type="button">
          Clear filters
        </button>
      )}
      </div>
    </div>
  );
};

export default TaskFilter;
