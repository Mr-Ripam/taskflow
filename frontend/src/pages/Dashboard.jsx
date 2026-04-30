import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/Badge';
import { format, isPast } from 'date-fns';

const StatCard = ({ label, value, color, icon }) => (
  <div className="card">
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-xl">{icon}</span>
    </div>
    <p className={`text-3xl font-bold ${color}`}>{value}</p>
  </div>
);

const STATUS_COLORS = { 'Todo': '#6b7280', 'In Progress': '#3b82f6', 'Done': '#22c55e' };
const PRIORITY_COLORS = { 'Low': '#6b7280', 'Medium': '#eab308', 'High': '#ef4444' };

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const statusData = data?.statusBreakdown?.map(s => ({ name: s._id, value: s.count })) || [];
  const priorityData = data?.priorityBreakdown?.map(p => ({ name: p._id, value: p.count })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Welcome back, {user?.name}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Projects" value={data?.stats?.totalProjects ?? 0} color="text-white" icon="📁" />
        <StatCard label="Total Tasks" value={data?.stats?.totalTasks ?? 0} color="text-white" icon="✅" />
        <StatCard label="Completed" value={data?.stats?.completedTasks ?? 0} color="text-green-400" icon="🎯" />
        <StatCard label="Overdue" value={data?.stats?.overdueTasks ?? 0} color="text-red-400" icon="⚠️" />
      </div>

      {/* Charts */}
      {(statusData.length > 0 || priorityData.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Tasks by Status</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#6b7280'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#f3f4f6' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2">
              {statusData.map(s => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[s.name] }} />
                  <span className="text-xs text-gray-400">{s.name} ({s.value})</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Tasks by Priority</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={priorityData} barSize={28}>
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#f3f4f6' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry) => (
                    <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || '#6b7280'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* My Tasks */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-300">My Tasks</h3>
          <Link to="/projects" className="text-xs text-brand-400 hover:text-brand-300">View all projects →</Link>
        </div>

        {data?.myTasks?.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">No tasks assigned to you</p>
        ) : (
          <div className="space-y-2">
            {data?.myTasks?.map(task => (
              <div key={task._id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{task.title}</p>
                  <p className="text-xs text-gray-500">{task.projectId?.name}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status} />
                  {task.dueDate && (
                    <span className={`text-xs ${isPast(new Date(task.dueDate)) && task.status !== 'Done' ? 'text-red-400' : 'text-gray-500'}`}>
                      {format(new Date(task.dueDate), 'MMM d')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
