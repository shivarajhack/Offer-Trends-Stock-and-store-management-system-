/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  LayoutDashboard, 
  Store, 
  Users, 
  Shirt, 
  ArrowLeftRight, 
  Package, 
  ShoppingCart, 
  FileSpreadsheet, 
  Radio, 
  Bell, 
  UserSquare2,
  Boxes,
  X
} from 'lucide-react';
import { Role } from '../types.js';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  storeName: string;
  alertCount: number;
  isOpen?: boolean;
  onClose?: () => void;
}

const rolesList: Role[] = ['Super Admin', 'Manager', 'Cashier', 'Warehouse Staff'];

export default function Sidebar({
  activeTab,
  setActiveTab,
  currentRole,
  setCurrentRole,
  storeName,
  alertCount,
  isOpen = false,
  onClose
}: SidebarProps) {
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Super Admin', 'Manager', 'Warehouse Staff'] },
    { id: 'stores', label: 'Stores Management', icon: Store, roles: ['Super Admin'] },
    { id: 'staff', label: 'Staff Directory', icon: Users, roles: ['Super Admin', 'Manager'] },
    { id: 'products', label: 'Product Master', icon: Shirt, roles: ['Super Admin', 'Manager', 'Warehouse Staff', 'Cashier'] },
    { id: 'pos', label: 'POS Offline Billing', icon: ShoppingCart, roles: ['Super Admin', 'Manager', 'Cashier'] },
    { id: 'inventory', label: 'Stock In & Warehouse', icon: Package, roles: ['Super Admin', 'Warehouse Staff'] },
    { id: 'transfers', label: 'Inter-Store Transfer', icon: ArrowLeftRight, roles: ['Super Admin', 'Manager', 'Warehouse Staff'] },
    { id: 'purchase', label: 'Suppliers & PO', icon: Boxes, roles: ['Super Admin', 'Warehouse Staff'] },
    { id: 'reports', label: 'Reports & Export', icon: FileSpreadsheet, roles: ['Super Admin', 'Manager'] },
    { id: 'sync', label: 'Website Sync Demo', icon: Radio, roles: ['Super Admin', 'Manager', 'Warehouse Staff', 'Cashier'] }
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 text-slate-100 flex flex-col shrink-0 transition-transform duration-300 lg:static lg:translate-x-0 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 px-2.5 bg-emerald-600 rounded text-sm font-black tracking-widest text-white">OT</div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white leading-none">Offer Trends</h1>
              <span className="text-[10px] text-slate-400 font-mono tracking-widest font-semibold uppercase">Retail ERP v1.0</span>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="mt-3 py-1 px-2 rounded bg-slate-800/60 flex items-center gap-1.5 border border-slate-700/50">
          <Store className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-medium text-slate-300 truncate" title={storeName}>{storeName}</span>
        </div>
      </div>

      {/* Role Switcher (ERP Impersonater) */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/40">
        <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
          <UserSquare2 className="w-3 h-3 text-slate-400" />
          Current User Role
        </label>
        <select
          value={currentRole}
          onChange={(e) => setCurrentRole(e.target.value as Role)}
          className="w-full bg-slate-800 text-slate-200 text-xs py-1.5 px-2 rounded border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium cursor-pointer"
        >
          {rolesList.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <span className="text-[9px] text-slate-500 leading-normal block mt-1">
          Simulating role permissions in realtime.
        </span>
      </div>

      {/* Navigation Modules */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2 px-2">ERP Modules</div>
        {navItems.map((item) => {
          const isAllowed = item.roles.includes(currentRole);
          if (!isAllowed) return null;

          const IconComponent = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              id={`nav-tab-${item.id}`}
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (onClose) onClose();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                isActive 
                  ? 'bg-slate-800 text-emerald-400' 
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <IconComponent className={`w-4 h-4 transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              
              {/* Alert Count Indicator */}
              {item.id === 'dashboard' && alertCount > 0 && (
                <span className="bg-amber-600 text-slate-100 text-[10px] px-1.5 py-0.5 rounded-full font-bold flex items-center justify-center animate-pulse">
                  {alertCount}
                </span>
              )}
              {item.id === 'sync' && (
                <span className="bg-emerald-950/80 text-emerald-400 text-[9px] border border-emerald-800/50 px-1 py-0.5 rounded font-mono font-medium scale-90">
                  API
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Status Bar */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 text-slate-400 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>ONLINE</span>
        </div>
        <div className="text-[10px]">North Karnataka</div>
      </div>
    </aside>
  );
}
