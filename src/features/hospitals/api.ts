import { apiClient } from "@/lib/api-client";
import type { HospitalDirectoryItem } from "./types";

export function fetchHospitalDirectory() {
  return apiClient.get<never, HospitalDirectoryItem[]>('/hospitals/directory');
}
