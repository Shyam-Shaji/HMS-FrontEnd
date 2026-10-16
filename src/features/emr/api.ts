import { apiClient } from "@/lib/api-client";
import type { MedicalRecordDetail, MedicalRecordSummary } from "./types";

export function fetchMyRecordHistory() {
  return apiClient.get<never, MedicalRecordSummary[]>('/emr/me/history');
}

export function fetchMyRecordByAppointment(appointmentId: string) {
  return apiClient.get<never, MedicalRecordDetail>(`/emr/me/visits/${appointmentId}`);
}

import type { Paginated } from "@/types/api";
import type { ApiError } from "@/types/api";
import type { PatientSummary, UpdateClinicalInput, UpdateVitalsInput } from "./types";

// The backend answers 404 until someone (nurse vitals or doctor notes)
// creates the visit's draft record - that's a normal "nothing yet" state
// for the consultation screen, not an error to show.
export async function fetchVisitRecord(appointmentId: string): Promise<MedicalRecordDetail | null> {
  try {
    return await apiClient.get<never, MedicalRecordDetail>(`/emr/visits/${appointmentId}`);
  } catch (err) {
    if ((err as ApiError).statusCode === 404) return null;
    throw err;
  }
}

export function updateVisitVitals(appointmentId: string, input: UpdateVitalsInput) {
  return apiClient.patch<never, MedicalRecordDetail>(`/emr/visits/${appointmentId}/vitals`, input);
}

export function updateVisitClinical(appointmentId: string, input: UpdateClinicalInput) {
  return apiClient.patch<never, MedicalRecordDetail>(`/emr/visits/${appointmentId}`, input);
}

export function finalizeVisitRecord(appointmentId: string) {
  return apiClient.patch<never, MedicalRecordDetail>(`/emr/visits/${appointmentId}/finalize`);
}

export function fetchPatientSummary(patientId: string) {
  return apiClient.get<never, PatientSummary>(`/emr/patients/${patientId}/summary`);
}

export function fetchPatientHistory(patientId: string, limit = 5) {
  return apiClient.get<never, Paginated<MedicalRecordSummary>>(`/emr/patients/${patientId}/history`, {
    params: { limit },
  });
}
