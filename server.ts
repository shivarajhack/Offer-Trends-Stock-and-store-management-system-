/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { Store, Staff, Product, StockIn, StockTransfer, Supplier, PurchaseOrder, Sale, AlertNotification, WebsiteOrder, AuditLog, SalesItem, POItem } from './src/types.js';

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'db_store.json');

app.use(express.json());

// Main App State Structure
interface AppDB {
  stores: Store[];
  staff: Staff[];
  products: Product[];
  suppliers: Supplier[];
  stockIns: StockIn[];
  transfers: StockTransfer[];
  sales: Sale[];
  purchaseOrders: PurchaseOrder[];
  notifications: AlertNotification[];
  websiteOrders: WebsiteOrder[];
  auditLogs: AuditLog[];
}

// Initial Seed Data
const initialDB: AppDB = {
  stores: [
    {
      id: 'store-hubli',
      storeName: 'Offer Trends Hubli',
      storeCode: 'OT-HUBLI',
      managerName: 'Ganesh M.',
      mobileNumber: '9845210021',
      address: 'Coen Road, near Laxmi Temple',
      city: 'Hubli',
      state: 'Karnataka',
      gstNumber: '29AAAAA0000A1Z1'
    },
    {
      id: 'store-dharwad',
      storeName: 'Offer Trends Dharwad',
      storeCode: 'OT-DHARWAD',
      managerName: 'Siddhesh K.',
      mobileNumber: '9886450122',
      address: 'Subhas Road, opposite Corporation Bank',
      city: 'Dharwad',
      state: 'Karnataka',
      gstNumber: '29BBBBB0000B1Z2'
    },
    {
      id: 'store-belagavi',
      storeName: 'Offer Trends Belagavi',
      storeCode: 'OT-BELAGAVI',
      managerName: 'Priya N.',
      mobileNumber: '8123019283',
      address: 'Channamma Circle, Above Cafe Coffee Day',
      city: 'Belagavi',
      state: 'Karnataka',
      gstNumber: '29CCCCC0000C1Z3'
    },
    {
      id: 'store-vijayapura',
      storeName: 'Offer Trends Vijayapura',
      storeCode: 'OT-VIJAYAPURA',
      managerName: 'Anand S.',
      mobileNumber: '9108420392',
      address: 'BLDE Road, near Ambedkar Stadium',
      city: 'Vijayapura',
      state: 'Karnataka',
      gstNumber: '29DDDDD0000D1Z4'
    }
  ],
  staff: [
    {
      employeeId: 'OT-EM-101',
      name: 'Ramesh Patil',
      mobile: '9845012345',
      email: 'ramesh@offertrends.com',
      role: 'Super Admin',
      storeId: 'Warehouse',
      salary: 55000,
      joiningDate: '2025-01-10',
      status: 'Active'
    },
    {
      employeeId: 'OT-EM-102',
      name: 'Ganesh M.',
      mobile: '9845210021',
      email: 'ganesh@offertrends.com',
      role: 'Manager',
      storeId: 'store-hubli',
      salary: 35000,
      joiningDate: '2025-02-15',
      status: 'Active'
    },
    {
      employeeId: 'OT-EM-103',
      name: 'Siddhesh K.',
      mobile: '9886450122',
      email: 'siddhesh@offertrends.com',
      role: 'Manager',
      storeId: 'store-dharwad',
      salary: 35000,
      joiningDate: '2025-02-18',
      status: 'Active'
    },
    {
      employeeId: 'OT-EM-104',
      name: 'Suresh Gouda',
      mobile: '9900112233',
      email: 'suresh@offertrends.com',
      role: 'Cashier',
      storeId: 'store-hubli',
      salary: 22000,
      joiningDate: '2025-03-01',
      status: 'Active'
    },
    {
      employeeId: 'OT-EM-105',
      name: 'Lata Hegde',
      mobile: '9112233445',
      email: 'lata@offertrends.com',
      role: 'Sales Executive',
      storeId: 'store-dharwad',
      salary: 18000,
      joiningDate: '2025-03-05',
      status: 'Active'
    },
    {
      employeeId: 'OT-EM-106',
      name: 'Malleshappa Y.',
      mobile: '8887776655',
      email: 'mallesh@offertrends.com',
      role: 'Warehouse Staff',
      storeId: 'Warehouse',
      salary: 20000,
      joiningDate: '2025-01-12',
      status: 'Active'
    }
  ],
  products: [
    {
      productId: 'PT-101',
      sku: 'OT-MEN-TSHIRT-001',
      barcode: '100101',
      productName: 'Men Premium Polo T-Shirt',
      brand: 'Offer Trends Select',
      category: 'Men',
      subCategory: 'T-Shirts',
      gender: 'Men',
      size: 'M',
      color: 'Navy Blue',
      purchasePrice: 250,
      sellingPrice: 599,
      discountPrice: 499,
      warehouseQuantity: 120,
      storeQuantities: {
        'store-hubli': 15,
        'store-dharwad': 12,
        'store-belagavi': 8,
        'store-vijayapura': 5
      }
    },
    {
      productId: 'PT-102',
      sku: 'OT-WOM-KURTI-001',
      barcode: '200201',
      productName: 'Women designer Cotton Kurti',
      brand: 'Avasa',
      category: 'Women',
      subCategory: 'Kurtis',
      gender: 'Women',
      size: 'L',
      color: 'Crimson Red',
      purchasePrice: 450,
      sellingPrice: 999,
      discountPrice: 849,
      warehouseQuantity: 75,
      storeQuantities: {
        'store-hubli': 12,
        'store-dharwad': 6,
        'store-belagavi': 7,
        'store-vijayapura': 3
      }
    },
    {
      productId: 'PT-103',
      sku: 'OT-MEN-JEANS-001',
      barcode: '100301',
      productName: 'Men Super-Stretch Denim S-1',
      brand: 'Sparky',
      category: 'Men',
      subCategory: 'Jeans',
      gender: 'Men',
      size: '32',
      color: 'Dark Indigo',
      purchasePrice: 600,
      sellingPrice: 1499,
      discountPrice: 1199,
      warehouseQuantity: 95,
      storeQuantities: {
        'store-hubli': 22,
        'store-dharwad': 14,
        'store-belagavi': 10,
        'store-vijayapura': 8
      }
    },
    {
      productId: 'PT-104',
      sku: 'OT-WOM-SAREE-001',
      barcode: '200401',
      productName: 'Kanjeevaram Classic Zari Saree',
      brand: 'Nalli Silks',
      category: 'Women',
      subCategory: 'Sarees',
      gender: 'Women',
      size: 'Free Size',
      color: 'Teal Gold',
      purchasePrice: 1200,
      sellingPrice: 3500,
      discountPrice: 2999,
      warehouseQuantity: 30,
      storeQuantities: {
        'store-hubli': 4,
        'store-dharwad': 2,
        'store-belagavi': 3,
        'store-vijayapura': 1
      }
    },
    {
      productId: 'PT-105',
      sku: 'OT-ACC-WALLET-001',
      barcode: '300501',
      productName: 'Pure Leather Vintage Wallet',
      brand: 'Texco Acc',
      category: 'Accessories',
      subCategory: 'Wallets',
      gender: 'Unisex',
      size: 'Standard',
      color: 'Tan Brown',
      purchasePrice: 150,
      sellingPrice: 499,
      discountPrice: 399,
      warehouseQuantity: 180,
      storeQuantities: {
        'store-hubli': 40,
        'store-dharwad': 25,
        'store-belagavi': 15,
        'store-vijayapura': 12
      }
    }
  ],
  suppliers: [
    {
      id: 'sup-1',
      supplierName: 'Vikas Garments Wholesale',
      contact: '9448123456',
      gstNumber: '29VGW7890H1Z8',
      address: 'Industrial Area, Nehru Nagar, Hubli'
    },
    {
      id: 'sup-2',
      supplierName: 'Balaji Saree Distributors',
      contact: '9844098765',
      gstNumber: '29BSM3456K1Z9',
      address: 'Chickpet, Bengaluru'
    }
  ],
  stockIns: [
    {
      id: 'st-in-1',
      supplierId: 'sup-1',
      productId: 'PT-101',
      quantity: 50,
      costPrice: 250,
      invoiceNumber: 'INV-2026-001',
      date: '2026-05-10T10:00:00Z'
    }
  ],
  transfers: [
    {
      id: 'tr-1',
      productId: 'PT-101',
      quantity: 10,
      sourceStoreId: 'Warehouse',
      destinationStoreId: 'store-hubli',
      date: '2026-05-15T14:30:00Z',
      status: 'Completed'
    }
  ],
  sales: [
    {
      id: 'sale-1',
      billNumber: 'BILL-OT-0001',
      date: '2026-06-05T12:00:00.000Z',
      storeId: 'store-hubli',
      staffId: 'OT-EM-104',
      items: [
        {
          productId: 'PT-101',
          productName: 'Men Premium Polo T-Shirt',
          quantity: 1,
          price: 499,
          total: 499
        }
      ],
      paymentMode: 'UPI',
      totalAmount: 499,
      taxAmount: 76.11
    }
  ],
  purchaseOrders: [
    {
      id: 'po-1',
      poNumber: 'PO-2026-0001',
      supplierId: 'sup-1',
      date: '2026-06-01',
      status: 'Received',
      items: [
        {
          productId: 'PT-101',
          quantity: 100,
          purchasePrice: 250
        }
      ],
      totalAmount: 25000
    }
  ],
  notifications: [
    {
      id: 'notif-1',
      type: 'Low Stock',
      message: 'Kanjeevaram Classic Zari Saree has only 1 unit left at Offer Trends Vijayapura',
      sku: 'OT-WOM-SAREE-001',
      productId: 'PT-104',
      storeId: 'store-vijayapura',
      date: '2026-06-04T18:00:00Z',
      read: false
    }
  ],
  websiteOrders: [
    {
      id: 'web-ord-1001',
      customerName: 'Mahesh Patil',
      customerEmail: 'mahesh.karnataka@gmail.com',
      items: [
        {
          productId: 'PT-102',
          sku: 'OT-WOM-KURTI-001',
          quantity: 2
        }
      ],
      totalAmount: 1698,
      date: '2026-06-06T04:20:00Z',
      status: 'Synced & Decremented'
    }
  ],
  auditLogs: [
    {
      id: 'log-1',
      timestamp: '2026-06-06T05:00:00Z',
      action: 'INITIAL_SEED',
      operator: 'System Administrator',
      details: 'Offer Trends ERP successfully bootstrapped with seed stores and products'
    }
  ]
};

