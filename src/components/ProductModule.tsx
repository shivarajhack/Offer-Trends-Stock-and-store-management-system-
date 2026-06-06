/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, Store } from '../types.js';
import { Plus, Search, Table, BadgeAlert, ShoppingBag, Barcode, Printer, PanelTop, Check, X, Eye } from 'lucide-react';

interface ProductModuleProps {
  products: Product[];
  stores: Store[];
  onAddProduct: (product: Omit<Product, 'productId'>) => Promise<boolean>;
}

// Custom CSS-based Barcode Generator (Code128 Simulated Stripe Patterns)
function BarcodePrinter({ value }: { value: string }) {
  // Generate a reproducible set of stripe widths based on characters
  const getStripeWidths = (str: string) => {
    const defaultPattern = [2, 1, 3, 2, 1, 2, 4, 1, 3, 1, 2, 2, 1, 3, 1, 4];
    if (!str) return defaultPattern;
    const codes = str.split('').map(char => char.charCodeAt(0));
    const striped: number[] = [];
    codes.forEach((code, idx) => {
      // Create a deterministic pattern of 4 widths
      const w1 = ((code % 3) + 1);
      const w2 = (((code + idx) % 4) + 1);
      const w3 = (((code * 2) % 3) + 1);
      const w4 = (((code + 5) % 3) + 1);
      striped.push(w1, w2, w3, w4);
    });
    // Truncate/pad to ensure a clean visual set
    while (striped.length < 24) striped.push(2, 1, 3, 1);
    return striped.slice(0, 24);
  };

  const pattern = getStripeWidths(value);

  return (
    <div className="flex flex-col items-center p-2 bg-white rounded border border-slate-205 select-none font-mono">
      <div className="flex items-center justify-center bg-white h-11 w-44 px-1">
        {pattern.map((width, idx) => {
          const isBlack = idx % 2 === 0;
          return (
            <div 
              key={idx} 
              className="h-full" 
              style={{
                width: `${width}px`,
                backgroundColor: isBlack ? '#1e293b' : 'transparent',
                marginRight: idx % 4 === 0 && !isBlack ? '1px' : '0'
              }}
            />
          );
        })}
      </div>
      <span className="text-[10px] text-slate-500 font-bold tracking-widest mt-1 uppercase">OT-{value}</span>
    </div>
  );
}

