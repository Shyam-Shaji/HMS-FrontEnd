import { apiClient } from "@/lib/api-client";
import type { MyPatientRecord, SelfRegisterPatientInput } from "./types";

export function fetchMyPatientRecords() {
  return apiClient.get<never, MyPatientRecord[]>('/patients/me');
}

export function selfRegisterPatient(input: SelfRegisterPatientInput) {
  return apiClient.post<never, MyPatientRecord>('/patients/me', input);
}

import type { Paginated } from "@/types/api";
import type { CreatePatientInput } from "./types";

export function searchPatients(params: { q?: string; page?: number; limit?: number }) {
  return apiClient.get<never, Paginated<MyPatientRecord>>('/patients', { params });
}

export function fetchPatientById(id: string) {
  return apiClient.get<never, MyPatientRecord>(`/patients/${id}`);
}

export function createPatient(input: CreatePatientInput) {
  return apiClient.post<never, MyPatientRecord>('/patients', input);
}
