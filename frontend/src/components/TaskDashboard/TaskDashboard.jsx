/**
 * @module TaskDashboard
 * @description Main dashboard — orchestrates filter, stats, list, and form modals
 */
import React, { useState, useEffect, useCallback } from 'react';
import useTasks from '../../hooks/useTasks';
import { useTaskContext } from '../../context/TaskContext';
import TaskStats from '../TaskStats/TaskStats';
import TaskFilter from '../TaskFilter/TaskFilter';
import TaskList from '../TaskList/TaskList';
import TaskForm from '../TaskForm/TaskForm';
import ConfirmDialog from '../common/ConfirmDialog';
import './TaskDashboard.css';

/**
 * TaskDashboard is the root view of the application
 * @param {{ showToast: Function }} props
 */
const TaskDashboard = ({ showToast }) => {
  const { state } = useTaskContext();
  const {
    tasks,
    loading,
    error,
    pagination,
    filters,
    fetchTasks,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
  } = useTasks();

  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /**
   * Load tasks whenever filters or page changes
   */
  useEffect(() => {
    fetchTasks({ ...filters, page });
  }, [filters, page]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Handle filter changes — reset to page 1
   * @param {object} newFilters
   */
  const handleFilter = useCallback((newFilters) => {
    setPage(1);
    fetchTasks({ ...newFilters, page: 1 });
  }, [fetchTasks]);

  /**
   * Open create form
   */
  const handleNewTask = () => {
    setEditingTask(null);
    setFormOpen(true);
  };

  /**
   * Open edit form for a task
   * @param {object} task
   */
  const handleEdit = (task) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  /**
   * Handle form submission (create or update)
   * @param {object} data
   */
  const handleFormSubmit = async (data) => {
    setFormLoading(true);
    try {
      if (editingTask) {
        await updateTask(editingTask._id, data);
        showToast('Task updated successfully', 'success');
      } else {
        await createTask(data);
        showToast('Task created successfully', 'success');
      }
      setFormOpen(false);
      setEditingTask(null);
      fetchTasks({ ...filters, page });
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  /**
   * Handle status change inline
   * @param {string} id
   * @param {string} status
   */
  const handleStatusChange = async (id, status) => {
    try {
      await updateTaskStatus(id, status);
      showToast('Status updated', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  /**
   * Prompt for delete confirmation
   * @param {string} id
   */
  const handleDeletePrompt = (id) => {
    setDeleteTarget(id);
  };

  /**
   * Execute confirmed deletion
   */
  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await deleteTask(deleteTarget);
      showToast('Task deleted', 'success');
      setDeleteTarget(null);
      if (tasks.length === 1 && page > 1) {
        setPage((p) => p - 1);
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete task', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <main className="dashboard">
      <div className="dashboard__header">
        <div>
          <p className="dashboard__eyebrow">TASK MANAGER</p>
          <h1 className="dashboard__title">Your Workspace</h1>
        </div>
        <button className="dashboard__new-btn" onClick={handleNewTask}>
          + New Task
        </button>
      </div>

      <TaskStats />

      <section className="dashboard__content">
        <TaskFilter onFilter={handleFilter} />

        <TaskList
          tasks={tasks}
          loading={loading}
          error={error}
          pagination={pagination}
          onEdit={handleEdit}
          onDelete={handleDeletePrompt}
          onStatusChange={handleStatusChange}
          onPageChange={setPage}
        />
      </section>

      {formOpen && (
        <TaskForm
          task={editingTask}
          onSubmit={handleFormSubmit}
          onClose={() => { setFormOpen(false); setEditingTask(null); }}
          loading={formLoading}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          message="Are you sure you want to delete this task? This action cannot be undone."
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </main>
  );
};

export default TaskDashboard;
