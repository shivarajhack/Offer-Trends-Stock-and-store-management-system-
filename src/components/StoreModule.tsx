/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Store, Plus, Phone, FileSignature, MapPin, Building, Sparkles } from 'lucide-react';
import { Store as StoreType } from '../types.js';

interface StoreModuleProps {
  stores: StoreType[];
  onAddStore: (store: Omit<StoreType, 'id'>) => Promise<boolean>;
}

export default function StoreModule({ stores, onAddStore }: StoreModuleProps) {
  const [isAdding, setIsAdding] = useState(false);
  
  // Form elements
  const [storeName, setStoreName] = useState('');
  const [storeCode, setStoreCode] = useState('');
  const [managerName, setManagerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Karnataka');
  const [gstNumber, setGstNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Field validation
    if (!storeName || !storeCode || !managerName || !mobileNumber || !address || !city || !gstNumber) {
      setError('Please fill in all store registry fields');
      return;
    }

    if (!/^[a-zA-Z0-9-]+$/.test(storeCode)) {
      setError('Store Code should only contain letters, numbers and hyphens.');
      return;
    }

    if (mobileNumber.length < 10) {
      setError('Mobile Number must be at least 10 digits');
      return;
    }

    setLoading(true);
    try {
      const ok = await onAddStore({
        storeName,
        storeCode: storeCode.toUpperCase(),
        managerName,
        mobileNumber,
        address,
        city,
        state,
        gstNumber: gstNumber.toUpperCase()
      });

      if (ok) {
        setSuccess('Store registered successfully across North Karnataka net!');
        setStoreName('');
        setStoreCode('');
        setManagerName('');
        setMobileNumber('');
        setAddress('');
        setCity('');
        setGstNumber('');
        setIsAdding(false);
      } else {
        setError('Failed to create store. Store code might already exist.');
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred during store creation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Regional Store Locations</h2>
          <p className="text-xs text-slate-500 mt-0.5">Register, manage and track active physical outlets operating under Offer Trends.</p>
        </div>
        <button
          id="add-store-trigger"
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-4 rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          {isAdding ? 'Close registry form' : 'Register New Branch'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm max-w-2xl">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm mb-4">
            <Building className="w-4 h-4 text-emerald-600" />
            Add Store Registry Form
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 font-semibold">{error}</div>}
            {success && <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-100 font-semibold">{success}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Store Name *</label>
                <input
                  id="form-store-name"
                  type="text"
                  placeholder="e.g. Offer Trends Hubli"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Store Code (Unique) *</label>
                <input
                  id="form-store-code"
                  type="text"
                  placeholder="e.g. OT-HUBLI"
                  value={storeCode}
                  onChange={(e) => setStoreCode(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Manager In Charge *</label>
                <input
                  id="form-store-manager"
                  type="text"
                  placeholder="e.g. Ramesh Patil"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Mobile Contact *</label>
                <input
                  id="form-store-mobile"
                  type="text"
                  maxLength={12}
                  placeholder="e.g. 9845210021"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Address *</label>
                <input
                  id="form-store-address"
                  type="text"
                  placeholder="e.g. Coen Road, Hubli"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">City *</label>
                <input
                  id="form-store-city"
                  type="text"
                  placeholder="e.g. Hubli"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">State</label>
                <input
                  type="text"
                  disabled
                  value={state}
                  className="w-full bg-slate-100/50 text-slate-400 text-xs py-2 px-3 rounded-lg border border-slate-200 cursor-not-allowed font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">GST Number (15 Digits) *</label>
                <input
                  id="form-store-gst"
                  type="text"
                  maxLength={15}
                  placeholder="e.g. 29AAAAA0000A1Z1"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium font-mono uppercase"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                id="submit-store-btn"
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Register Store Location'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {stores.map((st) => (
          <div 
            key={st.id} 
            className="group relative bg-white rounded-xl border border-slate-100 p-5 shadow-xs hover:border-emerald-200 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-1.5">
                <div>
                  <h3 className="font-bold text-slate-800 group-hover:text-slate-900 transition-colors">{st.storeName}</h3>
                  <span className="text-[10px] font-mono text-emerald-600 font-black tracking-wider uppercase mt-0.5 block">{st.storeCode}</span>
                </div>
                <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors shrink-0">
                  <Building className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-2.5 my-4">
                <div className="flex items-start gap-2 text-xs text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{st.address}, {st.city}, {st.state}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-50 bg-slate-50/40 p-1.5 rounded">
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">Manager Incharge</span>
                    <span className="font-semibold text-slate-800">{st.managerName}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">GSTIN/GST Number</span>
                    <span className="font-mono text-slate-700 tracking-tight font-medium text-[10px]">{st.gstNumber}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span className="font-mono">{st.mobileNumber}</span>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded font-mono uppercase">Branch Active</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