// Database Read/Write Handlers
function getDB(): AppDB {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading persistence DB, using initial state:', err);
  }
  // Store initial content if file doesn't exist
  writeDB(initialDB);
  return initialDB;
}

function writeDB(data: AppDB) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database to disk:', err);
  }
}

// Log actions
function addAudit(db: AppDB, action: string, operator: string, details: string) {
  const newLog: AuditLog = {
    id: 'log-' + Date.now(),
    timestamp: new Date().toISOString(),
    action,
    operator,
    details
  };
  db.auditLogs.unshift(newLog);
}

// Check for low stock alert
function checkStockAlerts(db: AppDB, product: Product, locId: string, currentQty: number) {
  const threshold = 5;
  const storeLabel = locId === 'Warehouse' ? 'Central Warehouse' : (db.stores.find(s => s.id === locId)?.storeName || locId);
  const exists = db.notifications.some(n => n.productId === product.productId && n.storeId === locId && !n.read && n.type === (currentQty === 0 ? 'Out Of Stock' : 'Low Stock'));
  
  if (currentQty <= threshold && !exists) {
    const isOut = currentQty === 0;
    const alert: AlertNotification = {
      id: 'alert-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      type: isOut ? 'Out Of Stock' : 'Low Stock',
      message: `${product.productName} (${product.size}/${product.color}) has only ${currentQty} units left at ${storeLabel}`,
      sku: product.sku,
      productId: product.productId,
      storeId: locId,
      date: new Date().toISOString(),
      read: false
    };
    db.notifications.unshift(alert);
  }
}

