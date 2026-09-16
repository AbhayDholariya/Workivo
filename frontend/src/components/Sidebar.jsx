import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  CalendarOff, 
  UserCheck
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
    },
    {
      label: 'Employees',
      path: '/employees',
      icon: Users,
      roles: ['ADMIN'], // Only HR/Admin can view all / manage
    },
    {
      label: 'Attendance',
      path: '/attendance',
      icon: Clock,
      roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
    },
    {
      label: 'Leaves',
      path: '/leaves',
      icon: CalendarOff,
      roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
    },
    {
      label: 'My Profile',
      path: '/profile',
      icon: UserCheck,
      roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
    },
  ];

  const filteredItems = navItems.filter((item) => item.roles.includes(user?.role));

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Main Navigation
        </div>

        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
        <p className="text-xs font-semibold text-slate-700">Workivo HRMS Portal</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Vibe Coder Practical Task</p>
        <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
          <span>Role: <strong>{user?.role}</strong></span>
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        </div>
      </div>
    </aside>
  );
}
