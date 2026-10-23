import { apiClient } from '@/lib/api-client';
import type { Bed, BedStatus, WardBoardEntry } from './types';

export function fetchWardBoard() {
  return apiClient.get<never, WardBoardEntry[]>('/beds/board');
}

export function updateBedStatus(bedId: string, status: BedStatus) {
  return apiClient.patch<never, Bed>(`/beds/${bedId}/status`, { status });
}
