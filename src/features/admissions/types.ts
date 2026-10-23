interface UserRef {
  _id: string;
  name: string;
  department?: string;
}

export interface Admission {
  _id: string;
  patientId: { _id: string; name: string; uhid: string; phone?: string; dob?: string; gender?: string; allergies?: string[] } | string;
  admittingDoctorId: UserRef | string;
  wardId: { _id: string; name: string; type: string } | string;
  bedId: { _id: string; bedNumber: string } | string;
  admissionType: 'emergency' | 'planned';
  reasonForAdmission?: string;
  provisionalDiagnosis?: string;
  admissionDate: string;
  status: 'admitted' | 'discharged';
  dischargeDate?: string;
  dischargeSummary?: { nurseChecklistCompleted?: boolean; followUpInstructions?: string };
}

export interface VitalsLogEntry {
  _id: string;
  recordedAt: string;
  temperatureC?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  pulseRate?: number;
  respiratoryRate?: number;
  spo2?: number;
  notes?: string;
}

export interface RoundNote {
  _id: string;
  note: string;
  createdAt: string;
  doctorId?: { _id: string; name: string };
}

export interface MedicationAdministration {
  administeredAt: string;
  status: 'administered' | 'missed' | 'held';
  notes?: string;
}

export interface MedicationOrder {
  _id: string;
  medicineName: string;
  dosage: string;
  route: string;
  frequency: string;
  createdAt: string;
  administrations: MedicationAdministration[];
}

export interface CreateMedicationOrderInput {
  medicineName: string;
  dosage: string;
  route: string;
  frequency: string;
}

export interface DischargeInput {
  finalDiagnosis?: string;
  summary?: string;
  followUpInstructions?: string;
}

export interface AdmitPatientInput {
  patientId: string;
  wardId: string;
  bedId: string;
  admissionType: 'emergency' | 'planned';
  admittingDoctorId: string;
  reasonForAdmission?: string;
  provisionalDiagnosis?: string;
}

export interface TransferInput {
  toWardId: string;
  toBedId: string;
  reason?: string;
}

export interface AddVitalsLogInput {
  temperatureC?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  pulseRate?: number;
  respiratoryRate?: number;
  spo2?: number;
  notes?: string;
}

export type AdministrationStatus = 'administered' | 'missed' | 'held';