// REST APIs

// 1. Fetch entire database structure
app.get('/api/data', (req, res) => {
  res.json(getDB());
});

// 2. Future Website Integration API: GET /api/products
app.get('/api/products', (req, res) => {
  const db = getDB();
  // Return simple details convenient for an eCommerce sync
  const productsSync = db.products.map(p => ({
    productId: p.productId,
    sku: p.sku,
    barcode: p.barcode,
    productName: p.productName,
    brand: p.brand,
    category: p.category,
    subCategory: p.subCategory,
    gender: p.gender,
    size: p.size,
    color: p.color,
    price: p.discountPrice,
    originalPrice: p.sellingPrice,
    totalStockAvailable: p.warehouseQuantity + Object.values(p.storeQuantities).reduce((a, b) => a + b, 0)
  }));
  res.json(productsSync);
});

// 3. Future Website Integration API: GET /api/stock
app.get('/api/stock', (req, res) => {
  const db = getDB();
  const stockInfo = db.products.map(p => ({
    productId: p.productId,
    sku: p.sku,
    warehouseQty: p.warehouseQuantity,
    storeStocks: p.storeQuantities,
    total: p.warehouseQuantity + Object.values(p.storeQuantities).reduce((a, b) => a + b, 0)
  }));
  res.json(stockInfo);
});

