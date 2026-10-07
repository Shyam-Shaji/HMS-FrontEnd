import { apiClient } from "@/lib/api-client";
import type { Prescription } from "./types";

export function fetchMyPrescriptions() {
  return apiClient.get<never, Prescription[]>('/prescriptions/me');
}

export function fetchMyPrescriptionById(id: string) {
  return apiClient.get<never, Prescription>(`/prescriptions/me/${id}`);
}