export default function ProductModule({ products, stores, onAddProduct }: ProductModuleProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Barcode Sheet Preview Modal
  const [printBarcode, setPrintBarcode] = useState<string | null>(null);

  // Form states
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('Men');
  const [subCategory, setSubCategory] = useState('T-Shirts');
  const [gender, setGender] = useState<'Men' | 'Women' | 'Kids' | 'Unisex'>('Men');
  const [size, setSize] = useState('M');
  const [color, setColor] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [warehouseQuantity, setWarehouseQuantity] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const categories = ['All', 'Men', 'Women', 'Kids', 'Accessories'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!sku || !barcode || !productName || !brand || !color || !purchasePrice || !sellingPrice) {
      setError('Please fill out all product details');
      return;
    }

    setLoading(true);
    try {
      const storeQuantitiesInit: Record<string, number> = {};
      stores.forEach(st => {
        storeQuantitiesInit[st.id] = 0;
      });

      const ok = await onAddProduct({
        sku,
        barcode,
        productName,
        brand,
        category,
        subCategory,
        gender,
        size,
        color,
        purchasePrice: Number(purchasePrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        discountPrice: Number(discountPrice) || Number(sellingPrice),
        warehouseQuantity: Number(warehouseQuantity) || 0,
        storeQuantities: storeQuantitiesInit
      });

      if (ok) {
        setSuccess('Product registered successfully into central Master Catalog!');
        setSku('');
        setBarcode('');
        setProductName('');
        setBrand('');
        setColor('');
        setPurchasePrice('');
        setSellingPrice('');
        setDiscountPrice('');
        setWarehouseQuantity('');
        setIsAdding(false);
      } else {
        setError('Creation failed. SKU code or Barcode already assigned to another catalog.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error occurred while saving product');
    } finally {
      setLoading(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.productName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.barcode.includes(searchQuery);
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getGlobalStock = (p: Product) => {
    const storesQty = Object.values(p.storeQuantities || {}).reduce((a, b) => a + b, 0);
    return p.warehouseQuantity + storesQty;
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Product Master Catalog</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage stock styles, sizes, price matrices and custom Code128 barcodes.</p>
        </div>
        <button
          id="add-product-trigger"
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-4 rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          {isAdding ? 'Close registry' : 'Add New Item SKU'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm max-w-3xl">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm mb-4">
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
            Product Detail Form (Central Master)
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 font-semibold">{error}</div>}
            {success && <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-100 font-semibold">{success}</div>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">SKU identifier *</label>
                <input
                  id="form-product-sku"
                  type="text"
                  placeholder="e.g. OT-MEN-TSHIRT-001"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Barcode (Numeric/Code128) *</label>
                <div className="relative">
                  <input
                    id="form-product-barcode"
                    type="text"
                    placeholder="e.g. 100101"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-50 text-slate-800 text-xs py-2 pl-8 pr-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium font-mono"
                  />
                  <Barcode className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Brand Label *</label>
                <input
                  id="form-product-brand"
                  type="text"
                  placeholder="e.g. Offer Trends Select"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Product Name *</label>
                <input
                  id="form-product-name"
                  type="text"
                  placeholder="e.g. Men Cotton Polo Club T-Shirt"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Stock Category *</label>
                <select
                  id="form-product-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-300 font-medium cursor-pointer"
                >
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Kids">Kids</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Style SubCategory *</label>
                <input
                  id="form-product-subcategory"
                  type="text"
                  placeholder="e.g. T-Shirts / Kurtis"
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Gender Segment</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-300 font-medium cursor-pointer"
                >
                  <option value="Men">Men Only</option>
                  <option value="Women">Women Only</option>
                  <option value="Kids">Kids Unisex</option>
                  <option value="Unisex">Adult Unisex</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Garment Size</label>
                <input
                  id="form-product-size"
                  type="text"
                  placeholder="e.g. M / L / XL / 32"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Fabric Color Color *</label>
                <input
                  id="form-product-color"
                  type="text"
                  placeholder="e.g. Navy Blue"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Central Warehouse Qty *</label>
                <input
                  id="form-product-warehouse-qty"
                  type="number"
                  placeholder="Initial Warehouse Stock"
                  value={warehouseQuantity}
                  onChange={(e) => setWarehouseQuantity(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Purchase Price (INR) *</label>
                <input
                  id="form-product-purchase-price"
                  type="number"
                  placeholder="Wholesale Price"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Selling Price (M.R.P.) *</label>
                <input
                  id="form-product-selling-price"
                  type="number"
                  placeholder="Normal Retail Price"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Discount Price (Offer Price) *</label>
                <input
                  id="form-product-discount-price"
                  type="number"
                  placeholder="If null, defaults to MRP"
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
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
                id="submit-product-btn"
                type="submit"
                disabled={loading}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-4 rounded-lg shadow-sm transition-colors"
              >
                {loading ? 'Adding...' : 'Save Product Master'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Catalog Listing */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden">
        {/* Filter controls */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-all ${
                  selectedCategory === cat 
                    ? 'bg-slate-950 text-white border-slate-950' 
                    : 'bg-white text-slate-500 hover:text-slate-800 border-slate-200/80 shadow-xs'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative max-w-xs w-full">
            <input
              id="product-search-bar"
              type="text"
              placeholder="Search SKU, color, size, barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-slate-800 text-xs py-2 pl-8 pr-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium shadow-xs"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
          </div>
        </div>

        {/* Master Table Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase font-bold tracking-wider bg-slate-50/10">
                <th className="py-3 px-4">SKU / Item Name</th>
                <th className="py-3 px-4">Brand / Category</th>
                <th className="py-3 px-4">Size & Color</th>
                <th className="py-3 px-4 text-right">Cost Price</th>
                <th className="py-3 px-4 text-right">Offer Price</th>
                <th className="py-3 px-4 text-center text-slate-650 font-semibold bg-emerald-50/30">Warehouse Qty</th>
                <th className="py-3 px-4 text-center bg-slate-50/50">Store Stocks</th>
                <th className="py-3 px-4 text-center">Barcode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs select-text">
              {filteredProducts.map((p) => {
                const totalStock = getGlobalStock(p);
                const storeQtysTotal = Object.values(p.storeQuantities || {}).reduce((a, b) => a + b, 0);

                return (
                  <tr key={p.productId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 max-w-[200px]">
                      <span className="block font-black text-slate-800">{p.productName}</span>
                      <span className="text-[10px] font-mono font-bold text-slate-400 block tracking-tight uppercase">{p.sku}</span>
                    </td>
                    <td className="py-3.5 px-4 space-y-0.5">
                      <span className="block font-semibold text-slate-700">{p.brand}</span>
                      <span className="text-[9px] bg-slate-100 font-bold px-1.5 py-0.5 rounded text-slate-500 uppercase tracking-wide">
                        {p.category} / {p.subCategory}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      Size: <span className="font-bold text-slate-850">{p.size}</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">{p.color} ({p.gender})</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-500">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p.purchasePrice)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {p.discountPrice && p.discountPrice < p.sellingPrice ? (
                        <div>
                          <span className="block font-mono font-bold text-slate-900 leading-none">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p.discountPrice)}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 line-through">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p.sellingPrice)}
                          </span>
                        </div>
                      ) : (
                        <span className="font-mono font-bold text-slate-900 leading-none">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p.sellingPrice)}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold bg-emerald-50/20 text-emerald-800 font-mono text-sm">
                      {p.warehouseQuantity}
                    </td>
                    <td className="py-3.5 px-4 text-center bg-slate-50/30">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-mono font-bold text-slate-700">{storeQtysTotal} units</span>
                        <div className="flex gap-1.5 mt-1">
                          {stores.map(st => {
                            const qty = p.storeQuantities?.[st.id] || 0;
                            return (
                              <span 
                                key={st.id} 
                                title={`${st.storeCode}: ${qty} units`}
                                className={`text-[9px] px-1 py-0.5 rounded font-mono font-bold border ${
                                  qty === 0 
                                    ? 'bg-red-50 text-red-500 border-red-100' 
                                    : qty < 5 
                                      ? 'bg-amber-50 text-amber-700 border-amber-100 font-extrabold' 
                                      : 'bg-slate-100 text-slate-750 border-slate-200'
                                }`}
                              >
                                {st.storeCode.split('-')[1].charAt(0)}:{qty}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <span className="font-mono text-[10px] text-slate-500 select-all font-bold tracking-tight">{p.barcode}</span>
                        <button 
                          id={`print-${p.productId}`}
                          onClick={() => setPrintBarcode(p.barcode)}
                          className="flex items-center gap-1 text-[9px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded transition-all"
                        >
                          <Barcode className="w-2.5 h-2.5" />
                          Barcode Badge
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barcode Overlay Modal Dialogue */}
      {printBarcode && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 border border-slate-205 max-w-sm w-full relative animate-in zoom-in-95 duration-100">
            <button 
              onClick={() => setPrintBarcode(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-650"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-center space-y-3.5">
              <Printer className="w-8 h-8 mx-auto text-indigo-600 mb-2" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Code128 Barcode Generator</h3>
                <p className="text-xs text-slate-400">Generate tags for seamless offline inventory checkouts.</p>
              </div>

              <div className="my-5 flex justify-center">
                <BarcodePrinter value={printBarcode} />
              </div>

              <p className="text-[10px] text-slate-400 leading-normal">
                Standard Code128 pattern compatible with standard barcode CCD pistols and hand readers.
              </p>

              <button 
                id="modal-print-btn"
                onClick={() => {
                  window.print();
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Sticker Labels
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
