export interface Medicine {
  _id: string;
  name: string;
  genericName?: string;
  manufacturer?: string;
  category?: string;
  unit: string;
  reorderLevel: number;
  // Dispensable stock only (non-expired batches) and the nearest expiry
  // among them - computed by the backend, not stored.
  totalAvailable: number;
  nextExpiry: string | null;
}

export interface MedicineBatch {
  _id: string;
  medicineId: string | { _id: string; name: string; unit: string };
  batchNumber: string;
  expiryDate: string;
  quantityReceived: number;
  quantityAvailable: number;
  pricePerUnit: number;
  supplier?: string;
}

export interface LowStockEntry {
  medicine: { _id: string; name: string; unit: string; reorderLevel: number };
  totalAvailable: number;
}

export interface Supplier {
  _id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export type PurchaseOrderStatus = 'pending' | 'received' | 'cancelled';

export interface PurchaseOrder {
  _id: string;
  supplierId: { _id: string; name: string } | string;
  items: { medicineId: { _id: string; name: string; unit: string } | string; quantity: number; estimatedUnitPrice: number }[];
  status: PurchaseOrderStatus;
  expectedDeliveryDate?: string;
  receivedDate?: string;
  createdAt: string;
}

export interface DispensedLine {
  medicineName: string;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface DispenseRecord {
  _id: string;
  items: DispensedLine[];
  totalAmount: number;
}

export interface CreateMedicineInput {
  name: string;
  genericName?: string;
  manufacturer?: string;
  category?: string;
  unit: string;
  reorderLevel?: number;
}

export interface AddBatchInput {
  batchNumber: string;
  expiryDate: string;
  quantityReceived: number;
  pricePerUnit: number;
  supplier?: string;
}

export interface CreateSupplierInput {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface CreatePurchaseOrderInput {
  supplierId: string;
  items: { medicineId: string; quantity: number; estimatedUnitPrice: number }[];
  expectedDeliveryDate?: string;
}

export interface ReceivePurchaseOrderInput {
  items: { medicineId: string; batchNumber: string; expiryDate: string; quantityReceived: number; pricePerUnit: number }[];
}

export interface DispenseInput {
  items: { prescriptionLineId: string; medicineId: string; quantity: number }[];
}
