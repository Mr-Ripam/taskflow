import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { RoleBadge } from '../components/Badge';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchProject = () => {
    api.get(`/projects/${id}`).then(res => {
      setProject(res.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchProject();
    if (user?.role === 'Admin') {
      api.get('/auth/users').then(res => setAllUsers(res.data));
    }
  }, [id]);

  const nonMembers = allUsers.filter(u => !project?.members?.some(m => m._id === u._id));

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post(`/projects/${id}/members`, { userId: selectedUser });
      setProject(res.data);
      setShowAddMember(false);
      setSelectedUser('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      const res = await api.delete(`/projects/${id}/members/${userId}`);
      setProject(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!project) return <p className="text-gray-400">Project not found</p>;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/projects" className="hover:text-gray-300">Projects</Link>
            <span>/</span>
            <span className="text-gray-300">{project.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{project.name}</h1>
          {project.description && <p className="text-gray-400 text-sm mt-1">{project.description}</p>}
        </div>
        <Link to={`/projects/${id}/board`} className="btn-primary">Open Board →</Link>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">
            Team Members <span className="text-gray-500 font-normal text-sm">({project.members?.length})</span>
          </h2>
          {user?.role === 'Admin' && nonMembers.length > 0 && (
            <button onClick={() => setShowAddMember(true)} className="btn-secondary text-xs py-1.5">
              + Add Member
            </button>
          )}
        </div>

        <div className="space-y-2">
          {project.members?.map(member => (
            <div key={member._id} className="flex items-center gap-3 p-3 bg-gray-800/40 rounded-lg">
              <div className="w-9 h-9 rounded-full bg-brand-800 flex items-center justify-center text-brand-300 font-semibold text-sm flex-shrink-0">
                {member.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200">{member.name}</p>
                <p className="text-xs text-gray-500">{member.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <RoleBadge role={member.role} />
                {user?.role === 'Admin' && member._id !== project.createdBy?._id && member._id !== user._id && (
                  <button onClick={() => handleRemoveMember(member._id)}
                    className="text-gray-600 hover:text-red-400 text-sm transition-colors">✕</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <p className="text-sm text-gray-500">
          Created by <span className="text-gray-300">{project.createdBy?.name}</span>
        </p>
      </div>

      {showAddMember && (
        <Modal title="Add Member" onClose={() => setShowAddMember(false)}>
          {error && <p className="mb-3 text-red-400 text-sm">{error}</p>}
          <form onSubmit={handleAddMember} className="space-y-4">
            <div>
              <label className="label">Select User</label>
              <select className="input" value={selectedUser} onChange={e => setSelectedUser(e.target.value)} required>
                <option value="">Choose a user...</option>
                {nonMembers.map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.email}) - {u.role}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowAddMember(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary" disabled={submitting || !selectedUser}>
                {submitting ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
