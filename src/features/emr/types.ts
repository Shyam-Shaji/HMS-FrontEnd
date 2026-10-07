export interface Diagnosis {
  description: string;
  icd10Code?: string;
}

export interface Vitals {
  heightCm?: number;
  weightKg?: number;
  temperatureC?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  pulseRate?: number;
  respiratoryRate?: number;
  spo2?: number;
  recordedAt?: string;
}

export interface MedicalRecordSummary {
  _id: string;
  appointmentId: string;
  visitDate: string;
  chiefComplaint?: string;
  diagnosis: Diagnosis[];
  doctorId?: { _id: string; name: string; department?: string };
}

export interface MedicalRecordDetail extends MedicalRecordSummary {
  vitals: Vitals;
  doctorNotes?: string;
  followUpDate?: string;
  referredTo?: string;
  status: 'draft' | 'finalized';
}