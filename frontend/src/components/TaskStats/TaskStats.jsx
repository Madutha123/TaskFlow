/**
 * @module TaskStats
 * @description Displays aggregate task statistics (totals by status and priority)
 */
import React, { useEffect } from 'react';
import useTasks from '../../hooks/useTasks';
import './TaskStats.css';

/**
 * Single stat card
 * @param {{ label: string, value: number, accent: string }} props
 */
const StatCard = ({ label, value, accent }) => (
  <div className="stat-card" style={{ '--card-accent': accent }}>
    <span className="stat-card__value">{value}</span>
    <span className="stat-card__label">{label}</span>
  </div>
);

/**
 * TaskStats renders an overview bar with key task metrics
 */
const TaskStats = () => {
  const { stats, statsLoading, fetchStats } = useTasks();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (statsLoading || !stats) {
    return (
      <div className="task-stats task-stats--loading">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="stat-card stat-card--skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="task-stats">
      <StatCard label="TOTAL" value={stats.total} accent="var(--accent)" />
      <StatCard label="PENDING" value={stats.byStatus.pending} accent="var(--yellow)" />
      <StatCard label="IN PROGRESS" value={stats.byStatus['in-progress']} accent="var(--blue)" />
      <StatCard label="COMPLETED" value={stats.byStatus.completed} accent="var(--green)" />
      <StatCard label="HIGH PRIORITY" value={stats.byPriority.high} accent="var(--red)" />
    </div>
  );
};

export default TaskStats;
