export type AppointmentStatus =
  | 'booked'
  | 'checked_in'
  | 'in_consultation'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type AppointmentType = 'in_person' | 'video';

export interface PopulatedRef {
  _id: string;
  name: string;
  department?: string;
  uhid?: string;
  phone?: string;
}

export interface Appointment {
  _id: string;
  hospitalId: string;
  patientId: PopulatedRef | string;
  doctorId: PopulatedRef | string;
  scheduledDate: string;
  scheduledTime: string;
  scheduledAt: string;
  tokenNumber: number;
  status: AppointmentStatus;
  type: AppointmentType;
  reason?: string;
  cancelReason?: string;
  createdAt: string;
}

export interface BookAppointmentInput {
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  type?: AppointmentType;
  reason?: string;
}

export interface RescheduleAppointmentInput {
  date: string;
  time: string;
}

export interface QueueSnapshot {
  date: string;
  nowServingToken: number | null;
  waitingCount: number;
  queue: Appointment[];
}
