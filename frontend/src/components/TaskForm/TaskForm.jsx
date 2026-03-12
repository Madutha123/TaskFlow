/**
 * @module TaskForm
 * @description Form component for creating and editing tasks
 */
import React, { useState, useEffect } from 'react';
import './TaskForm.css';

const STATUSES = ['pending', 'in-progress', 'completed'];
const PRIORITIES = ['low', 'medium', 'high'];

const emptyForm = {
  title: '',
  description: '',
  status: 'pending',
  priority: 'medium',
  dueDate: '',
  tags: '',
};

/**
 * TaskForm renders a modal form for creating or editing a task
 * @param {{ task?: object, onSubmit: Function, onClose: Function, loading: boolean }} props
 */
const TaskForm = ({ task, onSubmit, onClose, loading }) => {
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const isEditing = Boolean(task);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'pending',
        priority: task.priority || 'medium',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        tags: Array.isArray(task.tags) ? task.tags.join(', ') : '',
      });
    } else {
      setFormData(emptyForm);
    }
    setErrors({});
  }, [task]);

  /**
   * Validate form fields client-side
   * @returns {boolean} isValid
   */
  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) {
      errs.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      errs.title = 'Title must be at least 3 characters';
    } else if (formData.title.trim().length > 100) {
      errs.title = 'Title must not exceed 100 characters';
    }

    if (formData.description.length > 500) {
      errs.description = 'Description must not exceed 500 characters';
    }

    if (formData.dueDate) {
      const selected = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected <= today) {
        errs.dueDate = 'Due date must be a future date';
      }
    }

    const tagsArray = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (tagsArray.length > 5) {
      errs.tags = 'Maximum 5 tags allowed';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /**
   * Handle input changes
   * @param {React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>} e
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  /**
   * Handle form submission
   * @param {React.FormEvent} e
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      status: formData.status,
      priority: formData.priority,
      tags: formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };

    if (formData.dueDate) payload.dueDate = formData.dueDate;

    await onSubmit(payload);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="task-form" role="dialog" aria-modal="true" aria-label={isEditing ? 'Edit task' : 'Create task'}>
        <div className="task-form__header">
          <span className="task-form__eyebrow">{isEditing ? 'EDIT' : 'NEW'} TASK</span>
          <button className="task-form__close" onClick={onClose} aria-label="Close form">×</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="task-form__body">
            <div className="form-group">
              <label className="form-label" htmlFor="title">TITLE *</label>
              <input
                id="title"
                name="title"
                type="text"
                className={`form-input ${errors.title ? 'form-input--error' : ''}`}
                value={formData.title}
                onChange={handleChange}
                maxLength={100}
                placeholder="Task title..."
                autoFocus
              />
              {errors.title && <span className="form-error">{errors.title}</span>}
              <span className="form-hint">{formData.title.length}/100</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="description">DESCRIPTION</label>
              <textarea
                id="description"
                name="description"
                className={`form-input form-textarea ${errors.description ? 'form-input--error' : ''}`}
                value={formData.description}
                onChange={handleChange}
                maxLength={500}
                placeholder="Optional description..."
                rows={3}
              />
              {errors.description && <span className="form-error">{errors.description}</span>}
              <span className="form-hint">{formData.description.length}/500</span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="status">STATUS</label>
                <select
                  id="status"
                  name="status"
                  className="form-input form-select"
                  value={formData.status}
                  onChange={handleChange}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="priority">PRIORITY</label>
                <select
                  id="priority"
                  name="priority"
                  className="form-input form-select"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="dueDate">DUE DATE</label>
              <input
                id="dueDate"
                name="dueDate"
                type="date"
                className={`form-input ${errors.dueDate ? 'form-input--error' : ''}`}
                value={formData.dueDate}
                onChange={handleChange}
                min={today}
              />
              {errors.dueDate && <span className="form-error">{errors.dueDate}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="tags">TAGS</label>
              <input
                id="tags"
                name="tags"
                type="text"
                className={`form-input ${errors.tags ? 'form-input--error' : ''}`}
                value={formData.tags}
                onChange={handleChange}
                placeholder="work, urgent, design (comma-separated)"
              />
              {errors.tags && <span className="form-error">{errors.tags}</span>}
              <span className="form-hint">Max 5 tags, comma-separated</span>
            </div>
          </div>

          <div className="task-form__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : null}
              {isEditing ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;
