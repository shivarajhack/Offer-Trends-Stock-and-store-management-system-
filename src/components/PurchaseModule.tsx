/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, Supplier, PurchaseOrder } from '../types.js';
import { Plus, Users, ShoppingBag, FolderCheck, Check, Truck, ListCollapse, ArrowUpRight, CheckSquare, PlusCircle } from 'lucide-react';

interface PurchaseModuleProps {
  products: Product[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  onAddSupplier: (sup: Omit<Supplier, 'id'>) => Promise<boolean>;
  onCreatePO: (supplierId: string, items: { productId: string; quantity: number; purchasePrice: number }[]) => Promise<boolean>;
  onPOStatusChange: (poId: string, status: 'Approved' | 'Received') => Promise<boolean>;
}

export default function PurchaseModule({
  products,
  suppliers,
  purchaseOrders,
  onAddSupplier,
  onCreatePO,
  onPOStatusChange
}: PurchaseModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<'po' | 'suppliers'>('po');
  const [isAddingSup, setIsAddingSup] = useState(false);
  const [isAddingPO, setIsAddingPO] = useState(false);

  // Supplier form states
  const [supplierName, setSupplierName] = useState('');
  const [contact, setContact] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [address, setAddress] = useState('');

  // PO builder states
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poItems, setPoItems] = useState<{ productId: string; quantity: number; purchasePrice: number }[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!supplierName || !contact || !gstNumber) {
      setError('Please provide supplier name, phone contact and GSTIN.');
      return;
    }

    setLoading(true);
    try {
      const ok = await onAddSupplier({
        supplierName,
        contact,
        gstNumber: gstNumber.toUpperCase(),
        address
      });

      if (ok) {
        setSuccess('Supplier registered successfully!');
        setSupplierName('');
        setContact('');
        setGstNumber('');
        setAddress('');
        setIsAddingSup(false);
      } else {
        setError('Failed to log supplier info.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error occurred during supplier registry');
    } finally {
      setLoading(false);
    }
  };

  const addPOItemRow = () => {
    setPoItems([...poItems, { productId: '', quantity: 1, purchasePrice: 0 }]);
  };

  const handlePOItemChange = (idx: number, field: string, value: any) => {
    const updated = [...poItems];
    const item = { ...updated[idx], [field]: value };
    
    if (field === 'productId') {
      const p = products.find(prod => prod.productId === value);
      if (p) {
        item.purchasePrice = p.purchasePrice;
      }
    }
    
    updated[idx] = item;
    setPoItems(updated);
  };

  const removePOItemRow = (idx: number) => {
    setPoItems(poItems.filter((_, i) => i !== idx));
  };

