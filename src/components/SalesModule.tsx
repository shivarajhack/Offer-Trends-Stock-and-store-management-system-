/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, Store, Staff, Sale, SalesItem } from '../types.js';
import { ShoppingCart, Search, Trash2, Plus, Minus, User, Printer, CheckCircle2, Ticket, CreditCard, Banknote, ShieldCheck } from 'lucide-react';

interface SalesModuleProps {
  products: Product[];
  stores: Store[];
  staff: Staff[];
  sales: Sale[];
  onAddSale: (saleData: {
    storeId: string;
    staffId: string;
    items: { productId: string; quantity: number }[];
    paymentMode: 'Cash' | 'Card' | 'UPI';
  }) => Promise<boolean>;
}

export default function SalesModule({
  products,
  stores,
  staff,
  sales,
  onAddSale
}: SalesModuleProps) {
  // POS active setup states
  const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id || 'store-hubli');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  
  // Basket states
  const [cart, setCart] = useState<Omit<SalesItem, 'productName' | 'total'>[]>([]);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Card' | 'UPI'>('UPI');
  
  // Scanner simulator states
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [invoicePreview, setInvoicePreview] = useState<Sale | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cashiers filter matching active store
  const filteredCashiers = staff.filter(s => s.storeId === selectedStoreId && (s.role === 'Cashier' || s.role === 'Manager' || s.role === 'Super Admin'));

  // Quick scanner simulate helper
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!barcodeQuery) return;

    const matchedProduct = products.find(p => p.barcode === barcodeQuery || p.sku.toUpperCase() === barcodeQuery.toUpperCase());
    if (!matchedProduct) {
      setError(`No catalog matched with Barcode or SKU "${barcodeQuery}".`);
      return;
    }

    addToCart(matchedProduct.productId);
    setBarcodeQuery('');
  };

  const addToCart = (productId: string) => {
    setError('');
    const product = products.find(p => p.productId === productId);
    if (!product) return;

    // Check branch stock limit
    const inStoreStock = product.storeQuantities[selectedStoreId] || 0;
    const existingInCart = cart.find(item => item.productId === productId);
    const existingQty = existingInCart ? existingInCart.quantity : 0;

    if (inStoreStock <= existingQty) {
      setError(`Cannot add ${product.productName}. Insufficient stock in this branch (Available: ${inStoreStock} units).`);
      return;
    }

    if (existingInCart) {
      setCart(cart.map(item => 
        item.productId === productId 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      const priceVal = product.discountPrice || product.sellingPrice;
      setCart([...cart, { productId, quantity: 1, price: priceVal }]);
    }
  };

  const updateCartQty = (productId: string, delta: number) => {
    setError('');
    const product = products.find(p => p.productId === productId);
    if (!product) return;

    const inStoreStock = product.storeQuantities[selectedStoreId] || 0;
    const item = cart.find(i => i.productId === productId);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQty > inStoreStock) {
      setError(`Cannot allocate ${newQty} units. Maximum stock available in this branch is ${inStoreStock}.`);
      return;
    }

    setCart(cart.map(i => i.productId === productId ? { ...i, quantity: newQty } : i));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setError('');
  };

  // Pricing calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.18; // GST included estimate
  const grandTotal = subtotal; // subtotal includes standard retail discount taxes

  const handleCheckout = async () => {
    setError('');
    setSuccess('');

    if (cart.length === 0) {
      setError('Your POS basket is empty.');
      return;
    }

    const cashierId = selectedStaffId || filteredCashiers[0]?.employeeId || staff[0]?.employeeId || 'OT-EM-104';

    setLoading(true);
    try {
      const payloadItems = cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }));

      const ok = await onAddSale({
        storeId: selectedStoreId,
        staffId: cashierId,
        items: payloadItems,
        paymentMode
      });

      if (ok) {
        setSuccess('Transaction compiled successfully! Stock subtracted from branch database.');
        
        // Form a mock invoice review locally to display as printed slip receipt
        const newlyBilledRef = 'BILL-OT-' + (1000 + sales.length + 1);
        const billSummary: Sale = {
          id: 'sale-' + Date.now(),
          billNumber: newlyBilledRef,
          date: new Date().toISOString(),
          storeId: selectedStoreId,
          staffId: cashierId,
          items: cart.map(item => {
            const p = products.find(pr => pr.productId === item.productId);
            return {
              productId: item.productId,
              productName: p ? p.productName : 'Clothing Item',
              quantity: item.quantity,
              price: item.price,
              total: item.price * item.quantity
            };
          }),
          paymentMode,
          totalAmount: subtotal,
          taxAmount: Number(tax.toFixed(2))
        };

        setInvoicePreview(billSummary);
        clearCart();
      } else {
        setError('Checkout operation failed. Check store stock levels or cashier details.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error occurred during offline billing checkout');
    } finally {
      setLoading(false);
    }
  };

  const getProductDetails = (id: string) => {
    return products.find(p => p.productId === id);
  };

  const getStoreName = (id: string) => {
    return stores.find(s => s.id === id)?.storeName || id;
  };

  const getStaffName = (id: string) => {
    return staff.find(s => s.employeeId === id)?.name || id;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* LEFT: POS Catalog Selection (Cols 7) */}
      <div className="xl:col-span-7 space-y-6">
        {/* Branch / Cashier Select */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Billing Store terminal</label>
            <select
              id="pos-store-select"
              value={selectedStoreId}
              onChange={(e) => {
                setSelectedStoreId(e.target.value);
                clearCart();
              }}
              className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-205 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold cursor-pointer"
            >
              {stores.map(st => (
                <option key={st.id} value={st.id}>{st.storeName} ({st.storeCode})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Cashier Associate</label>
            <select
              id="pos-cashier-select"
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-205 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold cursor-pointer"
            >
              <option value="">-- Choose Operator --</option>
              {filteredCashiers.map(sf => (
                <option key={sf.employeeId} value={sf.employeeId}>{sf.name} ({sf.role})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Laser Scanner Simulator */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs">
          <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="pos-laser-scan-input"
                type="text"
                placeholder="Simulate barcode gun scanner: enter 100101, 200201 or SKU and hit search..."
                value={barcodeQuery}
                aria-label="Laser scale barcode query"
                onChange={(e) => setBarcodeQuery(e.target.value)}
                className="w-full bg-slate-50 text-slate-850 text-xs py-2.5 pl-9 pr-3 rounded-lg border border-slate-205 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium font-mono"
              />
              <ShoppingCart className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
            </div>
            <button
              id="simulate-scan-btn"
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
            >
              Simulate Scan
            </button>
          </form>
        </div>

        {/* Quick Click Item Catalog Grid */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-650">Quick-add POS Items</h3>
            <span className="text-[11px] text-slate-400">Available at this store branch</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {products.map(p => {
              const stock = p.storeQuantities[selectedStoreId] || 0;
              const isOut = stock === 0;

              return (
                <button
                  id={`pos-quick-add-${p.productId}`}
                  key={p.productId}
                  disabled={isOut}
                  onClick={() => addToCart(p.productId)}
                  className={`text-left p-3 rounded-lg border transition-all flex flex-col justify-between h-28 relative ${
                    isOut 
                      ? 'bg-slate-50 border-slate-100 cursor-not-allowed opacity-50' 
                      : 'bg-white border-slate-150 hover:border-emerald-500 hover:shadow-xs cursor-pointer'
                  }`}
                >
                  <div>
                    <span className="font-bold text-slate-850 text-xs block truncate leading-snug">{p.productName}</span>
                    <span className="text-[9px] text-slate-450 block font-mono mt-0.5">{p.sku} | Size: {p.size}</span>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p.discountPrice)}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      isOut 
                        ? 'bg-red-50 text-red-650' 
                        : stock < 5 
                          ? 'bg-amber-50 text-amber-650 animate-pulse' 
                          : 'bg-emerald-50 text-emerald-800'
                    }`}>
                      {isOut ? 'Out' : `Stock: ${stock}`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT: Active Cart Billing & Checkout (Cols 5) */}
      <div className="xl:col-span-5 space-y-6">
        <div className="bg-white rounded-xl border border-slate-205 p-5 shadow-md flex flex-col h-[520px] justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-1.5 font-black text-slate-900 text-xs uppercase tracking-wider">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                Billing cart Basket
              </div>
              {cart.length > 0 && (
                <button 
                  onClick={clearCart}
                  className="text-[10px] text-red-550 font-bold hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Clear basket
                </button>
              )}
            </div>

            {error && (
              <div className="p-2.5 bg-red-50 border border-red-100 text-red-700 font-semibold text-xs rounded-lg mb-3">
                {error}
              </div>
            )}
            {success && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-805 font-semibold text-xs rounded-lg mb-3">
                {success}
              </div>
            )}

            {/* Cart Elements scroll */}
            <div className="space-y-2.5 overflow-y-auto max-h-[240px] pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-20 text-slate-350 text-xs font-semibold">
                  <Ticket className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  Your basket is empty. Select garments on the left or scan barcodes.
                </div>
              ) : (
                cart.map(item => {
                  const details = getProductDetails(item.productId);
                  if (!details) return null;

                  return (
                    <div key={item.productId} className="flex items-center justify-between p-2 rounded-lg bg-slate-50/50 border border-slate-100">
                      <div className="flex-1 min-w-0 pr-2">
                        <span className="font-bold text-slate-800 text-[11px] block truncate leading-tight">{details.productName}</span>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          {details.sku} • {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.price)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Quantity controls */}
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
                          <button 
                            onClick={() => updateCartQty(item.productId, -1)}
                            className="p-1 hover:bg-slate-50 rounded text-slate-500"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono text-xs font-bold text-slate-800 w-6 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateCartQty(item.productId, 1)}
                            className="p-1 hover:bg-slate-50 rounded text-slate-500"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        
                        <span className="font-mono text-xs font-black text-slate-900 w-16 text-right">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Cart Pricing total & Pay mode */}
          <div className="border-t border-slate-105 pt-3.5 space-y-4">
            <div className="space-y-1.5 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Core Subtotal (Incl SGST & CGST):</span>
                <span className="font-mono text-slate-700">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(subtotal - tax)}</span>
              </div>
              <div className="flex justify-between">
                <span>Integrated T-Taxes (GST 18% equivalent):</span>
                <span className="font-mono text-slate-700">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(tax)}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-2 border-t border-dashed border-slate-200">
                <span>Bill Total Amount:</span>
                <span className="font-mono text-emerald-600">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(grandTotal)}</span>
              </div>
            </div>

            {/* Payment Mode Selector tabs */}
            <div>
              <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">M-Payment mode</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentMode('UPI')}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                    paymentMode === 'UPI' 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-450 shadow-xs' 
                      : 'bg-white text-slate-500 border-slate-200 hover:text-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> UPI Apps
                </button>
                <button
                  onClick={() => setPaymentMode('Cash')}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                    paymentMode === 'Cash' 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                      : 'bg-white text-slate-500 border-slate-200 hover:text-slate-700'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" /> Cash Desk
                </button>
                <button
                  onClick={() => setPaymentMode('Card')}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                    paymentMode === 'Card' 
                      ? 'bg-indigo-50 text-indigo-850 border-indigo-400 shadow-xs' 
                      : 'bg-white text-slate-500 border-slate-200 hover:text-slate-700'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" /> Visa Card
                </button>
              </div>
            </div>

            {/* Process checkout CTA */}
            <button
              id="pos-checkout-btn"
              onClick={handleCheckout}
              disabled={loading || cart.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShieldCheck className="w-4 h-4" />
              {loading ? 'Processing bill...' : `Process Offline Billing Receipt (${cart.length} items)`}
            </button>
          </div>
        </div>
      </div>

      {/* Invoice pre-print dialog overlay */}
      {invoicePreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 border border-slate-205 max-w-lg w-full relative max-h-[90vh] overflow-y-auto select-none font-sans">
            <button 
              onClick={() => setInvoicePreview(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650"
            >
              Cancel Preview
            </button>

            {/* Simulated Receipt design */}
            <div id="invoice-sheet" className="space-y-4 p-2 font-mono text-xs text-slate-800">
              <div className="text-center border-b border-dashed border-slate-300 pb-4">
                <h1 className="text-sm font-black tracking-tight text-slate-900">OFFER TRENDS RETAILS</h1>
                <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">Quality garments at affordable pricing</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{getStoreName(invoicePreview.storeId)}</p>
                <p className="text-[9px] text-slate-400 mt-1 font-mono uppercase font-bold">GSTIN: 29AAAAA0000A1Z1</p>
              </div>

              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>Bill Number:</span>
                  <span className="font-bold">{invoicePreview.billNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date & Time:</span>
                  <span>{new Date(invoicePreview.date).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier ID:</span>
                  <span>{invoicePreview.staffId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pay Mode:</span>
                  <span className="font-bold uppercase">{invoicePreview.paymentMode}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="border-t border-b border-dashed border-slate-300 py-3.5 space-y-2">
                <div className="grid grid-cols-12 font-bold text-[10px]">
                  <span className="col-span-6">Item description</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-4 text-right">Price</span>
                </div>
                {invoicePreview.items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 text-[10px]">
                    <span className="col-span-6 truncate">{it.productName}</span>
                    <span className="col-span-2 text-center font-bold">x{it.quantity}</span>
                    <span className="col-span-4 text-right font-mono">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(it.total)}</span>
                  </div>
                ))}
              </div>

              {/* Cost breakages */}
              <div className="space-y-1 text-right text-[10px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(invoicePreview.totalAmount - invoicePreview.taxAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CGST 9% & SGST 9%:</span>
                  <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(invoicePreview.taxAmount)}</span>
                </div>
                <div className="flex justify-between font-black text-slate-900 border-t border-dashed border-slate-300 pt-2 text-xs">
                  <span>GRAND TOTAL AMOUNT:</span>
                  <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(invoicePreview.totalAmount)}</span>
                </div>
              </div>

              <div className="text-center pt-4 border-t border-dashed border-slate-300">
                <p className="text-[9px] text-slate-400 font-bold">Thank you for shopping at Offer Trends!</p>
                <p className="text-[9px] text-slate-400 font-bold mt-0.5">Contact: 9845210021</p>
              </div>
            </div>

            <button 
              onClick={() => {
                window.print();
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 mt-5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Invoice Slip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
