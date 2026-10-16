export interface DoctorDirectoryItem {
  _id: string;
  name: string;
  department?: string;
}

export interface SlotResult {
  time: string; // "HH:mm"
  available: boolean;
}

export interface AvailabilityBlock {
  dayOfWeek: number; // 0 = Sunday
  startTime: string; // "HH:mm"
  endTime: string;
  slotDurationMinutes: number;
}

export interface DoctorLeave {
  _id: string;
  date: string;
  fromTime?: string;
  toTime?: string;
  reason?: string;
}

export interface CreateLeaveInput {
  date: string;
  fromTime?: string;
  toTime?: string;
  reason?: string;
}