// 4. Future Website Integration API: POST /api/order (Places web order & live decrs warehouse stock)
app.post('/api/order', (req, res) => {
  const { customerName, customerEmail, items } = req.body;
  
  if (!customerName || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Invalid web order structure. Required: customerName, items array.' });
  }

  const db = getDB();
  let totalAmount = 0;
  const processedItems: WebsiteOrder['items'] = [];

  for (const requestedItem of items) {
    const product = db.products.find(p => p.sku === requestedItem.sku || p.productId === requestedItem.productId);
    if (!product) {
      return res.status(404).json({ error: `Product with identifier ${requestedItem.sku || requestedItem.productId} not found.` });
    }
    const qty = requestedItem.quantity || 1;
    if (product.warehouseQuantity < qty) {
      return res.status(400).json({ error: `Not enough stock in Central Warehouse for SKU ${product.sku}. Available: ${product.warehouseQuantity}` });
    }

    product.warehouseQuantity -= qty;
    totalAmount += product.discountPrice * qty;
    processedItems.push({
      productId: product.productId,
      sku: product.sku,
      quantity: qty
    });

    // Audit logs & alerts
    checkStockAlerts(db, product, 'Warehouse', product.warehouseQuantity);
    addAudit(db, 'ONLINE_ORDER_SYNC', 'eCommerce Web API', `Decr Central Warehouse stock for ${product.sku} by ${qty}. Left: ${product.warehouseQuantity}`);
  }

  const newOrder: WebsiteOrder = {
    id: `web-ord-${Date.now()}`,
    customerName,
    customerEmail: customerEmail || 'guest@offertrends.com',
    items: processedItems,
    totalAmount,
    date: new Date().toISOString(),
    status: 'Synced & Decremented'
  };

  db.websiteOrders.unshift(newOrder);
  writeDB(db);

  res.status(201).json({
    message: 'Online Order synced and inventory decremented successfully',
    order: newOrder,
    syncedStockLeft: db.products.map(p => ({ sku: p.sku, warehouseQuantity: p.warehouseQuantity }))
  });
});

