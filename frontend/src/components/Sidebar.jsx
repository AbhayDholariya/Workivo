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
      roles: ['ADMIN'],
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
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex shadow-xs">
      <div className="space-y-1">
        <div className="px-3.5 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Main Navigation
        </div>

        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition duration-150 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-xs border-r-2 border-indigo-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center justify-between text-xs font-bold text-slate-900">
          <span>Workivo HRMS</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5">Enterprise Portal</p>
        <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600 font-mono">
          <span>Active Role:</span>
          <span className="text-indigo-700 font-bold">{user?.role}</span>
        </div>
      </div>
    </aside>
  );
}
