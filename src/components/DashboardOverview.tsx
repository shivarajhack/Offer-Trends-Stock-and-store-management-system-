/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  TrendingUp, 
  IndianRupee, 
  ShoppingCart, 
  Shirt, 
  AlertTriangle, 
  Plus, 
  AlertOctagon, 
  Bell, 
  ArrowRightLeft,
  ChevronsUp,
  ChevronsDown,
  Sparkles
} from 'lucide-react';
import { Store, Product, Sale, AlertNotification } from '../types.js';

interface DashboardOverviewProps {
  stores: Store[];
  products: Product[];
  sales: Sale[];
  notifications: AlertNotification[];
  onClearNotifications: () => void;
  setActiveTab: (tab: string) => void;
}

export default function DashboardOverview({
  stores,
  products,
  sales,
  notifications,
  onClearNotifications,
  setActiveTab
}: DashboardOverviewProps) {
  
  // Calculate analytics
  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.date.includes(today) || s.date.startsWith(today));
  
  const todayOrders = todaySales.length;
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);
  
  // Backwards calculation of profit: assuming 50% profit margin or let's calculate real (sellingPrice - purchasePrice) based on sale products!
  // To do a real calc:
  let todayProfit = 0;
  todaySales.forEach(sale => {
    sale.items.forEach(item => {
      const prod = products.find(p => p.productId === item.productId);
      if (prod) {
        const costPrice = prod.purchasePrice * item.quantity;
        const sellTotal = item.total;
        todayProfit += (sellTotal - costPrice);
      } else {
        // Fallback to average 40% margin
        todayProfit += item.total * 0.4;
      }
    });
  });

  // Global sales and profits
  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  let totalProfit = 0;
  sales.forEach(sale => {
    sale.items.forEach(item => {
      const prod = products.find(p => p.productId === item.productId);
      const cost = prod ? (prod.purchasePrice * item.quantity) : (item.total * 0.6);
      totalProfit += (item.total - cost);
    });
  });

  // Inventory logic
  const totalSkuCount = products.length;
  
  let lowStockProducts = 0;
  let outOfStockProducts = 0;

  products.forEach(p => {
    // Total stock is sum of warehouse AND stores
    const totalQty = p.warehouseQuantity + Object.values(p.storeQuantities).reduce((a, b) => a + b, 0);
    if (totalQty === 0) {
      outOfStockProducts++;
    } else if (totalQty <= 10) { // low stock is categorized as 10 or less globally or at stores
      lowStockProducts++;
    }
  });

  // Store performance rankings
  const storeSalesMap: Record<string, number> = {};
  stores.forEach(st => {
    storeSalesMap[st.id] = 0;
  });

  sales.forEach(s => {
    if (storeSalesMap[s.storeId] !== undefined) {
      storeSalesMap[s.storeId] += s.totalAmount;
    } else {
      storeSalesMap[s.storeId] = s.totalAmount;
    }
  });

  let sortedStoresArr = Object.entries(storeSalesMap).map(([id, amount]) => {
    const storeObj = stores.find(s => s.id === id);
    return {
      name: storeObj ? storeObj.storeName : id,
      city: storeObj ? storeObj.city : 'North Karnataka',
      amount
    };
  }).sort((a, b) => b.amount - a.amount);

  // Default fallback if no sales recorded yet
  if (sortedStoresArr.length === 0 && stores.length > 0) {
    sortedStoresArr = stores.map((s, idx) => ({
      name: s.storeName,
      city: s.city,
      amount: idx === 0 ? 5000 : idx === 1 ? 3000 : 0
    }));
  }

  const bestStore = sortedStoresArr[0] || { name: 'None Set', amount: 0 };
  const worstStore = sortedStoresArr.length > 1 ? sortedStoresArr[sortedStoresArr.length - 1] : { name: 'Dharwad Store', amount: 0 };

  const unreadAlerts = notifications.filter(n => !n.read);

  // Formatter helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header and Quick Navigation block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            Admin Overview Section
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Store Operations Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">Real-time omnichannel sales ledger, low-stock warnings, and retail reports.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            id="quick-billing-btn"
            onClick={() => setActiveTab('pos')}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 px-3.5 rounded-lg shadow-sm transition-all"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            POS Terminal Desktop
          </button>
          <button 
            id="quick-transfer-btn"
            onClick={() => setActiveTab('transfers')}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs py-2 px-3.5 rounded-lg shadow-sm transition-all"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Internal stock Transfer
          </button>
          <button 
            id="quick-product-btn"
            onClick={() => setActiveTab('products')}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs py-2 px-3.5 rounded-lg border border-slate-200 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New SKU
          </button>
        </div>
      </div>

      {/* Low Stock Alerts Banner (if any exists) */}
      {unreadAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700 shrink-0 mt-0.5">
              <AlertOctagon className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">Critical Stock Alert Warning</h4>
              <p className="text-xs text-amber-700 mt-0.5 font-medium">
                {unreadAlerts[0].message}
                {unreadAlerts.length > 1 && ` and ${unreadAlerts.length - 1} other critical warnings require stock replenishments.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('inventory')}
              className="text-xs font-bold text-amber-900 bg-amber-200/60 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors"
            >
              Restock Warehouse
            </button>
            <button 
              onClick={onClearNotifications}
              className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 underline"
            >
              Mark all read
            </button>
          </div>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Today's Stats Card */}
        <div id="stat-today-revenue" className="relative p-6 bg-white rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase font-bold tracking-wider text-slate-500">Today's Revenue</div>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl font-black text-slate-900 font-sans tracking-tight">
              {formatCurrency(todayRevenue)}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{todayOrders} billings made today</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-mono pt-3 border-t border-slate-50 flex items-center justify-between">
            <span>GST Estimated: {formatCurrency(todayRevenue * 0.18)}</span>
            <span className="text-emerald-600 font-semibold uppercase">LIVE SYNC</span>
          </div>
        </div>

        {/* Today's Profit Card */}
        <div id="stat-today-profit" className="relative p-6 bg-white rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase font-bold tracking-wider text-slate-500">Daily Earned Profit</div>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl font-black text-indigo-950 font-sans tracking-tight">
              {formatCurrency(todayProfit)}
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping"></div>
              <span>Net profit split 40-50% margins</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-mono pt-3 border-t border-slate-50 flex justify-between">
            <span>Overall Revenue ledger:</span>
            <span className="text-indigo-600 font-semibold">{formatCurrency(totalRevenue)}</span>
          </div>
        </div>

        {/* Global Stock Stats */}
        <div id="stat-stock-warnings" className="relative p-6 bg-white rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase font-bold tracking-wider text-slate-500">Inventory Monitor</div>
            <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
              <Shirt className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3 grid grid-cols-3 gap-1 divide-x divide-slate-100">
            <div className="pr-1 text-center">
              <span className="block text-2xl font-black text-slate-950 leading-none">{totalSkuCount}</span>
              <span className="text-[10px] text-slate-500 mt-1 block leading-tight font-medium">SKU Masters</span>
            </div>
            <div className="px-2 text-center">
              <span className={`block text-2xl font-black leading-none ${lowStockProducts > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{lowStockProducts}</span>
              <span className="text-[10px] text-slate-500 mt-1 block leading-tight font-medium">Low Stock</span>
            </div>
            <div className="pl-1 text-center font-semibold">
              <span className={`block text-2xl font-black leading-none ${outOfStockProducts > 0 ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>{outOfStockProducts}</span>
              <span className="text-[10px] text-slate-500 mt-1 block leading-tight font-medium">Out of Stock</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-mono pt-3 border-t border-slate-50 flex justify-between">
            <span>Warehouse + Multi-Store Sync</span>
            <button onClick={() => setActiveTab('products')} className="text-emerald-600 hover:underline">Inspect SKUs</button>
          </div>
        </div>
      </div>

      {/* Stores Performance & Localized Alert Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Performance Leaderboard */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Regional Store Performance Tracker</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Ranking offline stores based on combined net billing totals.</p>
            </div>
            <button 
              onClick={() => setActiveTab('reports')}
              className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded"
            >
              Full Ledger Reports
            </button>
          </div>

          <div className="space-y-4">
            {sortedStoresArr.map((st, idx) => (
              <div key={st.name} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-slate-400 font-semibold w-4">#{idx+1}</span>
                    <span className="font-bold text-slate-800">{st.name}</span>
                    <span className="text-[10px] bg-slate-100 px-1 rounded text-slate-500 font-medium">{st.city}</span>
                  </div>
                  <span className="font-bold text-slate-900">{formatCurrency(st.amount)}</span>
                </div>
                {/* Visual progression */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-indigo-400' : 'bg-slate-400'}`}
                    style={{ width: `${Math.max(5, (st.amount / (bestStore.amount || 10000)) * 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Highlights */}
          <div className="mt-5 grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
            <div className="flex items-center gap-2">
              <ChevronsUp className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Store Champion</span>
                <span className="text-xs font-black text-slate-950 truncate max-w-[150px] block">{bestStore.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ChevronsDown className="w-4 h-4 text-amber-500" />
              <div>
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">Underperforming store</span>
                <span className="text-xs font-black text-slate-950 truncate max-w-[150px] block">{worstStore.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Notification log */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">ERP Audit notifications</h3>
                <p className="text-[11px] text-slate-400">Inventory warnings, out-of-stock alarms, and API sync pings.</p>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 pl-1 p-0.5 rounded text-xs">
                <span className="text-xs p-1 font-mono font-bold bg-slate-800 text-white rounded scale-90">{notifications.length}</span>
                <span className="text-[10px] text-slate-500 px-1 font-semibold">Total alerts</span>
              </div>
            </div>

            <div className="space-y-2 max-h-[170px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-slate-300 font-medium text-xs">
                  <Bell className="w-8 h-8 mx-auto text-slate-200 mb-1.5" />
                  No issues flagged currently. System operating nominally!
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 transition-colors ${
                      notif.read ? 'bg-slate-50/70 border-slate-100 text-slate-500' : 'bg-amber-50/60 border-amber-100 text-slate-800 font-semibold'
                    }`}
                  >
                    <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${notif.read ? 'text-slate-400' : 'text-amber-600'}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[9px] uppercase font-bold tracking-wider px-1 rounded ${
                          notif.type === 'Out Of Stock' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {notif.type}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {new Date(notif.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed select-none">{notif.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-medium">Automatic threshold: &lt;= 5 units</span>
            {notifications.length > 0 && (
              <button 
                onClick={onClearNotifications}
                className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline"
              >
                Clear warnings
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
