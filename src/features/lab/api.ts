import { apiClient } from "@/lib/api-client";
import type { Paginated } from "@/types/api";
import type { CreateLabOrderInput, LabOrder, LabOrderPriority, LabOrderStatus, LabTest } from "./types";

// ---- patient portal ----
export function fetchMyLabReports() {
  return apiClient.get<never, LabOrder[]>('/lab/me');
}

export function fetchMyLabReportById(id: string) {
  return apiClient.get<never, LabOrder>(`/lab/me/${id}`);
}

// ---- clinical staff ----
export function searchLabTests(q?: string) {
  return apiClient.get<never, LabTest[]>('/lab/tests', { params: { q: q || undefined } });
}

export function orderLabFromAppointment(appointmentId: string, input: CreateLabOrderInput) {
  return apiClient.post<never, LabOrder>(`/emr/visits/${appointmentId}/lab-orders`, input);
}

export function orderLabFromAdmission(admissionId: string, input: CreateLabOrderInput) {
  return apiClient.post<never, LabOrder>(`/admissions/${admissionId}/lab-orders`, input);
}

export interface LabOrderSearchParams {
  status?: LabOrderStatus;
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
