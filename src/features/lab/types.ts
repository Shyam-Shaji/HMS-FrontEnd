export interface ResultParameter {
  name: string;
  value: string;
  unit?: string;
  referenceRangeLow?: number;
  referenceRangeHigh?: number;
  flag?: 'normal' | 'low' | 'high' | 'critical';
}

export type LabOrderStatus = 'ordered' | 'sample_collected' | 'in_progress' | 'completed' | 'cancelled';

export interface LabOrder {
  _id: string;
  testNameSnapshot: string;
  priority: 'routine' | 'urgent' | 'stat';
  status: LabOrderStatus;
  orderedAt: string;
  verifiedAt?: string;
  doctorId?: { _id: string; name: string; department?: string };
  resultParameters: ResultParameter[];
  reportFileUrl?: string;
  resultNotes?: string;
}
