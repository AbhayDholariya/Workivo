import React, { useState, useEffect } from 'react';
import { employeeApi } from '../api/employeeApi';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Edit2, 
  Power, 
  Shield, 
  Briefcase, 
  Mail, 
  Phone,
  Building,
  UserCheck,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Form State
  const initialForm = {
    employee_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: 'Software Development',
    designation: 'Software Engineer',
    role: 'EMPLOYEE',
    manager: '',
    joining_date: new Date().toISOString().slice(0, 10),
    password: 'Employee@123',
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchEmployees = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (department) params.department = department;
      if (statusFilter) params.status = statusFilter;
      const res = await employeeApi.getAll(params);
      setEmployees(res);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load employee directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchEmployees();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, department, statusFilter]);

  const handleOpenAdd = () => {
    const empNumbers = employees
      .map((e) => {
        const match = (e.employee_id || '').match(/EMP-E(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));

    const maxEmpNum = empNumbers.length > 0 ? Math.max(...empNumbers) : 0;
    const nextEmpId = `EMP-E${String(maxEmpNum + 1).padStart(2, '0')}`;

    setFormData({
      ...initialForm,
      employee_id: nextEmpId,
      joining_date: new Date().toISOString().slice(0, 10),
      role: 'EMPLOYEE',
    });
    setAddModalOpen(true);
  };

  const handleManagerSelect = (managerId) => {
    const selectedMgr = employees.find((m) => String(m.id) === String(managerId));
    if (selectedMgr) {
      setFormData((prev) => ({
        ...prev,
        manager: managerId,
        department: selectedMgr.department || prev.department,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        manager: managerId,
      }));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid corporate email address (e.g. user@company.com).');
      return;
    }

    const phoneCleaned = (formData.phone || '').replace(/[\s\-\(\)]/g, '');
    if (!phoneCleaned || !/^\+?[0-9]{10,15}$/.test(phoneCleaned)) {
      toast.error('Please enter a valid 10-digit mobile phone number.');
      return;
    }

    if (!formData.joining_date) {
      toast.error('Please select a Joining Date.');
      return;
    }

    setActionLoading(true);
    try {
      const payload = { ...formData, role: 'EMPLOYEE' };
      if (!payload.manager) delete payload.manager;
      await employeeApi.create(payload);
      toast.success('Employee created successfully!');
      setAddModalOpen(false);
      fetchEmployees();
    } catch (err) {
      const msg = err.response?.data?.email?.[0] || 
                  err.response?.data?.phone?.[0] || 
                  err.response?.data?.joining_date?.[0] || 
                  err.response?.data?.detail || 
                  JSON.stringify(err.response?.data) || 
                  'Failed to create employee.';
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEdit = (emp) => {
    setSelectedEmployee(emp);
    setFormData({
      first_name: emp.first_name || '',
      last_name: emp.last_name || '',
      phone: emp.phone || '',
      department: emp.department || '',
      designation: emp.designation || '',
      role: emp.role || 'EMPLOYEE',
      joining_date: emp.joining_date || new Date().toISOString().slice(0, 10),
      manager: emp.manager || '',
    });
    setEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (formData.phone) {
      const phoneCleaned = formData.phone.replace(/[\s\-\(\)]/g, '');
      if (!/^\+?[0-9]{10,15}$/.test(phoneCleaned)) {
        toast.error('Please enter a valid 10-digit mobile phone number.');
        return;
      }
    }

    setActionLoading(true);
    try {
      const payload = { ...formData };
      if (!payload.manager) payload.manager = null;
      await employeeApi.update(selectedEmployee.id, payload);
      toast.success('Employee updated successfully!');
      setEditModalOpen(false);
      fetchEmployees();
    } catch (err) {
      const msg = err.response?.data?.phone?.[0] || err.response?.data?.detail || 'Failed to update employee.';
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (emp) => {
    if (!window.confirm(`Are you sure you want to change status for ${emp.full_name}?`)) return;
    try {
      const res = await employeeApi.toggleStatus(emp.id);
      toast.success(res.message);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to toggle employee status.');
    }
  };

  const managersList = employees.filter((e) => e.role === 'MANAGER' || e.role === 'ADMIN');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Employee Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage company employees, team assignments, roles, and employment statuses.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-xs self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">All Departments</option>
            <option value="Software Development">Software Development</option>
            <option value="QA Testing">QA Testing</option>
            <option value="CyberSecurity">CyberSecurity</option>
            <option value="UI/UX Designer">UI/UX Designer</option>
            <option value="Sales & Marketing">Sales & Marketing</option>
            <option value="Technical Support">Technical Support</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : employees.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No employees match the specified criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">Department & Role</th>
                  <th className="px-6 py-3.5">Contact</th>
                  <th className="px-6 py-3.5">Reporting Manager</th>
                  <th className="px-6 py-3.5">Joining Date</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                          {emp.first_name ? emp.first_name[0] : 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{emp.full_name}</p>
                          <p className="text-xs text-slate-400">{emp.employee_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800">{emp.designation}</p>
                      <p className="text-xs text-slate-400">{emp.department} • <strong className="text-slate-600">{emp.role}</strong></p>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <p className="text-slate-700 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" />{emp.email}</p>
                      {emp.phone && <p className="text-slate-500 flex items-center gap-1.5 mt-0.5"><Phone className="w-3.5 h-3.5 text-slate-400" />{emp.phone}</p>}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {emp.manager_name ? (
                        <span className="font-medium text-slate-700">{emp.manager_name}</span>
                      ) : (
                        <span className="text-slate-400 italic">None (Top Level)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">
                      {emp.joining_date || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={emp.employment_status} />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(emp)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Edit Employee"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(emp)}
                        className={`p-1.5 rounded-lg transition ${
                          emp.employment_status === 'ACTIVE'
                            ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                            : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={emp.employment_status === 'ACTIVE' ? 'Deactivate Employee' : 'Activate Employee'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New Employee"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Employee ID *</label>
              <input
                type="text"
                required
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">User Role</label>
              <div className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-700 font-semibold flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Employee (Default)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="e.g. Rahul"
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="e.g. Sharma"
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Corporate Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="rahul@company.com"
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Mobile Phone (10 Digits) *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. 9876543210"
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Department *</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Software Development">Software Development</option>
                <option value="QA Testing">QA Testing</option>
                <option value="CyberSecurity">CyberSecurity</option>
                <option value="UI/UX Designer">UI/UX Designer</option>
                <option value="Sales & Marketing">Sales & Marketing</option>
                <option value="Technical Support">Technical Support</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Designation *</label>
              <input
                type="text"
                required
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="e.g. Software Engineer"
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Reporting Manager *</label>
              <select
                value={formData.manager}
                onChange={(e) => handleManagerSelect(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Select Department Manager...</option>
                {managersList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} ({m.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Joining Date *</label>
              <input
                type="date"
                required
                value={formData.joining_date}
                onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Temporary Password</label>
            <input
              type="text"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50"
            >
              Save Employee
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Employee: ${selectedEmployee?.full_name}`}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">First Name</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Last Name</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">HR / Admin</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Software Development">Software Development</option>
                <option value="QA Testing">QA Testing</option>
                <option value="CyberSecurity">CyberSecurity</option>
                <option value="UI/UX Designer">UI/UX Designer</option>
                <option value="Sales & Marketing">Sales & Marketing</option>
                <option value="Technical Support">Technical Support</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Designation</label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Reporting Manager</label>
              <select
                value={formData.manager || ''}
                onChange={(e) => handleManagerSelect(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">None (Top Level)</option>
                {managersList
                  .filter((m) => m.id !== selectedEmployee?.id)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.department})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Joining Date</label>
              <input
                type="date"
                value={formData.joining_date || ''}
                onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50"
            >
              Update Employee
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
