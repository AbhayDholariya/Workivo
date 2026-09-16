import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import { employeeApi } from '../api/employeeApi';
import StatusBadge from '../components/StatusBadge';
import { User, Mail, Phone, Building2, Briefcase, Calendar, Shield, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await employeeApi.update(user.id, formData);
      toast.success('Profile updated successfully!');
      setUser((prev) => ({ ...prev, ...updated }));
      localStorage.setItem('hrms_user', JSON.stringify({ ...user, ...updated }));
    } catch (err) {
      toast.error('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Personal Profile
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review your official employee records and update your contact information.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Profile Card Top Banner */}
        <div className="h-32 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 p-6 flex items-end relative overflow-hidden">
          <div className="absolute right-0 top-0 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-4 translate-y-10 relative z-10">
            <div className="w-20 h-20 rounded-2xl bg-indigo-600 text-white font-extrabold text-3xl flex items-center justify-center shadow-md border-4 border-white">
              {user?.first_name ? user.first_name[0] : 'U'}
            </div>
            <div className="pt-8">
              <h2 className="text-xl font-bold text-white">{user?.full_name || user?.email}</h2>
              <p className="text-xs text-indigo-100 font-mono font-semibold">{user?.employee_id}</p>
            </div>
          </div>
        </div>

        <div className="pt-14 p-6 sm:p-8">
          <form onSubmit={handleUpdate} className="space-y-6">
            {/* Read-only Company Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Department</p>
                <p className="text-sm font-semibold text-slate-800 mt-1 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  {user?.department}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Designation</p>
                <p className="text-sm font-semibold text-slate-800 mt-1 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  {user?.designation}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">System Role</p>
                <p className="text-sm font-semibold text-purple-700 mt-1 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-purple-600" />
                  {user?.role}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Employment Status</p>
                <div className="mt-1.5">
                  <StatusBadge status={user?.employment_status} />
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Reporting Manager</p>
                <p className="text-sm font-medium text-slate-800 mt-1">
                  {user?.manager_name || 'None (Top Level)'}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Joining Date</p>
                <p className="text-sm font-medium text-slate-800 mt-1 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  {user?.joining_date || 'N/A'}
                </p>
              </div>
            </div>

            {/* Editable Contact Fields */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Editable Personal Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full p-2.5 bg-white text-slate-900 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full p-2.5 bg-white text-slate-900 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Corporate Email (Locked)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full p-2.5 border border-slate-200 bg-slate-100 text-slate-500 rounded-xl text-sm cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full p-2.5 bg-white text-slate-900 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
