/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, Supplier, StockIn, Store } from '../types.js';
import { Plus, PackageCheck, ListOrdered, Calendar, History, ArrowUpRight, Warehouse, BookOpen } from 'lucide-react';

interface InventoryModuleProps {
  products: Product[];
  suppliers: Supplier[];
  stockIns: StockIn[];
  stores: Store[];
  onStockIn: (data: Omit<StockIn, 'id'>) => Promise<boolean>;
}

export default function InventoryModule({
  products,
  suppliers,
  stockIns,
  stores,
  onStockIn
}: InventoryModuleProps) {
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [supplierId, setSupplierId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 16));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!productId || !quantity || !invoiceNumber) {
      setError('Please select a product and provide quantity and invoice details.');
      return;
    }

    if (Number(quantity) <= 0) {
      setError('Quantity must be greater than zero');
      return;
    }

    setLoading(true);
    try {
      const selectedProd = products.find(p => p.productId === productId);
      const chosenCost = costPrice ? Number(costPrice) : (selectedProd ? selectedProd.purchasePrice : 250);

      const ok = await onStockIn({
        supplierId: supplierId || suppliers[0]?.id || 'sup-1',
        productId,
        quantity: Number(quantity),
        costPrice: chosenCost,
        invoiceNumber,
        date: new Date(date).toISOString()
      });

      if (ok) {
        setSuccess('Shipment loaded! Warehouse stock incremented automatically.');
        setProductId('');
        setQuantity('');
        setCostPrice('');
        setInvoiceNumber('');
        setIsAdding(false);
      } else {
        setError('Failed to log Stock In. Product registry lookup err.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error executing warehouse stock-in');
    } finally {
      setLoading(false);
    }
  };

  const getProductLabel = (id: string) => {
    const p = products.find(prod => prod.productId === id);
    return p ? `${p.productName} (${p.size} ${p.color}) SKU: ${p.sku}` : id;
  };

  const getSupplierLabel = (id: string) => {
    const s = suppliers.find(sup => sup.id === id);
    return s ? s.supplierName : 'Vikas Garments Wholesale';
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Overview block */}
      <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Warehouse className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Central Warehouse Control</h2>
            <p className="text-xs text-slate-500 mt-0.5">Control parent stocks, receive supply truck deliveries, and allocate stock items.</p>
          </div>
        </div>
        <button
          id="stock-in-trigger"
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-4 rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          {isAdding ? 'Close form' : 'Log Supply Delivery (Stock In)'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm max-w-2xl">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm mb-4">
            <PackageCheck className="w-4 h-4 text-indigo-600" />
            File New Stock In Shipment Voucher
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 font-semibold">{error}</div>}
            {success && <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-100 font-semibold">{success}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Select wholesale Supplier *</label>
                <select
                  id="form-stock-supplier"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-205 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium cursor-pointer"
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.supplierName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Incoming product SKU *</label>
                <select
                  id="form-stock-product"
                  value={productId}
                  onChange={(e) => {
                    setProductId(e.target.value);
                    const sel = products.find(p => p.productId === e.target.value);
                    if (sel) setCostPrice(String(sel.purchasePrice));
                  }}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-205 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium cursor-pointer"
                >
                  <option value="">-- Select SKU Master --</option>
                  {products.map(prod => (
                    <option key={prod.productId} value={prod.productId}>{prod.productName} ({prod.size}/{prod.color})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Received quantity *</label>
                <input
                  id="form-stock-quantity"
                  type="number"
                  min="1"
                  placeholder="e.g. 100"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-205 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Purchase cost Rate (Per Item)</label>
                <input
                  id="form-stock-cost"
                  type="number"
                  placeholder="Defaults to base purchase price"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-205 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Invoice / Challan Reference *</label>
                <input
                  id="form-stock-invoice"
                  type="text"
                  placeholder="e.g. CH-2026-9021"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-205 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Delivery Arrival Date & Time</label>
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-205 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium font-mono"
                />
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
                id="submit-stock-in-btn"
                type="submit"
                disabled={loading}
                className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-lg shadow-sm transition-colors"
              >
                {loading ? 'Receiving...' : 'Sign Challan & Stock In'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid: Warehouse catalog ledger vs Arrival history */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Parent Warehouse Volume lists */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Parent Warehouse inventory stock</h3>
              <p className="text-[11px] text-slate-400">Total physical materials currently sitting in mother warehouse.</p>
            </div>
            <span className="text-[10px] bg-slate-55 bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">
              HQ Core
            </span>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {products.map(p => (
              <div key={p.productId} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 hover:bg-slate-50/50">
                <div>
                  <span className="block font-bold text-slate-800 text-xs">{p.productName}</span>
                  <div className="flex items-center gap-1.5 font-mono text-[9px] text-slate-400 mt-0.5 font-semibold">
                    <span>SKU: {p.sku}</span>
                    <span>•</span>
                    <span>SZ: {p.size} {p.color}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">Available:</span>
                  <span className={`font-mono text-sm font-black px-2 py-0.5 rounded leading-none ${
                    p.warehouseQuantity === 0 
                      ? 'bg-red-50 text-red-650' 
                      : p.warehouseQuantity < 15 
                        ? 'bg-amber-50 text-amber-650 font-extrabold' 
                        : 'bg-indigo-50 text-indigo-800'
                  }`}>
                    {p.warehouseQuantity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipment Arrival Records ledger */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Supply truck arrivals</h3>
              <p className="text-[11px] text-slate-400">Voucher record logs of verified supplier Stock In receipts.</p>
            </div>
            <History className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {stockIns.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-305 font-medium">
                No stock-in records indexed yet.
              </div>
            ) : (
              [...stockIns].reverse().map((st) => (
                <div key={st.id} className="p-3 rounded-lg bg-slate-50/50 border border-slate-100 hover:border-indigo-100 transition-colors text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] bg-slate-900 text-white font-semibold px-2 py-0.5 rounded">
                      Challan: {st.invoiceNumber}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(st.date).toLocaleDateString()} {new Date(st.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div>
                    <span className="block font-bold text-slate-800 text-[11px] leading-snug">{getProductLabel(st.productId)}</span>
                    <span className="text-[10px] text-slate-500 block">Supplier: {getSupplierLabel(st.supplierId)}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">Rate:</span>
                      <span className="font-mono font-semibold text-slate-700">{formatCurrency(st.costPrice)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="text-[10px] text-slate-400">Received:</span>
                      <span className="text-emerald-600 font-mono text-xs">+{st.quantity} units</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