  const handlePOSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!poSupplierId || poItems.length === 0) {
      setError('Please select a supplier and add PO items.');
      return;
    }

    // validate items
    const hasInvalid = poItems.some(i => !i.productId || i.quantity <= 0);
    if (hasInvalid) {
      setError('Each row must contain a valid product and quantity.');
      return;
    }

    setLoading(true);
    try {
      const ok = await onCreatePO(poSupplierId, poItems);
      if (ok) {
        setSuccess('Purchase Order Draft issued successfully!');
        setIsAddingPO(false);
        setPoItems([]);
        setPoSupplierId('');
      } else {
        setError('Failed to create purchase order. Database error.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error creating Purchase Order');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (poId: string, nextStatus: 'Approved' | 'Received') => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const ok = await onPOStatusChange(poId, nextStatus);
      if (ok) {
        setSuccess(`Purchase Order is now flagged as ${nextStatus}!`);
      } else {
        setError('Status upgrade failure.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error executing PO status upgrade');
    } finally {
      setLoading(false);
    }
  };

  const getProductLabel = (id: string) => {
    const p = products.find(prod => prod.productId === id);
    return p ? `${p.productName} (${p.size}/${p.color})` : id;
  };

  return (
    <div className="space-y-6">
      {/* Tab controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Suppliers & Procurement</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Draft Purchase Orders (PO), approve wholesale procurements, and manage supplier listings.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => { setActiveSubTab('po'); setError(''); setSuccess(''); }}
            className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all ${
              activeSubTab === 'po' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            Purchase Orders (PO)
          </button>
          <button
            onClick={() => { setActiveSubTab('suppliers'); setError(''); setSuccess(''); }}
            className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all ${
              activeSubTab === 'suppliers' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            Suppliers directory
          </button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 font-bold">{error}</div>}
      {success && <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-100 font-bold">{success}</div>}

      {/* CORE DISPLAY BY ACTIVE SUBTAB */}
      {activeSubTab === 'po' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-end">
            <button
              onClick={() => { setIsAddingPO(!isAddingPO); addPOItemRow(); }}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-4 rounded-lg shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              {isAddingPO ? 'Close PO form' : 'Draft New Purchase Order'}
            </button>
          </div>

          {isAddingPO && (
            <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
              <div className="font-bold text-slate-900 text-sm mb-4">Create Purchase Order (PO) Form</div>
              <form onSubmit={handlePOSubmit} className="space-y-4">
                <div className="max-w-md">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Select Supplier *</label>
                  <select
                    value={poSupplierId}
                    onChange={(e) => setPoSupplierId(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-205 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium cursor-pointer"
                  >
                    <option value="">-- Choose Supplier --</option>
                    {suppliers.map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.supplierName}</option>
                    ))}
                  </select>
                </div>

                {/* Rows builder */}
                <div className="space-y-2.5 pt-2">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">Procuring items</span>
                  {poItems.map((row, idx) => (
                    <div key={idx} className="flex gap-2.5 items-end flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-[9px] text-slate-400">Product Line</label>
                        <select
                          value={row.productId}
                          onChange={(e) => handlePOItemChange(idx, 'productId', e.target.value)}
                          className="w-full bg-slate-50 text-slate-850 text-xs py-2 px-2.5 rounded border border-slate-200"
                        >
                          <option value="">-- Select SKU matching catalogs --</option>
                          {products.map(p => (
                            <option key={p.productId} value={p.productId}>{p.productName} ({p.size}/{p.color})</option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24">
                        <label className="block text-[9px] text-slate-400">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={row.quantity}
                          onChange={(e) => handlePOItemChange(idx, 'quantity', Number(e.target.value))}
                          className="w-full bg-slate-50 text-slate-850 text-xs py-2 px-2 border border-slate-200 rounded font-mono"
                        />
                      </div>

                      <div className="w-32">
                        <label className="block text-[9px] text-slate-400">Unit Cost Rate (INR)</label>
                        <input
                          type="number"
                          value={row.purchasePrice}
                          onChange={(e) => handlePOItemChange(idx, 'purchasePrice', Number(e.target.value))}
                          className="w-full bg-slate-50 text-slate-850 text-xs py-2 px-2 border border-slate-200 rounded font-mono"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removePOItemRow(idx)}
                        className="p-2 border border-red-100 bg-red-50 text-red-550 rounded text-xs hover:bg-red-100"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addPOItemRow}
                    className="text-xs font-bold text-indigo-650 hover:underline flex items-center gap-1"
                  >
                    + Add item row
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsAddingPO(false)} className="text-xs text-slate-500 font-bold px-3">Cancel</button>
                  <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-4 rounded-lg">Draft PO Voucher</button>
                </div>
              </form>
            </div>
          )}

          {/* List existing POs */}
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] text-slate-500 uppercase font-bold bg-slate-50/50">
                    <th className="py-3 px-4">PO Code</th>
                    <th className="py-3 px-4">Wholesale Supplier</th>
                    <th className="py-3 px-4">Draft Date</th>
                    <th className="py-3 px-4">Materials list</th>
                    <th className="py-3 px-4 text-right">Invoice Sum</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs select-text">
                  {[...purchaseOrders].reverse().map(po => {
                    const sup = suppliers.find(s => s.id === po.supplierId);
                    return (
                      <tr key={po.id} className="hover:bg-slate-50/20">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-400">{po.poNumber}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{sup ? sup.supplierName : po.supplierId}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">{po.date}</td>
                        <td className="py-3.5 px-4 space-y-1">
                          {po.items.map((it, idx) => (
                            <div key={idx} className="text-[11px] text-slate-650">
                              • {getProductLabel(it.productId)} <span className="font-bold text-slate-850">x{it.quantity}</span>
                            </div>
                          ))}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(po.totalAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            po.status === 'Draft' 
                              ? 'bg-slate-50 text-slate-600 border-slate-205'
                              : po.status === 'Approved'
                                ? 'bg-indigo-50 text-indigo-750 border-indigo-150'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-150'
                          }`}>
                            {po.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right gap-1 space-x-1">
                          {po.status === 'Draft' && (
                            <button
                              id={`approve-po-btn-${po.id}`}
                              onClick={() => handleStatusUpdate(po.id, 'Approved')}
                              className="text-[10px] font-black bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-1 rounded"
                            >
                              Approve PO
                            </button>
                          )}
                          {po.status === 'Approved' && (
                            <button
                              id={`receive-po-btn-${po.id}`}
                              onClick={() => handleStatusUpdate(po.id, 'Received')}
                              className="text-[10px] font-black bg-emerald-55 bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded flex items-center gap-1 inline-flex shadow-sm"
                            >
                              <Truck className="w-3 h-3" /> Receive stock
                            </button>
                          )}
                          {po.status === 'Received' && (
                            <span className="text-[10px] text-slate-400 font-bold">HQ Stocks Refilled</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-end">
            <button
              onClick={() => setIsAddingSup(!isAddingSup)}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-4 rounded-lg shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              {isAddingSup ? 'Close supplier form' : 'Register wholesale Supplier'}
            </button>
          </div>

          {isAddingSup && (
            <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm max-w-xl">
              <div className="font-bold text-slate-900 text-sm mb-4">Supplier Registration Form</div>
              <form onSubmit={handleSupplierSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Supplier Name *</label>
                    <input
                      id="form-supplier-name"
                      type="text"
                      placeholder="e.g. Vikas Garments Wholesale"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-205"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Contact Phone *</label>
                    <input
                      id="form-supplier-contact"
                      type="text"
                      placeholder="e.g. 9448123456"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-205"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">GSTIN Number *</label>
                    <input
                      id="form-supplier-gst"
                      type="text"
                      maxLength={15}
                      placeholder="e.g. 29VGW7890H1Z8"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 text-slate-805 text-xs py-2 px-3 rounded-lg border border-slate-205 font-mono"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Address *</label>
                    <input
                      id="form-supplier-address"
                      type="text"
                      placeholder="e.g. Nehru Nagar, Hubli"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-205"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setIsAddingSup(false)} className="text-xs text-slate-500 font-bold px-3 py-1.5">Cancel</button>
                  <button type="submit" className="bg-slate-900 text-white font-bold text-xs py-2 px-4 rounded-lg">Register wholesale Supplier</button>
                </div>
              </form>
            </div>
          )}

          {/* Suppliers Directory lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {suppliers.map(sup => (
              <div key={sup.id} className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2 mb-3">
                    <span className="font-bold text-slate-850 text-xs uppercase font-mono tracking-tight text-slate-400">Supplier #{sup.id}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm leading-tight mb-2">{sup.supplierName}</h3>
                  <p className="text-xs text-slate-550 leading-relaxed max-w-sm mb-4">Address: {sup.address}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-slate-50 pt-3 font-mono">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Contact</span>
                    <span className="font-semibold text-slate-700">{sup.contact}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">GST Number</span>
                    <span className="font-semibold text-slate-700">{sup.gstNumber}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
