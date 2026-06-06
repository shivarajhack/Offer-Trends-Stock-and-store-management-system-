/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'Super Admin' | 'Manager' | 'Cashier' | 'Sales Executive' | 'Warehouse Staff';

export interface Store {
  id: string; // unique internal id
  storeName: string;
  storeCode: string; // e.g., OT-HUBLI
  managerName: string;
  mobileNumber: string;
  address: string;
  city: string;
  state: string;
  gstNumber: string;
}

export interface Staff {
  employeeId: string; // e.g. EM-101
  name: string;
  mobile: string;
  email: string;
  role: Role;
  storeId: string; // "Central Warehouse" or a store ID
  salary: number;
  joiningDate: string;
  status: 'Active' | 'Inactive';
}

export interface Product {
  productId: string; // e.g. PT-101
  sku: string; // e.g. OT-MEN-TSHIRT-001
  barcode: string; // e.g. 10293847
  productName: string;
  brand: string;
  category: string; // Category (e.g., Men, Women, Kids, Accessories)
  subCategory: string; // e.g. T-Shirts, Kurtis, Belts
  gender: 'Men' | 'Women' | 'Kids' | 'Unisex';
  size: string; // S, M, L, XL, etc.
  color: string;
  purchasePrice: number;
  sellingPrice: number;
  discountPrice: number;
  warehouseQuantity: number; // central warehouse quantity
  storeQuantities: Record<string, number>; // maps storeId -> quantity
}

export interface StockIn {
  id: string;
  supplierId: string;
  productId: string;
  quantity: number;
  costPrice: number;
  invoiceNumber: string;
  date: string;
}

export interface StockTransfer {
  id: string;
  productId: string;
  quantity: number;
  sourceStoreId: string; // "Warehouse" or storeId
  destinationStoreId: string; // storeId
  date: string;
  status: 'Pending' | 'Completed';
}

export interface Supplier {
  id: string;
  supplierName: string;
  contact: string;
  gstNumber: string;
  address: string;
}

export interface POItem {
  productId: string;
  quantity: number;
  purchasePrice: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  date: string;
  status: 'Draft' | 'Approved' | 'Received';
  items: POItem[];
  totalAmount: number;
}

export interface SalesItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number; // sells at discountPrice or sellingPrice
  total: number;
}

export interface Sale {
  id: string;
  billNumber: string;
  date: string;
  storeId: string;
  staffId: string;
  items: SalesItem[];
  paymentMode: 'Cash' | 'Card' | 'UPI';
  totalAmount: number;
  taxAmount: number; // 18% GST mock
}

export interface AlertNotification {
  id: string;
  type: 'Low Stock' | 'Out Of Stock';
  message: string;
  sku: string;
  productId: string;
  storeId: string; // "Warehouse" or storeId
  date: string;
  read: boolean;
}

export interface WebsiteOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  items: {
    productId: string;
    sku: string;
    quantity: number;
  }[];
  totalAmount: number;
  date: string;
  status: 'Online Ordered' | 'Synced & Decremented';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  operator: string;
  details: string;
}
