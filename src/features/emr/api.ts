import { apiClient } from "@/lib/api-client";
import type { MedicalRecordDetail, MedicalRecordSummary } from "./types";

export function fetchMyRecordHistory() {
  return apiClient.get<never, MedicalRecordSummary[]>('/emr/me/history');
}

export function fetchMyRecordByAppointment(appointmentId: string) {
  return apiClient.get<never, MedicalRecordDetail>(`/emr/me/visits/${appointmentId}`);
}
