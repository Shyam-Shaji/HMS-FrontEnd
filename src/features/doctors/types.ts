export interface DoctorDirectoryItem {
  _id: string;
  name: string;
  department?: string;
}

export interface SlotResult {
  time: string; // "HH:mm"
  available: boolean;
}