// 5. Future API: POST /api/update-stock (REST Sync for warehouse or local adjustments)
app.post('/api/update-stock', (req, res) => {
  const { sku, productId, storeId, quantity, type } = req.body; // type: 'add' or 'subtract'
  if ((!sku && !productId) || !quantity) {
    return res.status(400).json({ error: 'Missing product identifier or quantity' });
  }

  const db = getDB();
  const product = db.products.find(p => p.sku === sku || p.productId === productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const targetLoc = storeId || 'Warehouse';
  const op = type === 'subtract' ? -1 : 1;
  const change = Math.abs(Number(quantity)) * op;

  if (targetLoc === 'Warehouse') {
    product.warehouseQuantity = Math.max(0, product.warehouseQuantity + change);
    checkStockAlerts(db, product, 'Warehouse', product.warehouseQuantity);
  } else {
    const current = product.storeQuantities[targetLoc] || 0;
    product.storeQuantities[targetLoc] = Math.max(0, current + change);
    checkStockAlerts(db, product, targetLoc, product.storeQuantities[targetLoc]);
  }

  addAudit(db, 'API_STOCK_UPDATE', 'Developer Portal', `Adjusted stock for SKU ${product.sku} at ${targetLoc} by ${change}.`);
  writeDB(db);

  res.json({ message: 'Stock updated via API successfully', product });
});

// 6. Add Store
app.post('/api/stores', (req, res) => {
  const db = getDB();
  const storeData: Store = req.body;

  if (!storeData.storeName || !storeData.storeCode) {
    return res.status(400).json({ error: 'Missing Store Name or Code' });
  }

  // Check duplicate code
  if (db.stores.some(s => s.storeCode.toUpperCase() === storeData.storeCode.toUpperCase())) {
    return res.status(400).json({ error: 'Store Code already exists' });
  }

  const newStore: Store = {
    ...storeData,
    id: 'store-' + Date.now(),
    storeCode: storeData.storeCode.toUpperCase()
  };

  db.stores.push(newStore);
  
  // Seed product keys for new store
  db.products.forEach(p => {
    if (!p.storeQuantities) p.storeQuantities = {};
    p.storeQuantities[newStore.id] = 0;
  });

  addAudit(db, 'STORE_CREATED', 'Super Admin', `Created store ${newStore.storeName} (${newStore.storeCode})`);
  writeDB(db);
  res.status(201).json(db);
});

// 7. Add Staff
app.post('/api/staff', (req, res) => {
  const db = getDB();
  const staffData: Staff = req.body;

  if (!staffData.name || !staffData.employeeId || !staffData.role) {
    return res.status(400).json({ error: 'Missing name, employee ID or role' });
  }

  if (db.staff.some(s => s.employeeId.toUpperCase() === staffData.employeeId.toUpperCase())) {
    return res.status(400).json({ error: 'Employee ID already exists' });
  }

  const newStaff: Staff = {
    ...staffData,
    status: staffData.status || 'Active',
    joiningDate: staffData.joiningDate || new Date().toISOString().split('T')[0]
  };

  db.staff.push(newStaff);
  addAudit(db, 'STAFF_ADDED', 'Super Admin', `Registered employee ${newStaff.name} with role ${newStaff.role}`);
  writeDB(db);
  res.status(201).json(db);
});

// 8. Add Product (Product Master)
app.post('/api/products', (req, res) => {
  const db = getDB();
  const productData: Product = req.body;

  if (!productData.sku || !productData.productName || !productData.barcode) {
    return res.status(400).json({ error: 'SKU, name, and Barcode are required' });
  }

  if (db.products.some(p => p.sku === productData.sku)) {
    return res.status(400).json({ error: 'Product SKU already exists' });
  }
  if (db.products.some(p => p.barcode === productData.barcode)) {
    return res.status(400).json({ error: 'Barcode is already assigned to another product' });
  }

  const newProd: Product = {
    ...productData,
    productId: 'PT-' + (100 + db.products.length + 1),
    warehouseQuantity: Number(productData.warehouseQuantity) || 0,
    storeQuantities: productData.storeQuantities || {}
  };

  // Ensure all existing stores have an entry
  db.stores.forEach(st => {
    if (newProd.storeQuantities[st.id] === undefined) {
      newProd.storeQuantities[st.id] = 0;
    }
  });

  db.products.push(newProd);

  // Check alerting right off the bat
  checkStockAlerts(db, newProd, 'Warehouse', newProd.warehouseQuantity);
  Object.keys(newProd.storeQuantities).forEach(stId => {
    checkStockAlerts(db, newProd, stId, newProd.storeQuantities[stId]);
  });

  addAudit(db, 'PRODUCT_CREATED', 'Super Admin', `Added new product ${newProd.productName} SKU: ${newProd.sku}`);
  writeDB(db);
  res.status(201).json(db);
});

// 9. Stock In (Warehouse increment)
app.post('/api/stock-in', (req, res) => {
  const db = getDB();
  const { supplierId, productId, quantity, costPrice, invoiceNumber, date } = req.body;

  if (!productId || !quantity || !invoiceNumber) {
    return res.status(400).json({ error: 'Product, Quantity and invoice number are required' });
  }

  const product = db.products.find(p => p.productId === productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const netQty = Number(quantity);
  const netCost = Number(costPrice) || product.purchasePrice;

  // Inventory increases automatically
  product.warehouseQuantity += netQty;

  const newStockIn: StockIn = {
    id: 'st-in-' + Date.now(),
    supplierId: supplierId || 'sup-1',
    productId,
    quantity: netQty,
    costPrice: netCost,
    invoiceNumber,
    date: date || new Date().toISOString()
  };

  db.stockIns.push(newStockIn);
  addAudit(db, 'STOCK_IN_RECEIVED', 'Warehouse Staff', `Stocked in ${netQty} units of SKU ${product.sku}. Invoice ${invoiceNumber}.`);
  writeDB(db);
  res.status(201).json(db);
});

// 10. Stock Transfer (Store A -> Store B or Warehouse -> Store)
app.post('/api/transfers', (req, res) => {
  const db = getDB();
  const { productId, quantity, sourceStoreId, destinationStoreId } = req.body;

  if (!productId || !quantity || !sourceStoreId || !destinationStoreId) {
    return res.status(400).json({ error: 'Required attributes: product, quantity, source, and destination' });
  }

  if (sourceStoreId === destinationStoreId) {
    return res.status(400).json({ error: 'Source and Destination stores cannot be same' });
  }

  const product = db.products.find(p => p.productId === productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const qty = Number(quantity);

  // Deduct from Source
  if (sourceStoreId === 'Warehouse') {
    if (product.warehouseQuantity < qty) {
      return res.status(400).json({ error: `Insufficient stock in Central Warehouse. Current: ${product.warehouseQuantity}` });
    }
    product.warehouseQuantity -= qty;
    checkStockAlerts(db, product, 'Warehouse', product.warehouseQuantity);
  } else {
    const srcStock = product.storeQuantities[sourceStoreId] || 0;
    if (srcStock < qty) {
      return res.status(400).json({ error: `Insufficient stock in source store. Available: ${srcStock}` });
    }
    product.storeQuantities[sourceStoreId] = srcStock - qty;
    checkStockAlerts(db, product, sourceStoreId, product.storeQuantities[sourceStoreId]);
  }

  // Add to Destination
  if (destinationStoreId === 'Warehouse') {
    product.warehouseQuantity += qty;
  } else {
    const dstStock = product.storeQuantities[destinationStoreId] || 0;
    product.storeQuantities[destinationStoreId] = dstStock + qty;
    checkStockAlerts(db, product, destinationStoreId, product.storeQuantities[destinationStoreId]);
  }

  const transferLog: StockTransfer = {
    id: 'tr-' + Date.now(),
    productId,
    quantity: qty,
    sourceStoreId,
    destinationStoreId,
    date: new Date().toISOString(),
    status: 'Completed'
  };

  db.transfers.push(transferLog);

  const srcLabel = sourceStoreId === 'Warehouse' ? 'Warehouse' : (db.stores.find(s => s.id === sourceStoreId)?.storeName || sourceStoreId);
  const dstLabel = destinationStoreId === 'Warehouse' ? 'Warehouse' : (db.stores.find(s => s.id === destinationStoreId)?.storeName || destinationStoreId);

  addAudit(db, 'STOCK_TRANSFER', 'Super Admin', `Transferred ${qty}x of ${product.sku} from [${srcLabel}] to [${dstLabel}]`);
  writeDB(db);

  res.status(200).json(db);
});

// 11. POS Offline Billing Sale
app.post('/api/sales', (req, res) => {
  const db = getDB();
  const { storeId, staffId, items, paymentMode } = req.body;

  if (!storeId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Missing Store, Salesperson or Sales items' });
  }

  const parsedItems: SalesItem[] = [];
  let subtotal = 0;

  for (const requested of items) {
    const itemInfo = db.products.find(p => p.productId === requested.productId);
    if (!itemInfo) {
      return res.status(404).json({ error: `Product ID ${requested.productId} not found` });
    }

    const qty = Number(requested.quantity);
    const storeStock = itemInfo.storeQuantities[storeId] || 0;

    if (storeStock < qty) {
      return res.status(400).json({ error: `Not enough stock in this store for SKU ${itemInfo.sku}. Available: ${storeStock}` });
    }

    // Decrement stock
    itemInfo.storeQuantities[storeId] = storeStock - qty;

    const unitPrice = itemInfo.discountPrice || itemInfo.sellingPrice;
    const total = unitPrice * qty;
    subtotal += total;

    parsedItems.push({
      productId: itemInfo.productId,
      productName: itemInfo.productName,
      quantity: qty,
      price: unitPrice,
      total
    });

    // Check alerting
    checkStockAlerts(db, itemInfo, storeId, itemInfo.storeQuantities[storeId]);
  }

  const billNumber = `BILL-OT-${1000 + db.sales.length + 1}`;
  const mockTax = subtotal * 0.18; // 18% GST

  const newSale: Sale = {
    id: 'sale-' + Date.now(),
    billNumber,
    date: new Date().toISOString(),
    storeId,
    staffId: staffId || 'OT-EM-104',
    items: parsedItems,
    paymentMode: paymentMode || 'Cash',
    totalAmount: subtotal,
    taxAmount: Number(mockTax.toFixed(2))
  };

  db.sales.push(newSale);
  addAudit(db, 'SALE_RECORDED', 'Cashier', `Billed ${billNumber} at store. Total Amount: INR ${subtotal}.`);
  writeDB(db);

  res.status(201).json(db);
});

// 12. Add Supplier
app.post('/api/suppliers', (req, res) => {
  const db = getDB();
  const { supplierName, contact, gstNumber, address } = req.body;

  if (!supplierName) {
    return res.status(400).json({ error: 'Supplier Name is required' });
  }

  const supplier: Supplier = {
    id: 'sup-' + (db.suppliers.length + 1),
    supplierName,
    contact: contact || '',
    gstNumber: gstNumber || '',
    address: address || ''
  };

  db.suppliers.push(supplier);
  addAudit(db, 'SUPPLIER_ADDED', 'Super Admin', `Registered Supplier ${supplierName}`);
  writeDB(db);
  res.status(201).json(db);
});

// 13. Create Purchase Order
app.post('/api/po', (req, res) => {
  const db = getDB();
  const { supplierId, items } = req.body;

  if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Supplier and active purchase items are required' });
  }

  let totalAmount = 0;
  const processedItems: POItem[] = items.map(itm => {
    const product = db.products.find(p => p.productId === itm.productId);
    const price = Number(itm.purchasePrice) || (product ? product.purchasePrice : 0);
    const qty = Number(itm.quantity);
    totalAmount += price * qty;
    
    return {
      productId: itm.productId,
      quantity: qty,
      purchasePrice: price
    };
  });

  const newPO: PurchaseOrder = {
    id: 'po-' + Date.now(),
    poNumber: `PO-2026-` + String(1000 + db.purchaseOrders.length + 1),
    supplierId,
    date: new Date().toISOString().split('T')[0],
    status: 'Draft',
    items: processedItems,
    totalAmount
  };

  db.purchaseOrders.push(newPO);
  addAudit(db, 'PO_CREATED', 'Super Admin', `Created Purchase Order Draft ${newPO.poNumber}`);
  writeDB(db);
  res.status(201).json(db);
});

// 14. Approve and Receive PO
app.post('/api/po/status', (req, res) => {
  const db = getDB();
  const { poId, status } = req.body; // status: 'Approved' or 'Received'

  const po = db.purchaseOrders.find(p => p.id === poId);
  if (!po) {
    return res.status(404).json({ error: 'Purchase Order not found' });
  }

  const oldStatus = po.status;
  po.status = status;

  if (status === 'Received' && oldStatus !== 'Received') {
    // Inventory increases for all items inside this PO!
    for (const item of po.items) {
      const product = db.products.find(p => p.productId === item.productId);
      if (product) {
        product.warehouseQuantity += item.quantity;
        checkStockAlerts(db, product, 'Warehouse', product.warehouseQuantity);
        
        // Log individual item stocking in
        db.stockIns.push({
          id: 'st-in-' + Date.now() + '-' + Math.floor(Math.random() * 100),
          supplierId: po.supplierId,
          productId: item.productId,
          quantity: item.quantity,
          costPrice: item.purchasePrice,
          invoiceNumber: `INV-${po.poNumber}`,
          date: new Date().toISOString()
        });
      }
    }
    
    addAudit(db, 'PO_RECEIVED', 'Warehouse Staff', `Received stock for PO ${po.poNumber}. Transferred to Central Warehouse.`);
  } else {
    addAudit(db, 'PO_STATUS_CHANGE', 'Super Admin', `Changed status of PO ${po.poNumber} from ${oldStatus} to ${status}`);
  }

  writeDB(db);
  res.json(db);
});

// 15. Clear notifications
app.post('/api/notifications/read-all', (req, res) => {
  const db = getDB();
  db.notifications.forEach(n => { n.read = true; });
  writeDB(db);
  res.json(db);
});

// Serve static elements in production or use Vite Client mode
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Offer Trends Server running on port ${PORT}`);
  });
}

startServer();
