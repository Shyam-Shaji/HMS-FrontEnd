import { apiClient } from '@/lib/api-client';

export interface MedicineCatalogItem {
  _id: string;
  name: string;
  genericName?: string;
  unit: string;
}

export function searchMedicines(q?: string) {
  return apiClient.get<never, MedicineCatalogItem[]>('/pharmacy/medicines', { params: { q: q || undefined } });
}
