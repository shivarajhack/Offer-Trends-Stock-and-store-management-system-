/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Staff, Role, Store } from '../types.js';
import { Plus, Table2, ShieldAlert, GraduationCap, DollarSign, Calendar, EyeOff, UserPlus, Phone, Mail } from 'lucide-react';

interface StaffModuleProps {
  staff: Staff[];
  stores: Store[];
  onAddStaff: (employee: Staff) => Promise<boolean>;
}

export default function StaffModule({ staff, stores, onAddStaff }: StaffModuleProps) {
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('Sales Executive');
  const [storeId, setStoreId] = useState('store-hubli');
  const [salary, setSalary] = useState('');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!employeeId || !name || !mobile || !email || !salary) {
      setError('Please fill out all employee fields');
      return;
    }

    if (mobile.length < 10) {
      setError('Phone contact must be at least 10 digits');
      return;
    }

    setLoading(true);
    try {
      const ok = await onAddStaff({
        employeeId: employeeId.toUpperCase(),
        name,
        mobile,
        email,
        role,
        storeId,
        salary: Number(salary) || 20000,
        joiningDate,
        status
      });

      if (ok) {
        setSuccess(`Personnel registered successfully! Assigned as ${role}`);
        setEmployeeId('');
        setName('');
        setMobile('');
        setEmail('');
        setSalary('');
        setIsAdding(false);
      } else {
        setError('Employee ID already exists. Please verify employee records.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error occurred while registering staff');
    } finally {
      setLoading(false);
    }
  };

  const getStoreName = (id: string) => {
    if (id === 'Warehouse') return 'Central Warehouse';
    const storeObj = stores.find(s => s.id === id);
    return storeObj ? storeObj.storeName : id;
  };

  const getRoleBadgeClass = (r: Role) => {
    switch(r) {
      case 'Super Admin': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Manager': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Cashier': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Sales Executive': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Warehouse Staff': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Staff Directories</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage employee roles, assigned retail stores, monthly payroll and status indicators.</p>
        </div>
        <button
          id="add-staff-trigger"
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 bg-slate-100/80 hover:bg-slate-200 text-slate-800 border border-slate-250 font-semibold text-xs py-2 px-3.5 rounded-lg shadow-sm transition-all"
        >
          <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
          {isAdding ? 'Close form' : 'Register Employee'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm max-w-2xl">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm mb-4">
            <Plus className="w-4 h-4 text-emerald-600" />
            Enter Employee Credentials
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 font-semibold">{error}</div>}
            {success && <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-100 font-semibold">{success}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Employee ID (Unique) *</label>
                <input
                  id="form-staff-id"
                  type="text"
                  placeholder="e.g. OT-EM-110"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Employee Full Name *</label>
                <input
                  id="form-staff-name"
                  type="text"
                  placeholder="e.g. Anand Gowda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Mobile Contact *</label>
                <input
                  id="form-staff-mobile"
                  type="text"
                  maxLength={11}
                  placeholder="e.g. 9886450122"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Email Connection *</label>
                <input
                  id="form-staff-email"
                  type="email"
                  placeholder="e.g. anand@offertrends.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Assigned Role *</label>
                <select
                  id="form-staff-role"
                  value={role}
                  onChange={(e) => {
                    const r = e.target.value as Role;
                    setRole(r);
                    if (r === 'Warehouse Staff') setStoreId('Warehouse');
                  }}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium cursor-pointer"
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Cashier">Cashier</option>
                  <option value="Sales Executive">Sales Executive</option>
                  <option value="Warehouse Staff">Warehouse Staff</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Primary Allocation Location *</label>
                <select
                  id="form-staff-store"
                  value={storeId}
                  disabled={role === 'Warehouse Staff'}
                  onChange={(e) => setStoreId(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="Warehouse">Central Warehouse</option>
                  {stores.map(st => (
                    <option key={st.id} value={st.id}>{st.storeName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Monthly Cost Salary (INR) *</label>
                <input
                  id="form-staff-salary"
                  type="number"
                  placeholder="e.g. 25005"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Joining Contract Date</label>
                <input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full bg-slate-50 text-slate-850 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Active Status</label>
                <div className="flex gap-4 mt-2">
                  <label className="inline-flex items-center text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={status === 'Active'}
                      onChange={() => setStatus('Active')}
                      className="text-emerald-600 focus:ring-0 mr-1.5"
                    />
                    Active
                  </label>
                  <label className="inline-flex items-center text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={status === 'Inactive'}
                      onChange={() => setStatus('Inactive')}
                      className="text-red-650 focus:ring-0 mr-1.5"
                    />
                    Inactive
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-xs text-slate-500 hover:text-slate-850 font-bold px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                id="submit-staff-btn"
                type="submit"
                disabled={loading}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-4 rounded-lg shadow-sm transition-colors"
              >
                {loading ? 'Adding...' : 'Register Employee'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Directory Grid Ledger */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Table2 className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700">Personnel Registered Directory</span>
          </div>
          <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-semibold">{staff.length} Active Staff</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase font-black tracking-widest bg-slate-50/20">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Role Profile</th>
                <th className="py-3 px-4">Store Location</th>
                <th className="py-3 px-4">Mobile & Email</th>
                <th className="py-3 px-4">Monthly Salary</th>
                <th className="py-3 px-4">Joining Date</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {staff.map((st) => (
                <tr key={st.employeeId} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center font-bold text-slate-700 shrink-0 select-none uppercase">
                        {st.name.charAt(0)}
                      </div>
                      <div>
                        <span className="block font-bold text-slate-800 leading-tight">{st.name}</span>
                        <span className="text-[9px] font-mono text-slate-400 font-medium tracking-tight uppercase">{st.employeeId}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] border px-2 py-0.5 rounded-full font-bold inline-block leading-tight ${getRoleBadgeClass(st.role)}`}>
                      {st.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700">
                    {getStoreName(st.storeId)}
                  </td>
                  <td className="py-3 px-4 space-y-0.5">
                    <div className="flex items-center gap-1 text-[11px] text-slate-600 font-mono">
                      <Phone className="w-3 h-3 text-slate-405 shrink-0" />
                      <span>{st.mobile}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Mail className="w-2.5 h-2.5 text-slate-350 shrink-0" />
                      <span>{st.email}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-800 text-[11px]">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(st.salary)}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px] font-medium font-mono">
                    {st.joiningDate}
                  </td>
                  <td className="py-3 px-4 text-center font-bold">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] border font-semibold ${
                      st.status === 'Active' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      {st.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
