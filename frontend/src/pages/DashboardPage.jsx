import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../api/dashboardApi';
import { attendanceApi } from '../api/attendanceApi';
import { leaveApi } from '../api/leaveApi';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { 
  Users, 
  UserCheck, 
  Clock, 
  CalendarOff, 
  AlertCircle, 
  CheckCircle2, 
  LogIn, 
  LogOut,
  CalendarCheck,
  Send,
  XCircle,
  Building2,
  Activity,
  PlusCircle,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await dashboardApi.getStats();
      setData(res);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const res = await attendanceApi.checkIn();
      toast.success(res.message || 'Checked in successfully!');
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to check in.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const res = await attendanceApi.checkOut();
      toast.success(res.message || 'Checked out successfully!');
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to check out.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveLeave = async (leaveId) => {
    setActionLoading(true);
    try {
      await leaveApi.approve(leaveId);
      toast.success('Leave approved successfully!');
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to approve leave.');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (leaveId) => {
    setSelectedLeaveId(leaveId);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please enter a rejection reason.');
      return;
    }
    setActionLoading(true);
    try {
      await leaveApi.reject(selectedLeaveId, rejectionReason);
      toast.success('Leave rejected.');
      setRejectModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reject leave.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const role = user?.role;
  const stats = data?.stats || {};

  const totalEmpCount = stats.totalEmployees || 1;
  const presentPct = Math.round(((stats.presentToday || 0) / totalEmpCount) * 100);
  const onLeavePct = Math.round(((stats.onLeaveToday || 0) / totalEmpCount) * 100);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back, <strong className="text-slate-800">{user?.full_name || user?.email}</strong>. Here is today's summary.
          </p>
        </div>
        <div className="text-xs text-slate-700 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs self-start sm:self-auto flex items-center gap-2 font-mono">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Today: <strong>{currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</strong> • {currentTime.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* 1. HR / Admin Dashboard Metrics */}
      {role === 'ADMIN' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard
              title="Total Employees"
              value={stats.totalEmployees}
              subtitle="Registered workforce"
              icon={Users}
              color="indigo"
            />
            <MetricCard
              title="Active Employees"
              value={stats.activeEmployees}
              subtitle="Current active headcount"
              icon={UserCheck}
              color="emerald"
            />
            <MetricCard
              title="Present Today"
              value={stats.presentToday}
              subtitle="Employees punched in"
              icon={Clock}
              color="blue"
            />
            <MetricCard
              title="On Leave Today"
              value={stats.onLeaveToday}
              subtitle="Approved leaves active"
              icon={CalendarOff}
              color="amber"
            />
            <MetricCard
              title="Pending Requests"
              value={stats.pendingLeaveRequests}
              subtitle="Awaiting HR approval"
              icon={AlertCircle}
              color="rose"
            />
          </div>

          {/* Pending Leaves List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Pending Leave Requests Awaiting Action</h3>
                <p className="text-xs text-slate-500">Leaves requiring HR review across all departments</p>
              </div>
              <a href="/leaves" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                View All Leaves →
              </a>
            </div>

            {data?.recentLeaves?.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No pending leave requests at this time. All caught up!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/80 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3.5">Employee</th>
                      <th className="px-6 py-3.5">Type</th>
                      <th className="px-6 py-3.5">Duration</th>
                      <th className="px-6 py-3.5">Reason</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.recentLeaves?.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-3.5">
                          <p className="font-semibold text-slate-900">{req.user?.full_name}</p>
                          <p className="text-xs text-slate-400">{req.user?.employee_id} • {req.user?.department}</p>
                        </td>
                        <td className="px-6 py-3.5">
                          <StatusBadge status={req.leave_type} />
                        </td>
                        <td className="px-6 py-3.5 text-xs text-slate-700">
                          {req.start_date} to {req.end_date}
                          <span className="block text-[11px] text-slate-400">{req.duration_days} day(s)</span>
                        </td>
                        <td className="px-6 py-3.5 text-xs text-slate-600 max-w-xs truncate">
                          {req.reason}
                        </td>
                        <td className="px-6 py-3.5 text-right space-x-2">
                          {req.admin_approval === 'APPROVED' ? (
                            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                              HR Approved (Awaiting Mgr)
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleApproveLeave(req.id)}
                                disabled={actionLoading}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => openRejectModal(req.id)}
                                disabled={actionLoading}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* 2. Manager Dashboard */}
      {role === 'MANAGER' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Team Members"
              value={stats.totalTeamMembers}
              subtitle="Direct reports in your team"
              icon={Users}
              color="indigo"
            />
            <MetricCard
              title="Present Today"
              value={stats.presentToday}
              subtitle="Team members checked in"
              icon={Clock}
              color="emerald"
            />
            <MetricCard
              title="On Leave Today"
              value={stats.teamOnLeaveToday}
              subtitle="Team members on leave"
              icon={CalendarOff}
              color="amber"
            />
            <MetricCard
              title="Pending Approvals"
              value={stats.pendingApprovals}
              subtitle="Requests from your team"
              icon={AlertCircle}
              color="rose"
            />
          </div>

          {/* Pending Team Requests */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Your Team's Pending Leave Requests</h3>
                <p className="text-xs text-slate-500">Approve or reject leave requests from your subordinates</p>
              </div>
              <a href="/leaves" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                View All Team Leaves →
              </a>
            </div>

            {data?.recentRequests?.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No pending requests from your team members right now.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/80 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3.5">Team Member</th>
                      <th className="px-6 py-3.5">Type</th>
                      <th className="px-6 py-3.5">Dates</th>
                      <th className="px-6 py-3.5">Reason</th>
                      <th className="px-6 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.recentRequests?.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-3.5">
                          <p className="font-semibold text-slate-900">{req.user?.full_name}</p>
                          <p className="text-xs text-slate-400">{req.user?.employee_id}</p>
                        </td>
                        <td className="px-6 py-3.5">
                          <StatusBadge status={req.leave_type} />
                        </td>
                        <td className="px-6 py-3.5 text-xs text-slate-700">
                          {req.start_date} to {req.end_date}
                          <span className="block text-[11px] text-slate-400">{req.duration_days} day(s)</span>
                        </td>
                        <td className="px-6 py-3.5 text-xs text-slate-600 max-w-xs truncate">
                          {req.reason}
                        </td>
                        <td className="px-6 py-3.5 text-right space-x-2">
                          {req.manager_approval === 'APPROVED' ? (
                            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                              Manager Approved (Awaiting HR)
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleApproveLeave(req.id)}
                                disabled={actionLoading}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => openRejectModal(req.id)}
                                disabled={actionLoading}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* 3. Employee Dashboard */}
      {role === 'EMPLOYEE' && (
        <>
          {/* Today Attendance Punch Card */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 mb-2">
                  Attendance Tracker
                </span>
                <h2 className="text-2xl font-bold">Today's Attendance Status</h2>
                <p className="text-indigo-200 text-sm mt-1">
                  Current Status: <strong className="text-white underline">{stats.attendanceStatus}</strong>
                </p>
                {data?.todayRecord?.check_in && (
                  <p className="text-xs text-indigo-300 mt-2">
                    Checked In: {new Date(data.todayRecord.check_in).toLocaleTimeString()}
                    {data.todayRecord.check_out && (
                      <> • Checked Out: {new Date(data.todayRecord.check_out).toLocaleTimeString()} ({data.todayRecord.total_hours} hrs)</>
                    )}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCheckIn}
                  disabled={actionLoading || Boolean(data?.todayRecord?.check_in)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition shadow-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Check In</span>
                </button>

                <button
                  onClick={handleCheckOut}
                  disabled={actionLoading || !data?.todayRecord?.check_in || Boolean(data?.todayRecord?.check_out)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Check Out</span>
                </button>
              </div>
            </div>
          </div>

          {/* Leave Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Leaves Applied"
              value={stats.totalLeaves}
              subtitle="Lifetime applications"
              icon={CalendarCheck}
              color="indigo"
            />
            <MetricCard
              title="Pending Requests"
              value={stats.pendingLeaves}
              subtitle="Awaiting manager review"
              icon={AlertCircle}
              color="amber"
            />
            <MetricCard
              title="Approved Leaves"
              value={stats.approvedLeaves}
              subtitle="Successfully approved"
              icon={CheckCircle2}
              color="emerald"
            />
            <MetricCard
              title="Rejected Requests"
              value={stats.rejectedLeaves}
              subtitle="Review reasons in leaves"
              icon={XCircle}
              color="rose"
            />
          </div>

          {/* Recent Attendance Log */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Your Recent Attendance History</h3>
                <p className="text-xs text-slate-500">Last 5 attendance entries recorded in database</p>
              </div>
              <a href="/attendance" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                View Full Log →
              </a>
            </div>

            {data?.recentAttendance?.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No recent attendance records found. Click Check In to start!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/80 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5">Check In</th>
                      <th className="px-6 py-3.5">Check Out</th>
                      <th className="px-6 py-3.5">Total Hours</th>
                      <th className="px-6 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data?.recentAttendance?.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-3.5 font-medium text-slate-800">{att.date}</td>
                        <td className="px-6 py-3.5 text-xs text-slate-600">
                          {att.check_in ? new Date(att.check_in).toLocaleTimeString() : '—'}
                        </td>
                        <td className="px-6 py-3.5 text-xs text-slate-600">
                          {att.check_out ? new Date(att.check_out).toLocaleTimeString() : '—'}
                        </td>
                        <td className="px-6 py-3.5 text-xs font-semibold text-slate-700">
                          {att.total_hours ? `${att.total_hours} hrs` : '0 hrs'}
                        </td>
                        <td className="px-6 py-3.5">
                          <StatusBadge status={att.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Leave Request"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Please provide a specific rejection reason for this employee request (mandatory as per company policy).
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Rejection Reason *
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Critical project release scheduled during these dates..."
              className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setRejectModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReject}
              disabled={actionLoading || !rejectionReason.trim()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
