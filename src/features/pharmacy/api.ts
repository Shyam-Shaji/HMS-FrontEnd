import { apiClient } from '@/lib/api-client';
import type { Prescription } from '@/features/prescriptions/types';
import type {
  AddBatchInput,
  CreateMedicineInput,
  CreatePurchaseOrderInput,
  CreateSupplierInput,
  DispenseInput,
  DispenseRecord,
  LowStockEntry,
  Medicine,
  MedicineBatch,
  PurchaseOrder,
  ReceivePurchaseOrderInput,
  Supplier,
} from './types';

// Kept for the doctor's prescription pad, which only needs names.
export type MedicineCatalogItem = Medicine;

export function searchMedicines(q?: string) {
  return apiClient.get<never, Medicine[]>('/pharmacy/medicines', { params: { q: q || undefined } });
}
export function createMedicine(input: CreateMedicineInput) {
  return apiClient.post<never, Medicine>('/pharmacy/medicines', input);
}
export function fetchBatches(medicineId: string) {
  return apiClient.get<never, MedicineBatch[]>(`/pharmacy/medicines/${medicineId}/batches`);
}
export function addBatch(medicineId: string, input: AddBatchInput) {
  return apiClient.post<never, MedicineBatch>(`/pharmacy/medicines/${medicineId}/batches`, input);
}
export function fetchLowStock() {
  return apiClient.get<never, LowStockEntry[]>('/pharmacy/medicines/low-stock');
}
export function fetchExpiring(days: number) {
  return apiClient.get<never, MedicineBatch[]>('/pharmacy/medicines/expiring', { params: { days } });
}

export function fetchSuppliers() {
  return apiClient.get<never, Supplier[]>('/pharmacy/suppliers');
}
export function createSupplier(input: CreateSupplierInput) {
  return apiClient.post<never, Supplier>('/pharmacy/suppliers', input);
}

export function fetchPurchaseOrders() {
  return apiClient.get<never, PurchaseOrder[]>('/pharmacy/purchase-orders');
}
export function createPurchaseOrder(input: CreatePurchaseOrderInput) {
  return apiClient.post<never, PurchaseOrder>('/pharmacy/purchase-orders', input);
}
export function receivePurchaseOrder(id: string, input: ReceivePurchaseOrderInput) {
  return apiClient.patch<never, PurchaseOrder>(`/pharmacy/purchase-orders/${id}/receive`, input);
}
export function cancelPurchaseOrder(id: string) {
  return apiClient.patch<never, PurchaseOrder>(`/pharmacy/purchase-orders/${id}/cancel`);
}

export function fetchDispenseQueue() {
  return apiClient.get<never, Prescription[]>('/pharmacy/dispense-queue');
}
export function dispensePrescription(prescriptionId: string, input: DispenseInput) {
  return apiClient.post<never, DispenseRecord>(`/pharmacy/prescriptions/${prescriptionId}/dispense`, input);
}
