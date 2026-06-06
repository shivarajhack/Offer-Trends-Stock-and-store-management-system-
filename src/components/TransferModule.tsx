/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, Store, StockTransfer } from '../types.js';
import { ArrowLeftRight, ArrowRight, Table, Plus, ListFilter, Play, Calendar, AlertCircle } from 'lucide-react';

interface TransferModuleProps {
  products: Product[];
  stores: Store[];
  transfers: StockTransfer[];
  onTransfer: (data: Omit<StockTransfer, 'id' | 'status' | 'date'>) => Promise<boolean>;
}

export default function TransferModule({
  products,
  stores,
  transfers,
  onTransfer
}: TransferModuleProps) {
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [sourceStoreId, setSourceStoreId] = useState('Warehouse');
  const [destinationStoreId, setDestinationStoreId] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!productId || !quantity || !sourceStoreId || !destinationStoreId) {
      setError('Please fill in transfer logistics completely.');
      return;
    }

    if (sourceStoreId === destinationStoreId) {
      setError('Source store and destination store cannot be the same!');
      return;
    }

    const qty = Number(quantity);
    if (qty <= 0) {
      setError('Quantity to transfer must be greater than zero');
      return;
    }

    // Client-side quick check
    const product = products.find(p => p.productId === productId);
    if (product) {
      let available = 0;
      if (sourceStoreId === 'Warehouse') {
        available = product.warehouseQuantity;
      } else {
        available = product.storeQuantities[sourceStoreId] || 0;
      }

      if (available < qty) {
        setError(`Insufficient inventory at source location. Available: ${available} units`);
        return;
      }
    }

    setLoading(true);
    try {
      const ok = await onTransfer({
        productId,
        quantity: qty,
        sourceStoreId,
        destinationStoreId
      });

      if (ok) {
        setSuccess('Stock displacement completed! Records updated across digital terminals.');
        setProductId('');
        setQuantity('');
        setIsAdding(false);
      } else {
        setError('Transfer process failed. Database allocation err.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error executing inter-store transfer');
    } finally {
      setLoading(false);
    }
  };

  const getStoreLabel = (id: string) => {
    if (id === 'Warehouse') return 'Central Warehouse';
    const storeObj = stores.find(s => s.id === id);
    return storeObj ? storeObj.storeName : id;
  };

  const getProductLabel = (id: string) => {
    const p = products.find(prod => prod.productId === id);
    return p ? `${p.productName} (${p.size} ${p.color}) SKU: ${p.sku}` : id;
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Inter-Store Stock Logistics</h2>
          <p className="text-xs text-slate-500 mt-0.5">Move inventory between digital branches to balance supplies and prevent out-of-stock hurdles.</p>
        </div>
        <button
          id="transfer-trigger"
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-4 rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          {isAdding ? 'Close Transfer terminal' : 'Initiate Stock Transfer'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm max-w-2xl">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm mb-4">
            <ArrowLeftRight className="w-4 h-4 text-emerald-600" />
            File Inter-Store Stock Transfer Form
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 font-semibold">{error}</div>}
            {success && <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-100 font-semibold">{success}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Select transfer Garment *</label>
                <select
                  id="form-transfer-product"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2.5 px-3 rounded-lg border border-slate-205 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium cursor-pointer"
                >
                  <option value="">-- Select SKU matching master --</option>
                  {products.map(p => {
                    const totalSt = p.warehouseQuantity + Object.values(p.storeQuantities || {}).reduce((a,b)=>a+b, 0);
                    return (
                      <option key={p.productId} value={p.productId}>
                        {p.productName} ({p.size}/{p.color}) - (Total stock: {totalSt} Units available)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Source Store Pool *</label>
                <select
                  id="form-transfer-source"
                  value={sourceStoreId}
                  onChange={(e) => setSourceStoreId(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2.5 px-3 rounded-lg border border-slate-205 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium cursor-pointer"
                >
                  <option value="Warehouse">Central Warehouse</option>
                  {stores.map(st => (
                    <option key={st.id} value={st.id}>{st.storeName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Destination Allocation store *</label>
                <select
                  id="form-transfer-dest"
                  value={destinationStoreId}
                  onChange={(e) => setDestinationStoreId(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2.5 px-3 rounded-lg border border-slate-205 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium cursor-pointer"
                >
                  <option value="">-- Select Destination Branch --</option>
                  <option value="Warehouse">Central Warehouse</option>
                  {stores.map(st => (
                    <option key={st.id} value={st.id}>{st.storeName}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Transfer volume (Units) *</label>
                <div className="relative">
                  <input
                    id="form-transfer-qty"
                    type="number"
                    min="1"
                    placeholder="e.g. 5"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 text-xs py-2.5 px-3 rounded-lg border border-slate-205 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                  />
                  {productId && (
                    <span className="absolute right-3.5 top-3 text-[10px] text-slate-500 font-medium">
                      Source has:{' '}
                      {products.find(p=>p.productId === productId)?.[sourceStoreId === 'Warehouse' ? 'warehouseQuantity' : 'storeQuantities']?.[sourceStoreId === 'Warehouse' ? 'warehouseQuantity' as any : sourceStoreId] ?? 0}{' '}
                      units
                    </span>
                  )}
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
                id="submit-transfer-btn"
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-lg shadow-sm transition-colors"
              >
                {loading ? 'Moving...' : 'Approve & Execute dispatch'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Historical Logs Ledger */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-slate-405" />
            <span className="text-xs font-bold text-slate-700">Audit stock Transfer Logs</span>
          </div>
          <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-mono font-bold uppercase">
            Omnichannel Ledger
          </span>
        </div>

        <div className="overflow-x-auto">
          {transfers.length === 0 ? (
            <div className="text-center py-12 text-slate-300 text-xs font-medium">
              No inter-store logistics logged.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase font-black tracking-widest bg-slate-50/20">
                  <th className="py-3 px-4">Transfer Reference</th>
                  <th className="py-3 px-4">Product Details</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Transit route</th>
                  <th className="py-3 px-4">Log Timestamp</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs select-text">
                {[...transfers].reverse().map((tr) => (
                  <tr key={tr.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[10px] text-slate-400">
                      {tr.id}
                    </td>
                    <td className="py-3 px-4">
                      <span className="block font-bold text-slate-800 leading-snug">{getProductLabel(tr.productId)}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-extrabold text-indigo-700 text-[13px]">
                      {tr.quantity} <span className="text-[10px] font-normal text-slate-500">units</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-[11px] font-medium text-slate-700">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold border border-slate-200">
                          {getStoreLabel(tr.sourceStoreId)}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="bg-emerald-50 px-2 py-0.5 rounded text-emerald-850 font-bold border border-emerald-100">
                          {getStoreLabel(tr.destinationStoreId)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[10px] font-mono">
                      {new Date(tr.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-emerald-100">
                        Dispatched
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
