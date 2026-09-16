import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Shield, Briefcase, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Shield className="w-3.5 h-3.5 text-purple-600" /> HR / Admin
          </span>
        );
      case 'MANAGER':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Briefcase className="w-3.5 h-3.5 text-blue-600" /> Manager
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <User className="w-3.5 h-3.5 text-emerald-600" /> Employee
          </span>
        );
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-extrabold shadow-md shadow-indigo-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                Workivo
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                HRMS Platform
              </span>
            </div>
          </div>

          {/* Right User Actions */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3.5">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-900 tracking-tight">{user.full_name || user.email}</p>
                  <p className="text-xs text-slate-500">{user.designation} • <span className="text-indigo-600 font-medium">{user.department}</span></p>
                </div>

                {getRoleBadge(user.role)}

                <div className="h-6 w-px bg-slate-200" />

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition duration-150"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
