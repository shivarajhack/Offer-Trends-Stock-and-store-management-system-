/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Role, 
  Store, 
  Staff, 
  Product, 
  StockIn, 
  StockTransfer, 
  Supplier, 
  PurchaseOrder, 
  Sale, 
  AlertNotification, 
  WebsiteOrder, 
  AuditLog 
} from './types.js';

import Sidebar from './components/Sidebar';
import DashboardOverview from './components/DashboardOverview';
import StoreModule from './components/StoreModule';
import StaffModule from './components/StaffModule';
import ProductModule from './components/ProductModule';
import InventoryModule from './components/InventoryModule';
import TransferModule from './components/TransferModule';
import SalesModule from './components/SalesModule';
import PurchaseModule from './components/PurchaseModule';
import ReportsModule from './components/ReportsModule';
import WebsiteSync from './components/WebsiteSync';

import { Bell, RefreshCw, AlertTriangle, ShieldAlert, Menu } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role>('Super Admin');

  // Database State managed locally in sync with Full-Stack Express Server
  const [stores, setStores] = useState<Store[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stockIns, setStockIns] = useState<StockIn[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [websiteOrders, setWebsiteOrders] = useState<WebsiteOrder[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorHeader, setErrorHeader] = useState('');

  // Fetch central database on component load
  const loadDatabase = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setErrorHeader('');

    try {
      const resp = await fetch('/api/data');
      if (resp.ok) {
        const db = await resp.json();
        setStores(db.stores || []);
        setStaff(db.staff || []);
        setProducts(db.products || []);
        setSuppliers(db.suppliers || []);
        setStockIns(db.stockIns || []);
        setTransfers(db.transfers || []);
        setSales(db.sales || []);
        setPurchaseOrders(db.purchaseOrders || []);
        setNotifications(db.notifications || []);
        setWebsiteOrders(db.websiteOrders || []);
        setAuditLogs(db.auditLogs || []);
      } else {
        setErrorHeader(`API Connection refused (Status ${resp.status}). Server might be starting...`);
      }
    } catch (err: any) {
      setErrorHeader('Failed to establish connection with ERP Express API backend.');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDatabase();
  }, []);

  // Endpoint API submission helpers wrapper
  const handlePostRequest = async (endpoint: string, payload: any) => {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const updatedDb = await response.json();
        // Fully reload states in sync
        setStores(updatedDb.stores || []);
        setStaff(updatedDb.staff || []);
        setProducts(updatedDb.products || []);
        setSuppliers(updatedDb.suppliers || []);
        setStockIns(updatedDb.stockIns || []);
        setTransfers(updatedDb.transfers || []);
        setSales(updatedDb.sales || []);
        setPurchaseOrders(updatedDb.purchaseOrders || []);
        setNotifications(updatedDb.notifications || []);
        setWebsiteOrders(updatedDb.websiteOrders || []);
        setAuditLogs(updatedDb.auditLogs || []);
        return true;
      }
    } catch (err) {
      console.error(`Error requesting ${endpoint}:`, err);
    }
    return false;
  };

  const handleAddStore = async (storeData: Omit<Store, 'id'>) => {
    return handlePostRequest('/api/stores', storeData);
  };

  const handleAddStaff = async (staffData: Staff) => {
    return handlePostRequest('/api/staff', staffData);
  };

  const handleAddProduct = async (productData: Omit<Product, 'productId'>) => {
    return handlePostRequest('/api/products', productData);
  };

  const handleStockIn = async (stockInValues: Omit<StockIn, 'id'>) => {
    return handlePostRequest('/api/stock-in', stockInValues);
  };

  const handleTransfer = async (transferValues: Omit<StockTransfer, 'id' | 'status' | 'date'>) => {
    return handlePostRequest('/api/transfers', transferValues);
  };

  const handleAddSale = async (invoiceData: {
    storeId: string;
    staffId: string;
    items: { productId: string; quantity: number }[];
    paymentMode: 'Cash' | 'Card' | 'UPI';
  }) => {
    return handlePostRequest('/api/sales', invoiceData);
  };

  const handleAddSupplier = async (supplierValues: Omit<Supplier, 'id'>) => {
    return handlePostRequest('/api/suppliers', supplierValues);
  };

  const handleCreatePO = async (supplierId: string, itemsList: { productId: string; quantity: number; purchasePrice: number }[]) => {
    return handlePostRequest('/api/po', { supplierId, items: itemsList });
  };

  const handlePOStatusUpdate = async (poId: string, statusVal: 'Approved' | 'Received') => {
    return handlePostRequest('/api/po/status', { poId, status: statusVal });
  };

  const handleWebOrderSimulate = async (orderData: { customerName: string; customerEmail: string; items: { productId: string; quantity: number }[] }) => {
    try {
      const resp = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (resp.ok) {
        // Trigger silent database reload to receive updated warehouse count
        loadDatabase(true);
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  const handleClearNotifications = async () => {
    try {
      const resp = await fetch('/api/notifications/read-all', { method: 'POST' });
      if (resp.ok) {
        loadDatabase(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Safe Store ID to name mapping
  const getSimulatedStaffStore = () => {
    if (currentRole === 'Super Admin' || currentRole === 'Warehouse Staff') return 'Central Warehouse HQ';
    const foundStaff = staff.find(s => s.role === currentRole && s.status === 'Active');
    if (foundStaff) {
      const storeObj = stores.find(st => st.id === foundStaff.storeId);
      return storeObj ? storeObj.storeName : 'Offer Trends Hubli';
    }
    return stores[0] ? stores[0].storeName : 'Offer Trends Hubli';
  };

  const activeAlertCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden relative">
      
      {/* Backdrop overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={currentRole}
        setCurrentRole={(r) => {
          setCurrentRole(r);
          // Auto route to a permitting tab
          if (r === 'Cashier' && ['stores', 'staff', 'inventory', 'transfers', 'purchase', 'reports'].includes(activeTab)) {
            setActiveTab('pos');
          } else if (r === 'Warehouse Staff' && ['stores', 'staff', 'pos', 'reports'].includes(activeTab)) {
            setActiveTab('dashboard');
          }
        }}
        storeName={getSimulatedStaffStore()}
        alertCount={activeAlertCount}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Container Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Top Operational Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 shrink-0 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
              aria-label="Open navigation sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-[11px] sm:text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 sm:px-2.5 py-1 rounded-md font-bold font-mono uppercase tracking-wider flex items-center gap-1 leading-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="hidden sm:inline">Impersonated </span>Role: {currentRole}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Sync Ticker */}
            <button
              onClick={() => loadDatabase(true)}
              disabled={refreshing}
              className="p-1 px-2 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-800 text-xs flex items-center gap-1 font-semibold transition-colors shrink-0 disabled:opacity-40"
              title="Refresh database state"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
              <span className="font-mono text-[10px] uppercase font-bold text-slate-400">Database Sync</span>
            </button>

            {/* Quick alert badge */}
            <div className="relative">
              <div className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer" onClick={() => setActiveTab('dashboard')}>
                <Bell className="w-4 h-4" />
                {activeAlertCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white"></span>
                )}
              </div>
            </div>

            <div className="h-4 w-[1px] bg-slate-200" />

            <div className="flex items-center gap-2.5 select-none">
              <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center font-bold text-slate-50 text-xs">
                {currentRole.split(' ').map(token => token[0]).join('')}
              </div>
              <div className="hidden sm:block text-left">
                <span className="block text-xs font-bold text-slate-900 leading-tight">Offer Trends Admin</span>
                <span className="text-[10px] text-zinc-450 leading-none">Owner/Region Lead</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic tabs render workspace */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          
          {errorHeader && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-750 text-xs font-bold rounded-xl flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-650 shrink-0" />
              <span>{errorHeader}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-20 select-none">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
              <span className="text-xs font-bold text-slate-550 uppercase font-mono tracking-widest">Constructing ERP workspace...</span>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto">
              {activeTab === 'dashboard' && (
                <DashboardOverview
                  stores={stores}
                  products={products}
                  sales={sales}
                  notifications={notifications}
                  onClearNotifications={handleClearNotifications}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === 'stores' && (
                <StoreModule 
                  stores={stores} 
                  onAddStore={handleAddStore} 
                />
              )}

              {activeTab === 'staff' && (
                <StaffModule 
                  staff={staff} 
                  stores={stores} 
                  onAddStaff={handleAddStaff} 
                />
              )}

              {activeTab === 'products' && (
                <ProductModule
                  products={products}
                  stores={stores}
                  onAddProduct={handleAddProduct}
                />
              )}

              {activeTab === 'pos' && (
                <SalesModule
                  products={products}
                  stores={stores}
                  staff={staff}
                  sales={sales}
                  onAddSale={handleAddSale}
                />
              )}

              {activeTab === 'inventory' && (
                <InventoryModule
                  products={products}
                  suppliers={suppliers}
                  stockIns={stockIns}
                  stores={stores}
                  onStockIn={handleStockIn}
                />
              )}

              {activeTab === 'transfers' && (
                <TransferModule
                  products={products}
                  stores={stores}
                  transfers={transfers}
                  onTransfer={handleTransfer}
                />
              )}

              {activeTab === 'purchase' && (
                <PurchaseModule
                  products={products}
                  suppliers={suppliers}
                  purchaseOrders={purchaseOrders}
                  onAddSupplier={handleAddSupplier}
                  onCreatePO={handleCreatePO}
                  onPOStatusChange={handlePOStatusUpdate}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsModule
                  products={products}
                  stores={stores}
                  staff={staff}
                  sales={sales}
                  stockIns={stockIns}
                  transfers={transfers}
                />
              )}

              {activeTab === 'sync' && (
                <WebsiteSync
                  products={products}
                  websiteOrders={websiteOrders}
                  onSubmitWebOrder={handleWebOrderSimulate}
                />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
