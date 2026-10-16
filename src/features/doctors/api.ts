import { apiClient } from "@/lib/api-client";
import type { DoctorDirectoryItem, SlotResult } from "./types";

export function searchDoctors(params: { hospitalId: string; department?: string; q?: string }) {
  return apiClient.get<never, DoctorDirectoryItem[]>('/doctors', { params });
}

export function fetchDoctorSlots(doctorId: string, date: string) {
  return apiClient.get<never, SlotResult[]>(`/doctors/${doctorId}/slots`, { params: { date } });
}

import type { AvailabilityBlock, CreateLeaveInput, DoctorLeave } from './types';

export function fetchAvailability(doctorId: string) {
  return apiClient.get<never, AvailabilityBlock[]>(`/doctors/${doctorId}/availability`);
}

// Replaces the doctor's whole weekly schedule in one call.
export function saveAvailability(doctorId: string, blocks: AvailabilityBlock[]) {
  return apiClient.post<never, AvailabilityBlock[]>(`/doctors/${doctorId}/availability`, { blocks });
}

export function fetchLeave(doctorId: string) {
  return apiClient.get<never, DoctorLeave[]>(`/doctors/${doctorId}/leave`);
}

export function createLeave(doctorId: string, input: CreateLeaveInput) {
  return apiClient.post<never, DoctorLeave>(`/doctors/${doctorId}/leave`, input);
}
