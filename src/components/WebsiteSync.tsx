/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, WebsiteOrder } from '../types.js';
import { Radio, RefreshCw, Send, Terminal, ShoppingBag, Laptop, Code, CheckCircle, Database } from 'lucide-react';

interface WebsiteSyncProps {
  products: Product[];
  websiteOrders: WebsiteOrder[];
  onSubmitWebOrder: (data: { customerName: string; customerEmail: string; items: { productId: string; quantity: number }[] }) => Promise<boolean>;
}

export default function WebsiteSync({
  products,
  websiteOrders,
  onSubmitWebOrder
}: WebsiteSyncProps) {
  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');

  // Live Sync Payload logs
  const [activeEndpoint, setActiveEndpoint] = useState<'products' | 'stock'>('products');
  const [syncLogs, setSyncLogs] = useState<any>(null);
  const [fetchLoading, setFetchLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch API representations live from the server
  const fetchLivePayload = async (endpoint: 'products' | 'stock') => {
    setFetchLoading(true);
    try {
      const resp = await fetch(`/api/${endpoint}`);
      if (resp.ok) {
        const json = await resp.json();
        setSyncLogs(json);
      } else {
        setSyncLogs({ error: `Backend returned status ${resp.status}` });
      }
    } catch (err: any) {
      setSyncLogs({ error: `Connection failed: ${err?.message || err}` });
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchLivePayload(activeEndpoint);
  }, [activeEndpoint, products, websiteOrders]);

  const handleSimulateWebOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!customerName || !productId || !quantity) {
      setError('Please provide customer name, item and quantity');
      return;
    }

    const qty = Number(quantity);
    if (qty <= 0) {
      setError('Quantity must be greater than zero');
      return;
    }

    // Check central warehouse limits
    const matched = products.find(p => p.productId === productId);
    if (matched && matched.warehouseQuantity < qty) {
      setError(`Cannot fulfill order. Insufficient stock in Central Warehouse (Available: ${matched.warehouseQuantity} units)`);
      return;
    }

    setLoading(true);
    try {
      const ok = await onSubmitWebOrder({
        customerName,
        customerEmail: customerEmail || 'guest@offertrends.com',
        items: [{ productId, quantity: qty }]
      });

      if (ok) {
        setSuccess('eCommerce Web Order synchronized successfully! Mother stocks decremented.');
        setCustomerName('');
        setCustomerEmail('');
        setProductId('');
        setQuantity('1');
        
        // Trigger fresh payload fetch
        fetchLivePayload(activeEndpoint);
      } else {
        setError('Connection declined. Check if product exists or stock level is empty.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error occurred while dispatching web order API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl animate-pulse">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Future Website Integration Hub</h2>
            <p className="text-xs text-slate-500 mt-0.5">Test regional omnichannel REST sync flows. Connect and sync offline stocks with online eCommerce in real-time.</p>
          </div>
        </div>
        <span className="text-[10px] bg-slate-950 text-emerald-400 border border-slate-800 font-mono font-bold uppercase py-1 px-3 rounded-md flex items-center gap-1">
          <Code className="w-3.5 h-3.5" /> Live REST APIs Active
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* eCommerce website Simulator form (Left, Cols 5) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-150 p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Laptop className="w-4.5 h-4.5 text-slate-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-650">Simulate eCommerce checkout</h3>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
              Simulate an online shopping customer checkout on the website. This fires a real API request to 
              <code className="bg-slate-50 text-slate-800 font-mono px-1 py-0.5 rounded text-[10px] ml-1">POST /api/order</code>, which immediately matches SKU data and subtracts warehouse stock levels.
            </p>

            {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-150 font-bold mb-3">{error}</div>}
            {success && <div className="p-3 bg-emerald-50 text-emerald-701 text-xs rounded-lg border border-emerald-150 font-bold mb-3">{success}</div>}

            <form onSubmit={handleSimulateWebOrder} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Customer Full Name *</label>
                <input
                  id="form-web-customer"
                  type="text"
                  placeholder="e.g. Ramesh Hegde"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-205 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Customer Email *</label>
                <input
                  id="form-web-email"
                  type="email"
                  placeholder="e.g. ramesh@gmail.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-slate-50 text-slate-850 text-xs py-2 px-3 rounded-lg border border-slate-205 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Add to digital basket *</label>
                <select
                  id="form-web-product"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-205 focus:outline-none"
                >
                  <option value="">-- Choose Stock SKU --</option>
                  {products.map(p => (
                    <option key={p.productId} value={p.productId}>
                      {p.productName} ({p.size}/{p.color}) - (HQ Stock: {p.warehouseQuantity} units)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Quantity *</label>
                <input
                  id="form-web-qty"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-205 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                />
              </div>

              <button
                id="submit-web-order-btn"
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {loading ? 'Submitting checkout...' : 'Checkout simulated order'}
              </button>
            </form>
          </div>

          {/* Real-Time Sync Flow chart */}
          <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100 text-[11px] space-y-1">
            <span className="font-bold text-slate-800 block">Regional Omnichannel Flow Chart:</span>
            <div className="flex items-center gap-1.5 text-slate-400 flex-wrap">
              <span className="text-slate-650 font-semibold">Web Order Checkout</span>
              <span>➔</span>
              <span className="text-emerald-700 font-semibold">Decr Warehouse Stock</span>
              <span>➔</span>
              <span className="text-indigo-700 font-semibold">Live sync REST update</span>
            </div>
          </div>
        </div>

        {/* Live Payload inspector (Right, Cols 7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 shadow-md text-slate-200 font-mono flex flex-col justify-between h-[510px]">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold font-mono tracking-tight text-white">REST API payload log terminal</span>
                </div>
                
                <div className="flex bg-slate-800 p-0.5 rounded border border-slate-705">
                  <button
                    onClick={() => setActiveEndpoint('products')}
                    className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${
                      activeEndpoint === 'products' ? 'bg-slate-700 text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    GET /api/products
                  </button>
                  <button
                    onClick={() => setActiveEndpoint('stock')}
                    className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${
                      activeEndpoint === 'stock' ? 'bg-slate-700 text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    GET /api/stock
                  </button>
                </div>
              </div>

              {/* Payload log display */}
              <div className="bg-slate-950/70 rounded-lg p-3 border border-slate-850 h-[340px] overflow-auto text-xs text-emerald-500 list-none scrollbar-thin select-all">
                {fetchLoading ? (
                  <div className="text-slate-500 py-16 text-center text-xs animate-pulse">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Executing REST API fetch request...
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap select-all text-[11px] leading-relaxed">
                    {syncLogs ? JSON.stringify(syncLogs, null, 2) : '// Empty Response payload'}
                  </pre>
                )}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[11px] text-zinc-500 select-none">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-500" />
                Durable Local JSON database sync
              </span>
              <button 
                onClick={() => fetchLivePayload(activeEndpoint)}
                className="hover:text-white flex items-center gap-1.5 underline"
              >
                <RefreshCw className="w-3 h-3" /> Force reload API
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* eCommerce Recent Web Orders lists */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-700">Recent Online Order Logs API</h3>
          </div>
          <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold border border-emerald-100 px-2 py-0.5 rounded font-mono uppercase">
            eCommerce Linked
          </span>
        </div>

        <div className="overflow-x-auto">
          {websiteOrders.length === 0 ? (
            <div className="text-center py-10 text-slate-300 text-xs font-medium">No online orders sync logs recorded.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] text-slate-505 uppercase bg-slate-50/10">
                  <th className="py-3 px-4">Ref API ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Item ordered</th>
                  <th className="py-3 px-4 text-right">Sum paid</th>
                  <th className="py-3 px-4">Date Sync</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs select-text">
                {websiteOrders.map(ord => (
                  <tr key={ord.id} className="hover:bg-slate-50/20">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-400">{ord.id}</td>
                    <td className="py-3.5 px-4">
                      <span className="block font-bold text-slate-800">{ord.customerName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{ord.customerEmail}</span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-650">
                      {ord.items.map((it, idx) => (
                        <div key={idx}>SKU: {it.sku} <span className="font-bold text-slate-900">x{it.quantity}</span></div>
                      ))}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(ord.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[10px] font-mono">
                      {new Date(ord.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="bg-emerald-50 text-emerald-800 text-[10px] px-2 py-0.5 border border-emerald-150 rounded-full font-bold">
                        {ord.status}
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
