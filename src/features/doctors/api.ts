import { apiClient } from "@/lib/api-client";
import type { DoctorDirectoryItem, SlotResult } from "./types";

export function searchDoctors(params: { hospitalId: string; department?: string; q?: string }) {
  return apiClient.get<never, DoctorDirectoryItem[]>('/doctors', { params });
}

export function fetchDoctorSlots(doctorId: string, date: string) {
  return apiClient.get<never, SlotResult[]>(`/doctors/${doctorId}/slots`, { params: { date } });
}
