import { apiClient } from "@/lib/api-client";
import type { Prescription } from "./types";

export function fetchMyPrescriptions() {
  return apiClient.get<never, Prescription[]>('/prescriptions/me');
}

export function fetchMyPrescriptionById(id: string) {
  return apiClient.get<never, Prescription>(`/prescriptions/me/${id}`);
}

import type { CreatePrescriptionInput } from "./types";

export function createPrescription(appointmentId: string, input: CreatePrescriptionInput) {
  return apiClient.post<never, Prescription>(`/emr/visits/${appointmentId}/prescriptions`, input);
}

export function fetchVisitPrescriptions(appointmentId: string) {
  return apiClient.get<never, Prescription[]>(`/emr/visits/${appointmentId}/prescriptions`);
}
