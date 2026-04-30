import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { format } from 'date-fns';

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = () => {
    setLoading(true);
    api.get('/projects').then(res => {
      setProjects(res.data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/projects', form);
      setShowCreate(false);
      setForm({ name: '', description: '' });
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects(prev => prev.filter(p => p._id !== id));
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-gray-400 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        {user?.role === 'Admin' && (
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            + New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">📁</p>
          <p className="text-gray-300 font-medium">No projects yet</p>
          <p className="text-gray-500 text-sm mt-1">
            {user?.role === 'Admin' ? 'Create your first project to get started' : 'You haven\'t been added to any projects yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <div key={project._id} className="card hover:border-gray-700 transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{project.name}</h3>
                  <p className="text-gray-500 text-xs mt-0.5">
                    by {project.createdBy?.name} · {format(new Date(project.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
                {user?.role === 'Admin' && (
                  <button onClick={() => handleDelete(project._id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all ml-2 text-sm">
                    🗑
                  </button>
                )}
              </div>

              {project.description && (
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{project.description}</p>
              )}

              <div className="flex items-center gap-2 mb-4">
                <div className="flex -space-x-1.5">
                  {project.members?.slice(0, 4).map(m => (
                    <div key={m._id} className="w-6 h-6 rounded-full bg-gray-700 border border-gray-900 flex items-center justify-center text-xs text-gray-300 font-medium">
                      {m.name?.[0]?.toUpperCase()}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-gray-500">{project.members?.length} member{project.members?.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="flex gap-2">
                <Link to={`/projects/${project._id}`} className="btn-secondary text-xs flex-1 justify-center py-1.5">
                  Details
                </Link>
                <Link to={`/projects/${project._id}/board`} className="btn-primary text-xs flex-1 justify-center py-1.5">
                  Board →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="Create Project" onClose={() => setShowCreate(false)}>
          {error && <p className="mb-3 text-red-400 text-sm">{error}</p>}
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label">Project name</label>
              <input type="text" className="input" placeholder="My Awesome Project"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Description <span className="text-gray-600">(optional)</span></label>
              <textarea className="input resize-none" rows={3} placeholder="What's this project about?"
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
