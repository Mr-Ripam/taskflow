import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, isPast } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { StatusBadge, PriorityBadge } from '../components/Badge';

const STATUSES = ['Todo', 'In Progress', 'Done'];

const COLUMN_STYLES = {
  'Todo': 'border-gray-700',
  'In Progress': 'border-blue-500/30',
  'Done': 'border-green-500/30',
};

const COLUMN_HEADERS = {
  'Todo': { color: 'text-gray-300', dot: 'bg-gray-500' },
  'In Progress': { color: 'text-blue-400', dot: 'bg-blue-500' },
  'Done': { color: 'text-green-400', dot: 'bg-green-500' },
};

function TaskCard({ task, onEdit, onDelete, isAdmin, isDragging }) {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'Done';

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-gray-600 transition-all ${isDragging ? 'opacity-50 rotate-1 shadow-xl' : ''}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-gray-200 leading-snug">{task.title}</p>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => onEdit(task)} className="text-gray-600 hover:text-gray-300 text-xs p-0.5">✏️</button>
          {isAdmin && <button onClick={() => onDelete(task._id)} className="text-gray-600 hover:text-red-400 text-xs p-0.5">🗑</button>}
        </div>
      </div>

      {task.description && <p className="text-xs text-gray-500 mb-2 line-clamp-2">{task.description}</p>}

      <div className="flex items-center justify-between">
        <PriorityBadge priority={task.priority} />
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
              {isOverdue ? '⚠️ ' : ''}{format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}
          {task.assignedTo && (
            <div className="w-5 h-5 rounded-full bg-brand-700 flex items-center justify-center text-xs text-brand-200 font-medium" title={task.assignedTo.name}>
              {task.assignedTo.name?.[0]?.toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SortableTaskCard({ task, onEdit, onDelete, isAdmin }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onEdit={onEdit} onDelete={onDelete} isAdmin={isAdmin} isDragging={isDragging} />
    </div>
  );
}

function Column({ status, tasks, onEdit, onDelete, isAdmin }) {
  const { color, dot } = COLUMN_HEADERS[status];
  return (
    <div className={`flex flex-col bg-gray-900/50 border ${COLUMN_STYLES[status]} rounded-xl p-3 min-h-[400px] w-full`}>
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={`w-2 h-2 rounded-full ${dot}`} />
        <h3 className={`text-sm font-semibold ${color}`}>{status}</h3>
        <span className="ml-auto text-xs text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 flex-1">
          {tasks.map(task => (
            <SortableTaskCard key={task._id} task={task} onEdit={onEdit} onDelete={onDelete} isAdmin={isAdmin} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export default function TaskBoard() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ title: '', description: '', priority: 'Medium', dueDate: '', assignedTo: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetchData = useCallback(() => {
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks/project/${id}`)
    ]).then(([projRes, taskRes]) => {
      setProject(projRes.data);
      setMembers(projRes.data.members || []);
      setTasks(taskRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredTasks = tasks.filter(t =>
    !filter || t.title.toLowerCase().includes(filter.toLowerCase()) ||
    t.assignedTo?.name?.toLowerCase().includes(filter.toLowerCase())
  );

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = filteredTasks.filter(t => t.status === s);
    return acc;
  }, {});

  const handleDragStart = ({ active }) => {
    setActiveTask(tasks.find(t => t._id === active.id));
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveTask(null);
    if (!over || active.id === over.id) return;

    // Detect target column
    const targetStatus = STATUSES.find(s => tasksByStatus[s].some(t => t._id === over.id)) || over.id;
    if (!STATUSES.includes(targetStatus)) return;

    const task = tasks.find(t => t._id === active.id);
    if (!task || task.status === targetStatus) return;

    // Optimistic update
    setTasks(prev => prev.map(t => t._id === active.id ? { ...t, status: targetStatus } : t));

    try {
      await api.patch(`/tasks/${active.id}`, { status: targetStatus });
    } catch {
      fetchData(); // revert on failure
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = { ...form, projectId: id };
      if (!payload.dueDate) delete payload.dueDate;
      if (!payload.assignedTo) delete payload.assignedTo;
      const res = await api.post('/tasks', payload);
      setTasks(prev => [res.data, ...prev]);
      setShowCreate(false);
      setForm({ title: '', description: '', priority: 'Medium', dueDate: '', assignedTo: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = { ...editTask };
      if (!payload.dueDate) payload.dueDate = null;
      if (!payload.assignedTo) payload.assignedTo = null;
      const res = await api.patch(`/tasks/${editTask._id}`, payload);
      setTasks(prev => prev.map(t => t._id === editTask._id ? res.data : t));
      setEditTask(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t._id !== taskId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/projects" className="hover:text-gray-300">Projects</Link>
            <span>/</span>
            <Link to={`/projects/${id}`} className="hover:text-gray-300">{project?.name}</Link>
            <span>/</span>
            <span className="text-gray-300">Board</span>
          </div>
          <h1 className="text-xl font-bold text-white">{project?.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text" placeholder="Search tasks..." className="input w-44 py-1.5 text-xs"
            value={filter} onChange={e => setFilter(e.target.value)}
          />
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm py-1.5">
            + Add Task
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {STATUSES.map(status => (
            <Column key={status} status={status} tasks={tasksByStatus[status]}
              onEdit={setEditTask} onDelete={handleDelete} isAdmin={isAdmin} />
          ))}
        </div>
        <DragOverlay>
          {activeTask && <div className="rotate-2 shadow-2xl opacity-90"><TaskCard task={activeTask} onEdit={() => {}} onDelete={() => {}} isAdmin={false} /></div>}
        </DragOverlay>
      </DndContext>

      {/* Create Task Modal */}
      {showCreate && (
        <Modal title="Create Task" onClose={() => setShowCreate(false)}>
          {error && <p className="mb-3 text-red-400 text-sm">{error}</p>}
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label">Title</label>
              <input type="text" className="input" placeholder="Task title"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input resize-none" rows={2} placeholder="Optional description"
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Priority</label>
                <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  <option>Low</option><option>Medium</option><option>High</option>
                </select>
              </div>
              <div>
                <label className="label">Due Date</label>
                <input type="date" className="input" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
            </div>
            {isAdmin && (
              <div>
                <label className="label">Assign To</label>
                <select className="input" value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                </select>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Task Modal */}
      {editTask && (
        <Modal title="Edit Task" onClose={() => setEditTask(null)}>
          {error && <p className="mb-3 text-red-400 text-sm">{error}</p>}
          <form onSubmit={handleUpdate} className="space-y-4">
            {isAdmin && (
              <>
                <div>
                  <label className="label">Title</label>
                  <input type="text" className="input" value={editTask.title}
                    onChange={e => setEditTask(t => ({ ...t, title: e.target.value }))} required />
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea className="input resize-none" rows={2} value={editTask.description}
                    onChange={e => setEditTask(t => ({ ...t, description: e.target.value }))} />
                </div>
              </>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Status</label>
                <select className="input" value={editTask.status}
                  onChange={e => setEditTask(t => ({ ...t, status: e.target.value }))}>
                  <option>Todo</option><option>In Progress</option><option>Done</option>
                </select>
              </div>
              {isAdmin && (
                <div>
                  <label className="label">Priority</label>
                  <select className="input" value={editTask.priority}
                    onChange={e => setEditTask(t => ({ ...t, priority: e.target.value }))}>
                    <option>Low</option><option>Medium</option><option>High</option>
                  </select>
                </div>
              )}
            </div>
            {isAdmin && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Due Date</label>
                  <input type="date" className="input"
                    value={editTask.dueDate ? editTask.dueDate.split('T')[0] : ''}
                    onChange={e => setEditTask(t => ({ ...t, dueDate: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Assign To</label>
                  <select className="input"
                    value={editTask.assignedTo?._id || editTask.assignedTo || ''}
                    onChange={e => setEditTask(t => ({ ...t, assignedTo: e.target.value }))}>
                    <option value="">Unassigned</option>
                    {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                  </select>
                </div>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setEditTask(null)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
