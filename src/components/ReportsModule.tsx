/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Product, Store, Staff, Sale, StockIn, StockTransfer } from '../types.js';
import { FileSpreadsheet, Download, Filter, Calendar, Tag, ShieldAlert, IndianRupee, PieChart } from 'lucide-react';

interface ReportsModuleProps {
  products: Product[];
  stores: Store[];
  staff: Staff[];
  sales: Sale[];
  stockIns: StockIn[];
  transfers: StockTransfer[];
}

type ReportType = 'sales' | 'products' | 'staff' | 'stocks' | 'profits' | 'gst';

export default function ReportsModule({
  products,
  stores,
  staff,
  sales,
  stockIns,
  transfers
}: ReportsModuleProps) {
  const [activeReport, setActiveReport] = useState<ReportType>('sales');
  
  // Filters
  const [selectedStoreId, setSelectedStoreId] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getStoreLabel = (id: string) => {
    if (id === 'Warehouse') return 'Central Warehouse';
    const s = stores.find(st => st.id === id);
    return s ? s.storeName : id;
  };

  const getProductLabel = (id: string) => {
    const p = products.find(prod => prod.productId === id);
    return p ? `${p.productName} (${p.size} ${p.color})` : id;
  };

  // Filter Sales Logic
  const filteredSales = sales.filter(s => {
    const matchesStore = selectedStoreId === 'All' || s.storeId === selectedStoreId;
    const saleDate = s.date.split('T')[0];
    const matchesFrom = !dateFrom || saleDate >= dateFrom;
    const matchesTo = !dateTo || saleDate <= dateTo;
    return matchesStore && matchesFrom && matchesTo;
  });

  // Export to CSV Logic
  const runCsvExport = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = `Offer_Trends_${activeReport}_report.csv`;

    if (activeReport === 'sales') {
      headers = ['Bill Number', 'Date', 'Store', 'Cashier ID', 'Items Billed', 'Payment Mode', 'Subtotal', 'Tax Amount (GST 18%)', 'Grand Total'];
      rows = filteredSales.map(s => [
        s.billNumber,
        new Date(s.date).toLocaleDateString(),
        getStoreLabel(s.storeId),
        s.staffId,
        s.items.map(it => `${it.productName} x${it.quantity}`).join(' | '),
        s.paymentMode,
        String(s.totalAmount - s.taxAmount),
        String(s.taxAmount),
        String(s.totalAmount)
      ]);
    } 
    else if (activeReport === 'products') {
      headers = ['Product ID', 'SKU', 'Barcode', 'Product Name', 'Brand', 'Category', 'Subcategory', 'Gender', 'Size', 'Color', 'Purchase Price', 'Selling Price', 'Discount Price', 'Warehouse Qty', 'Total Store Stock'];
      rows = products.map(p => [
        p.productId,
        p.sku,
        p.barcode,
        p.productName,
        p.brand,
        p.category,
        p.subCategory,
        p.gender,
        p.size,
        p.color,
        String(p.purchasePrice),
        String(p.sellingPrice),
        String(p.discountPrice),
        String(p.warehouseQuantity),
        String(Object.values(p.storeQuantities || {}).reduce((a, b) => a + b, 0))
      ]);
    } 
    else if (activeReport === 'staff') {
      headers = ['Employee ID', 'Name', 'Phone', 'Email', 'Role Profiles', 'Store Base', 'Monthly Salary (INR)', 'Joining Contract Date', 'Status'];
      rows = staff.map(s => [
        s.employeeId,
        s.name,
        s.mobile,
        s.email,
        s.role,
        getStoreLabel(s.storeId),
        String(s.salary),
        s.joiningDate,
        s.status
      ]);
    } 
    else if (activeReport === 'stocks') {
      headers = ['Product SKU', 'Product Name', 'Total Global Stock Available', 'Central Warehouse Qty', ...stores.map(st => st.storeCode)];
      rows = products.map(p => {
        const globalQty = p.warehouseQuantity + Object.values(p.storeQuantities || {}).reduce((a,b)=>a+b, 0);
        const storeCells = stores.map(st => String(p.storeQuantities?.[st.id] || 0));
        return [
          p.sku,
          p.productName,
          String(globalQty),
          String(p.warehouseQuantity),
          ...storeCells
        ];
      });
    } 
    else if (activeReport === 'profits') {
      // Calculate profit lines per sale
      headers = ['Bill Number', 'Date', 'Store Code', 'Invoice Value', 'Goods Cost Price', 'Net Profit Earned', 'Profit Margin %'];
      rows = filteredSales.map(s => {
        let goodsCostSum = 0;
        s.items.forEach(itm => {
          const prodObj = products.find(p => p.productId === itm.productId);
          goodsCostSum += (prodObj ? prodObj.purchasePrice : itm.price * 0.5) * itm.quantity;
        });
        const profit = s.totalAmount - goodsCostSum;
        const marginPct = s.totalAmount > 0 ? ((profit / s.totalAmount) * 100).toFixed(1) : '0';
        return [
          s.billNumber,
          new Date(s.date).toLocaleDateString(),
          getStoreLabel(s.storeId),
          String(s.totalAmount),
          String(goodsCostSum),
          String(profit),
          `${marginPct}%`
        ];
      });
    } 
    else if (activeReport === 'gst') {
      headers = ['Bill Number', 'GST Invoice Date', 'Store Point', 'Gross Value (Billed)', 'Assumed Taxable amount', 'Integrated Tax Amount (GST 18% equivalent)'];
      rows = filteredSales.map(s => [
        s.billNumber,
        new Date(s.date).toLocaleDateString(),
        getStoreLabel(s.storeId),
        String(s.totalAmount),
        String(Number((s.totalAmount / 1.18).toFixed(2))),
        String(s.taxAmount)
      ]);
    }

    // Compose CSV string lines
    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Browser anchor click trigger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Search Filters Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex flex-wrap gap-4 items-end justify-between">
        <div className="flex flex-wrap gap-3 flex-1">
          <div>
            <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" /> Filter Store Point
            </label>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="bg-slate-50 text-slate-800 text-xs py-1.5 px-2.5 rounded border border-slate-205 focus:outline-none focus:ring-1 focus:ring-slate-400 font-semibold cursor-pointer"
            >
              <option value="All">All Stores Combined</option>
              {stores.map(st => (
                <option key={st.id} value={st.id}>{st.storeName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" /> Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-slate-50 text-slate-850 text-xs py-1.2 px-2 border border-slate-205 rounded font-mono cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" /> Date To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-slate-50 text-slate-850 text-xs py-1.2 px-2 border border-slate-205 rounded font-mono cursor-pointer"
            />
          </div>
        </div>

        <div>
          <button
            id="csv-export-trigger"
            onClick={runCsvExport}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2 px-4 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export data to CSV
          </button>
        </div>
      </div>

      {/* Reports navigation selectors */}
      <div className="flex bg-slate-100 p-1 rounded-xl flex-wrap">
        {[
          { id: 'sales', label: 'Sales Summary' },
          { id: 'products', label: 'Item Catalog' },
          { id: 'staff', label: 'Payroll Ledger' },
          { id: 'stocks', label: 'Stock balance Sheets' },
          { id: 'profits', label: 'Profit & Loss (P&L)' },
          { id: 'gst', label: 'SGST/CGST tax ledger' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveReport(cat.id as any)}
            className={`text-xs font-bold px-4 py-2 rounded-lg transition-all ${
              activeReport === cat.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* RENDER TABLE OF SECTIONS */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden">
        {activeReport === 'sales' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] text-slate-500 uppercase bg-slate-50/50">
                  <th className="py-3 px-4">Bill Code</th>
                  <th className="py-3 px-4">Sales Date</th>
                  <th className="py-3 px-4">Store Point</th>
                  <th className="py-3 px-4">Materials list</th>
                  <th className="py-3 px-4">Payment mode</th>
                  <th className="py-3 px-4 text-right">Tax Base</th>
                  <th className="py-3 px-4 text-right">Billed Sum (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredSales.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-slate-400">No Sales matches the current filter settings.</td></tr>
                ) : (
                  filteredSales.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-400">{s.billNumber}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{new Date(s.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{getStoreLabel(s.storeId)}</td>
                      <td className="py-3 px-4 font-medium text-slate-600">
                        {s.items.map((it, idx) => (
                          <div key={idx}>• {it.productName} <span className="font-bold text-slate-800">x{it.quantity}</span></div>
                        ))}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-700 uppercase">{s.paymentMode}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">{formatCurrency(s.taxAmount)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">{formatCurrency(s.totalAmount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'products' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] text-slate-500 uppercase bg-slate-50/50">
                  <th className="py-3 px-4">Product SKU</th>
                  <th className="py-3 px-4">Garment name</th>
                  <th className="py-3 px-4">Brand</th>
                  <th className="py-3 px-4">G-Gender / Size</th>
                  <th className="py-3 px-4 text-right">Wholesale buy Price</th>
                  <th className="py-3 px-4 text-right">Consumer MRP</th>
                  <th className="py-3 px-4 text-center">Global Stocks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {products.map(p => {
                  const totalSt = p.warehouseQuantity + Object.values(p.storeQuantities || {}).reduce((a,b)=>a+b,0);
                  return (
                    <tr key={p.productId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-400 uppercase">{p.sku}</td>
                      <td className="py-3 px-4 font-bold text-slate-850">{p.productName}</td>
                      <td className="py-3 px-4 font-medium text-slate-600">{p.brand} ({p.category})</td>
                      <td className="py-3 px-4 text-slate-500">
                        SZ: <span className="font-bold text-slate-800">{p.size}</span> | {p.color}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">{formatCurrency(p.purchasePrice)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatCurrency(p.discountPrice)}</td>
                      <td className="py-3 px-4 text-center font-mono font-extrabold text-indigo-700 text-[13px]">{totalSt} units</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'staff' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] text-slate-500 uppercase bg-slate-50/50">
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Profile Role</th>
                  <th className="py-3 px-4">Active Allocation Location</th>
                  <th className="py-3 px-4">Mobile Contacts</th>
                  <th className="py-3 px-4 text-right">Fixed monthly Base Salary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {staff.map(s => (
                  <tr key={s.employeeId} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-400">{s.employeeId}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{s.name}</td>
                    <td className="py-3 px-4 font-semibold text-indigo-650">{s.role}</td>
                    <td className="py-3 px-4 font-medium text-slate-600">{getStoreLabel(s.storeId)}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{s.mobile}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatCurrency(s.salary)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'stocks' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] text-slate-500 uppercase bg-slate-50/50">
                  <th className="py-3 px-4">Product SKU</th>
                  <th className="py-3 px-4">Garment description</th>
                  <th className="py-3 px-4 text-center text-indigo-850 font-black">Sum Stock</th>
                  <th className="py-3 px-4 text-center bg-indigo-50/20 font-semibold">Warehouse</th>
                  {stores.map(st => (
                    <th key={st.id} className="py-3 px-4 text-center font-bold text-emerald-800">{st.storeCode.split('-')[1]}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {products.map(p => {
                  const globalQty = p.warehouseQuantity + Object.values(p.storeQuantities || {}).reduce((a, b) => a + b, 0);

                  return (
                    <tr key={p.productId} className="hover:bg-slate-55">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-550">{p.sku}</td>
                      <td className="py-3.5 px-4">
                        <span className="block font-bold text-slate-800">{p.productName}</span>
                        <span className="text-[10px] text-slate-400">Size: {p.size} | {p.color}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-black text-slate-900 text-sm">
                        {globalQty}
                      </td>
                      <td className="py-3.5 px-4 text-center bg-indigo-50/10 font-mono font-bold text-indigo-800">
                        {p.warehouseQuantity}
                      </td>
                      {stores.map(st => {
                        const qty = p.storeQuantities?.[st.id] || 0;
                        return (
                          <td 
                            key={st.id} 
                            className={`py-3.5 px-4 text-center font-mono font-bold ${
                              qty === 0 
                                ? 'bg-red-50 text-red-650' 
                                : qty < 5 
                                  ? 'bg-amber-50 text-amber-650' 
                                  : 'text-slate-700'
                            }`}
                          >
                            {qty}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'profits' && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-lg">
                <span className="block text-[11px] uppercase tracking-wide text-slate-400 font-bold">Accumulated Gross Revenue (INR)</span>
                <span className="text-2xl font-black text-slate-900 font-sans block mt-1">
                  {formatCurrency(filteredSales.reduce((a, b) => a + b.totalAmount, 0))}
                </span>
              </div>
              <div className="bg-emerald-50/40 p-4 border border-emerald-100 rounded-lg">
                <span className="block text-[11px] uppercase tracking-wide text-emerald-800 font-bold">Estimated Net profits</span>
                <span className="text-2xl font-black text-emerald-800 font-sans block mt-1">
                  {formatCurrency(filteredSales.reduce((sum, s) => {
                    let costSum = 0;
                    s.items.forEach(itm => {
                      const prod = products.find(p => p.productId === itm.productId);
                      costSum += (prod ? prod.purchasePrice : itm.price * 0.5) * itm.quantity;
                    });
                    return sum + (s.totalAmount - costSum);
                  }, 0))}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto border-t border-slate-100 pt-3">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] text-slate-550 uppercase bg-slate-50/50">
                    <th className="py-3 px-4">Bill Code</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Store Point</th>
                    <th className="py-3 px-4 text-right">Billed Invoiced Value</th>
                    <th className="py-3 px-4 text-right">Purchase Goods Cost</th>
                    <th className="py-3 px-4 text-right text-emerald-800 font-bold">Profit Earned</th>
                    <th className="py-3 px-4 text-right">Profit Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredSales.map(s => {
                    let costSum = 0;
                    s.items.forEach(itm => {
                      const prod = products.find(p => p.productId === itm.productId);
                      costSum += (prod ? prod.purchasePrice : itm.price * 0.5) * itm.quantity;
                    });
                    const profit = s.totalAmount - costSum;
                    const marginPct = s.totalAmount > 0 ? ((profit / s.totalAmount) * 100).toFixed(1) : '0';

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/10">
                        <td className="py-3 px-4 font-mono font-bold text-slate-400">{s.billNumber}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{new Date(s.date).toLocaleDateString()}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{getStoreLabel(s.storeId)}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">{formatCurrency(s.totalAmount)}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-400">{formatCurrency(costSum)}</td>
                        <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-700 text-[13px]">{formatCurrency(profit)}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">{marginPct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeReport === 'gst' && (
          <div className="p-4 space-y-4">
            <div className="bg-slate-50 p-4 border border-slate-100 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">CGST & SGST Integrated ledger</span>
                <p className="text-xs text-slate-550 mt-1 max-w-md">Calculated assuming a standard clothing retail tax aggregate of 18% GST (9% Central GST, 9% State GST).</p>
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Combined GST Liability</span>
                <span className="text-2xl font-black text-rose-650 font-sans block mt-1">
                  {formatCurrency(filteredSales.reduce((a, b) => a + b.taxAmount, 0))}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] text-slate-550 uppercase bg-slate-50/50">
                    <th className="py-3 px-4">Invoice Bill Reference</th>
                    <th className="py-3 px-4">Invoice Date</th>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4 text-right">Gross Value (M.R.P.)</th>
                    <th className="py-3 px-4 text-right">SGST (9%)</th>
                    <th className="py-3 px-4 text-right">CGST (9%)</th>
                    <th className="py-3 px-4 text-right text-rose-650 font-bold">Total GST Tax Liability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-mono">
                  {filteredSales.map(s => {
                    const sgst = s.taxAmount / 2;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/10">
                        <td className="py-3.5 px-4 font-bold text-slate-400">{s.billNumber}</td>
                        <td className="py-3.5 px-4 text-slate-550">{new Date(s.date).toLocaleDateString()}</td>
                        <td className="py-3.5 px-4 font-sans font-bold text-slate-800">{getStoreLabel(s.storeId)}</td>
                        <td className="py-3.5 px-4 text-right text-slate-650">{formatCurrency(s.totalAmount)}</td>
                        <td className="py-3.5 px-4 text-right text-slate-400">{formatCurrency(sgst)}</td>
                        <td className="py-3.5 px-4 text-right text-slate-400">{formatCurrency(sgst)}</td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-rose-700 text-[13px]">{formatCurrency(s.taxAmount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
