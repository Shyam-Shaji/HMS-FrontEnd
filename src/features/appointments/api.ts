import { apiClient } from "@/lib/api-client";
import type { Appointment, BookAppointmentInput, QueueSnapshot, RescheduleAppointmentInput } from "./types";

export function fetchMyAppointments() {
  return apiClient.get<never, Appointment[]>('/appointments/me');
}

export function bookMyAppointment(input: BookAppointmentInput) {
  return apiClient.post<never, Appointment>('/appointments/me', input);
}

export function cancelMyAppointment(id: string, reason?: string) {
  return apiClient.patch<never, Appointment>(`/appointments/me/${id}/cancel`, { reason });
}

export function rescheduleMyAppointment(id: string, input: RescheduleAppointmentInput) {
  return apiClient.patch<never, Appointment>(`/appointments/me/${id}/reschedule`, input);
}

export function fetchQueueSnapshot(doctorId: string, date: string) {
  return apiClient.get<never, QueueSnapshot>(`/appointments/queue/${doctorId}`, { params: { date } });
}
