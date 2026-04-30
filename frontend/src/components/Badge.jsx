import React from 'react';

const STATUS_STYLES = {
  'Todo': 'bg-gray-700 text-gray-300',
  'In Progress': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  'Done': 'bg-green-500/20 text-green-400 border border-green-500/30',
};

const PRIORITY_STYLES = {
  'Low': 'bg-gray-700 text-gray-300',
  'Medium': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  'High': 'bg-red-500/20 text-red-400 border border-red-500/30',
};

export function StatusBadge({ status }) {
  return (
    <span className={`badge ${STATUS_STYLES[status] || STATUS_STYLES['Todo']}`}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  return (
    <span className={`badge ${PRIORITY_STYLES[priority] || PRIORITY_STYLES['Medium']}`}>
      {priority}
    </span>
  );
}

export function RoleBadge({ role }) {
  return (
    <span className={`badge ${role === 'Admin' ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'bg-gray-700 text-gray-300'}`}>
      {role}
    </span>
  );
}
