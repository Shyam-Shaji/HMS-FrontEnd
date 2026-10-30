import { apiClient } from '@/lib/api-client';
import type { Paginated } from '@/types/api';
import type { CreateLabOrderInput, LabOrder, LabOrderPriority, LabTest, ResultParameterInput, SaveLabTestInput } from './types';

// ---- patient portal ----
export function fetchMyLabReports() {
  return apiClient.get<never, LabOrder[]>('/lab/me');
}

export function fetchMyLabReportById(id: string) {
  return apiClient.get<never, LabOrder>(`/lab/me/${id}`);
}

// ---- clinical staff ----
export function searchLabTests(q?: string, includeInactive?: boolean) {
  return apiClient.get<never, LabTest[]>('/lab/tests', { params: { q: q || undefined, includeInactive: includeInactive || undefined } });
}

export function orderLabFromAppointment(appointmentId: string, input: CreateLabOrderInput) {
  return apiClient.post<never, LabOrder>(`/emr/visits/${appointmentId}/lab-orders`, input);
}

export function orderLabFromAdmission(admissionId: string, input: CreateLabOrderInput) {
  return apiClient.post<never, LabOrder>(`/admissions/${admissionId}/lab-orders`, input);
}

export interface LabOrderSearchParams {
  // One status, or comma-separated ("sample_collected,in_progress").
  status?: string;
  verifiedFrom?: string;
  priority?: LabOrderPriority;
  patientId?: string;
  orderedBy?: string;
  page?: number;
  limit?: number;
}

export function searchLabOrders(params: LabOrderSearchParams) {
  return apiClient.get<never, Paginated<LabOrder>>('/lab/orders', { params });
}

export function fetchLabOrder(id: string) {
  return apiClient.get<never, LabOrder>(`/lab/orders/${id}`);
}

// Verified results only - what a doctor reviews before/while consulting.
export function fetchPatientLabHistory(patientId: string) {
  return apiClient.get<never, LabOrder[]>(`/lab/patients/${patientId}/history`);
}

// ---- lab technician ----
export function createLabTest(input: SaveLabTestInput) {
  return apiClient.post<never, LabTest>('/lab/tests', input);
}
export function updateLabTest(id: string, input: Partial<SaveLabTestInput>) {
  return apiClient.patch<never, LabTest>(`/lab/tests/${id}`, input);
}

export function collectSample(id: string) {
  return apiClient.patch<never, LabOrder>(`/lab/orders/${id}/collect-sample`);
}
export function startProcessing(id: string) {
  return apiClient.patch<never, LabOrder>(`/lab/orders/${id}/start-processing`);
}
export function saveLabResult(id: string, input: { resultParameters?: ResultParameterInput[]; resultNotes?: string }) {
  return apiClient.patch<never, LabOrder>(`/lab/orders/${id}/result`, input);
}
export function verifyLabOrder(id: string) {
  return apiClient.patch<never, LabOrder>(`/lab/orders/${id}/verify`);
}
export function cancelLabOrder(id: string, reason?: string) {
  return apiClient.patch<never, LabOrder>(`/lab/orders/${id}/cancel`, { reason });
}

export function uploadLabReportFile(id: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  return apiClient.post<never, LabOrder>(`/lab/orders/${id}/report-file`, form);
}
