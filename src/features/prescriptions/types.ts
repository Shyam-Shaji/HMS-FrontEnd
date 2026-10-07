export interface PrescribedMedicine {
  lineId: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity?: number;
  quantityDispensed: number;
}

export type DispenseStatus = 'not_dispensed' | 'partially_dispensed' | 'fully_dispensed';

export interface Prescription {
  _id: string;
  doctorId?: { _id: string; name: string; department?: string };
  medicines: PrescribedMedicine[];
  notes?: string;
  status: 'active' | 'cancelled';
  dispenseStatus: DispenseStatus;
  createdAt: string;
}
