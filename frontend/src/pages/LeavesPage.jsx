import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { leaveApi } from '../api/leaveApi';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { 
  CalendarOff, 
  PlusCircle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Trash2, 
  AlertTriangle 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LeavesPage() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState(user?.role === 'EMPLOYEE' ? 'mine' : 'team');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Form
  const initialForm = {
    leave_type: 'CASUAL',
    start_date: '',
    end_date: '',
    reason: '',
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchLeaves = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (activeTab === 'mine') params.scope = 'mine';
      if (activeTab === 'team') params.scope = 'team';

      const res = await leaveApi.getAll(params);
      setLeaves(res);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load leave records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [activeTab, statusFilter]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!formData.start_date || !formData.end_date || !formData.reason.trim()) {
      toast.error('Please fill in all mandatory fields.');
      return;
    }

    if (formData.end_date < formData.start_date) {
      toast.error('End date cannot be earlier than start date!');
      return;
    }

    setActionLoading(true);
    try {
      await leaveApi.apply(formData);
      toast.success('Leave application submitted successfully!');
      setApplyModalOpen(false);
      setFormData(initialForm);
      fetchLeaves();
    } catch (err) {
      const data = err.response?.data;
      let msg = 'Failed to apply for leave.';
      if (data) {
        if (typeof data === 'string') msg = data;
        else if (data.detail) msg = data.detail;
        else if (data.error) msg = data.error;
        else if (data.non_field_errors?.[0]) msg = data.non_field_errors[0];
        else {
          const firstKey = Object.keys(data)[0];
          if (firstKey) {
            const val = data[firstKey];
            msg = Array.isArray(val) ? `${firstKey}: ${val[0]}` : String(val);
          }
        }
      }
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(true);
    try {
      await leaveApi.approve(id);
      toast.success('Leave approved successfully!');
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to approve leave.');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (id) => {
    setSelectedLeaveId(id);
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
      toast.success('Leave request rejected.');
      setRejectModalOpen(false);
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reject leave.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this leave application?')) return;
    try {
      await leaveApi.cancel(id);
      toast.success('Leave application cancelled.');
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to cancel leave.');
    }
  };

  const role = user?.role;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Leave Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Submit leave requests, track approval statuses, and manage team absences.
          </p>
        </div>
        {role !== 'ADMIN' && (
          <button
            onClick={() => setApplyModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-xs self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Apply for Leave</span>
          </button>
        )}
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-3">
        <div className="flex gap-2">
          {role !== 'ADMIN' && (
            <button
              onClick={() => setActiveTab('mine')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
                activeTab === 'mine'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-xs'
              }`}
            >
              My Leave Requests
            </button>
          )}

          {role !== 'EMPLOYEE' && (
            <button
              onClick={() => setActiveTab('team')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
                activeTab === 'team'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-xs'
              }`}
            >
              {role === 'ADMIN' ? 'All Company Leaves' : "Team Leave Requests"}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 text-xs bg-white text-slate-700 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer shadow-xs"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Leaves Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : leaves.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No leave requests found in this view.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Leave Type</th>
                  <th className="px-6 py-3.5">Dates & Duration</th>
                  <th className="px-6 py-3.5">Reason</th>
                  <th className="px-6 py-3.5">Status & Decision</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaves.map((leave) => {
                  const isOwner = leave.user?.employee_id === user?.employee_id;
                  const isManagerActionable = role === 'MANAGER' && !isOwner && leave.manager_approval === 'PENDING' && leave.status === 'PENDING';
                  const isAdminActionable = role === 'ADMIN' && leave.admin_approval === 'PENDING' && leave.status === 'PENDING';
                  const canAction = isManagerActionable || isAdminActionable;

                  return (
                    <tr key={leave.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{leave.user?.full_name}</p>
                        <p className="text-xs text-slate-500">{leave.user?.employee_id} • {leave.user?.department}</p>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={leave.leave_type} />
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <p className="font-semibold text-slate-800">{leave.start_date} → {leave.end_date}</p>
                        <p className="text-slate-500 mt-0.5">{leave.duration_days} day(s)</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 max-w-xs">
                        <p className="truncate text-slate-700">{leave.reason}</p>
                        {leave.rejection_reason && (
                          <p className="text-rose-600 mt-1 italic font-medium">Rejection note: {leave.rejection_reason}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={leave.status} />
                        <p className="text-[11px] font-medium text-slate-500 mt-1.5">
                          {leave.approval_display_text}
                        </p>
                        
                        {/* Dual Approval Stepper Pipeline */}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap sm:flex-nowrap">
                          {/* Step 1: Manager */}
                          <div className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium border whitespace-nowrap ${
                            leave.manager_approval === 'APPROVED' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : leave.manager_approval === 'REJECTED' 
                              ? 'bg-rose-50 text-rose-700 border-rose-200' 
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            <span className="font-semibold">Manager:</span>
                            <span>{leave.manager_approval}</span>
                          </div>

                          <span className="text-slate-400 text-xs font-bold shrink-0">→</span>

                          {/* Step 2: HR */}
                          <div className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium border whitespace-nowrap ${
                            leave.admin_approval === 'APPROVED' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : leave.admin_approval === 'REJECTED' 
                              ? 'bg-rose-50 text-rose-700 border-rose-200' 
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            <span className="font-semibold">HR/Admin:</span>
                            <span>{leave.admin_approval}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {canAction && (
                          <>
                            <button
                              onClick={() => handleApprove(leave.id)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openRejectModal(leave.id)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {isOwner && leave.status === 'PENDING' && (
                          <button
                            onClick={() => handleCancel(leave.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition"
                            title="Cancel Leave Application"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        title="Apply for Leave"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleApply} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Leave Type *</label>
            <select
              value={formData.leave_type}
              onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
              className="w-full p-2.5 bg-white text-slate-900 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
            >
              <option value="CASUAL">Casual Leave</option>
              <option value="SICK">Sick Leave</option>
              <option value="PAID">Paid Leave</option>
              <option value="UNPAID">Unpaid Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Start Date *</label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full p-2.5 bg-white text-slate-900 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">End Date *</label>
              <input
                type="date"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full p-2.5 bg-white text-slate-900 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Reason for Absence *</label>
            <textarea
              rows={3}
              required
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="State clear purpose of leave..."
              className="w-full p-3 bg-white text-slate-900 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setApplyModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50"
            >
              Submit Application
            </button>
          </div>
        </form>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Leave Request"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Please enter a formal rejection reason (mandatory as per company policy).
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Rejection Reason *</label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejecting leave..."
              className="w-full p-3 bg-white text-slate-900 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setRejectModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition"
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
