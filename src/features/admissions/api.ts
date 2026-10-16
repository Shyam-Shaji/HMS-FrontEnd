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
