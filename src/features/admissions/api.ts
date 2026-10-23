import { apiClient } from "@/lib/api-client";
import type { Paginated } from "@/types/api";
import type { 
    Admission, 
    CreateMedicationOrderInput, 
    DischargeInput, 
    MedicationOrder, 
    RoundNote, 
    VitalsLogEntry 
} from "./types";

export function searchAdmissions(params: {
  status?: 'admitted' | 'discharged';
  admittingDoctorId?: string;
  page?: number;
  limit?: number;
}) {
  return apiClient.get<never, Paginated<Admission>>('/admissions', { params });
}

export function fetchAdmission(id: string) {
  return apiClient.get<never, Admission>(`/admissions/${id}`);
}

export function fetchVitalsLogs(id: string) {
  return apiClient.get<never, VitalsLogEntry[]>(`/admissions/${id}/vitals`);
}

export function fetchRoundNotes(id: string) {
  return apiClient.get<never, RoundNote[]>(`/admissions/${id}/rounds`);
}

export function addRoundNote(id: string, note: string) {
  return apiClient.post<never, RoundNote>(`/admissions/${id}/rounds`, { note });
}

export function fetchMedicationOrders(id: string) {
  return apiClient.get<never, MedicationOrder[]>(`/admissions/${id}/medications`);
}

export function createMedicationOrder(id: string, input: CreateMedicationOrderInput) {
  return apiClient.post<never, MedicationOrder>(`/admissions/${id}/medications`, input);
}

export function dischargeAdmission(id: string, input: DischargeInput) {
  return apiClient.patch<never, Admission>(`/admissions/${id}/discharge`, input);
}

import type { AddVitalsLogInput, AdministrationStatus, AdmitPatientInput, TransferInput } from './types';

export function admitPatient(input: AdmitPatientInput) {
  return apiClient.post<never, Admission>('/admissions', input);
}

export function transferAdmission(id: string, input: TransferInput) {
  return apiClient.patch<never, Admission>(`/admissions/${id}/transfer`, input);
}

export function addVitalsLog(id: string, input: AddVitalsLogInput) {
  return apiClient.post<never, unknown>(`/admissions/${id}/vitals`, input);
}

export function administerMedication(admissionId: string, orderId: string, status: AdministrationStatus, notes?: string) {
  return apiClient.patch<never, MedicationOrder>(`/admissions/${admissionId}/medications/${orderId}/administer`, { status, notes });
}

export function completeNurseChecklist(id: string) {
  return apiClient.patch<never, Admission>(`/admissions/${id}/discharge/nurse-checklist`);
}
