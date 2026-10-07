import { apiClient } from "@/lib/api-client";
import type { MyPatientRecord, SelfRegisterPatientInput } from "./types";

export function fetchMyPatientRecords() {
  return apiClient.get<never, MyPatientRecord[]>('/patients/me');
}

export function selfRegisterPatient(input: SelfRegisterPatientInput) {
  return apiClient.post<never, MyPatientRecord>('/patients/me', input);
}
