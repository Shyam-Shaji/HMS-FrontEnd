import { apiClient } from "@/lib/api-client";
import type { LabOrder } from "./types";

export function fetchMyLabReports() {
  return apiClient.get<never, LabOrder[]>('/lab/me');
}

export function fetchMyLabReportById(id: string) {
  return apiClient.get<never, LabOrder>(`/lab/me/${id}`);
}
