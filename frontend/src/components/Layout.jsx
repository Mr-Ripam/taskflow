import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NavItem = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
      }`
    }
  >
    <span className="text-lg">{icon}</span>
    <span>{label}</span>
  </NavLink>
);

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-gray-950 border-r border-gray-800 w-60 p-4">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8 px-1">
        <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-sm font-bold">T</span>
        </div>
        <span className="text-lg font-semibold text-white tracking-tight">TaskFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        <NavItem to="/dashboard" icon="⚡" label="Dashboard" />
        <NavItem to="/projects" icon="📁" label="Projects" />
      </nav>

      {/* User */}
      <div className="border-t border-gray-800 pt-4 mt-4">
        <div className="flex items-center gap-3 px-1 mb-3">
          <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-200 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
          Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-60 h-full">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-gray-950 border-b border-gray-800">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-semibold text-white">TaskFlow</span>
          <div className="w-6" />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
