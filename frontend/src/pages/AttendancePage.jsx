import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceApi } from '../api/attendanceApi';
import StatusBadge from '../components/StatusBadge';
import { Clock, Calendar, Search, LogIn, LogOut, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AttendancePage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [todayStatus, setTodayStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [filterDate, setFilterDate] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('');

  const fetchAttendance = async () => {
    try {
      const params = {};
      if (filterDate) params.date = filterDate;
      if (filterEmployeeId) params.employee_id = filterEmployeeId;

      const [listRes, todayRes] = await Promise.all([
        attendanceApi.getAll(params),
        attendanceApi.getToday(),
      ]);
      setRecords(listRes);
      setTodayStatus(todayRes);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load attendance records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [filterDate, filterEmployeeId]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const res = await attendanceApi.checkIn();
      toast.success(res.message || 'Checked in successfully!');
      fetchAttendance();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Check-in failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const res = await attendanceApi.checkOut();
      toast.success(res.message || 'Checked out successfully!');
      fetchAttendance();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Check-out failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!records.length) {
      toast.error('No records to export.');
      return;
    }
    const headers = ['Date', 'Employee ID', 'Employee Name', 'Department', 'Check In', 'Check Out', 'Total Hours', 'Status'];
    const rows = records.map((r) => [
      r.date,
      r.user?.employee_id || '',
      r.user?.full_name || '',
      r.user?.department || '',
      r.check_in ? new Date(r.check_in).toLocaleTimeString() : '',
      r.check_out ? new Date(r.check_out).toLocaleTimeString() : '',
      r.total_hours || '0',
      r.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendance_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Attendance records exported to CSV!');
  };

  const role = user?.role;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Attendance Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {role === 'ADMIN' && 'Company-wide attendance records, working hours, and real-time logs.'}
            {role === 'MANAGER' && 'View your team members’ attendance, punch times, and status.'}
            {role === 'EMPLOYEE' && 'Punch in/out for the day and view your personal attendance timeline.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Attendance Punch Widget */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Today's Punch Status</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Date: <strong>{todayStatus?.date || new Date().toISOString().slice(0, 10)}</strong> • Status:{' '}
              <strong className="text-slate-800">
                {todayStatus?.hasCheckedOut ? 'Checked Out' : todayStatus?.hasCheckedIn ? 'Punched In' : 'Not Punched In'}
              </strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCheckIn}
            disabled={actionLoading || Boolean(todayStatus?.hasCheckedIn)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition shadow-xs"
          >
            <LogIn className="w-4 h-4" />
            <span>Punch In</span>
          </button>

          <button
            onClick={handleCheckOut}
            disabled={actionLoading || !todayStatus?.hasCheckedIn || Boolean(todayStatus?.hasCheckedOut)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Punch Out</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {role !== 'EMPLOYEE' && (
          <div className="flex-1">
            <input
              type="text"
              placeholder="Filter by Employee ID (e.g. EMP-004)..."
              value={filterEmployeeId}
              onChange={(e) => setFilterEmployeeId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        )}

        {(filterDate || filterEmployeeId) && (
          <button
            onClick={() => {
              setFilterDate('');
              setFilterEmployeeId('');
            }}
            className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No attendance records match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Check In</th>
                  <th className="px-6 py-3.5">Check Out</th>
                  <th className="px-6 py-3.5">Duration</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{r.date}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{r.user?.full_name}</p>
                      <p className="text-xs text-slate-400">{r.user?.employee_id} • {r.user?.department}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-700">
                      {r.check_in ? new Date(r.check_in).toLocaleTimeString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-700">
                      {r.check_out ? new Date(r.check_out).toLocaleTimeString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-800">
                      {r.total_hours ? `${r.total_hours} hrs` : '0 hrs'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
