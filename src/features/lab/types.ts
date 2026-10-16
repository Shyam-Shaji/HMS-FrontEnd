export interface ResultParameter {
  name: string;
  value: string;
  unit?: string;
  referenceRangeLow?: number;
  referenceRangeHigh?: number;
  flag?: 'normal' | 'low' | 'high' | 'critical';
}

export type LabOrderStatus = 'ordered' | 'sample_collected' | 'in_progress' | 'completed' | 'cancelled';
export type LabOrderPriority = 'routine' | 'urgent' | 'stat';

interface UserRef {
  _id: string;
  name: string;
  department?: string;
}

export interface LabOrder {
  _id: string;
  appointmentId?: string | null;
  admissionId?: string | null;
  testNameSnapshot: string;
  priority: LabOrderPriority;
  status: LabOrderStatus;
  orderedAt: string;
  verifiedAt?: string;
  clinicalNotes?: string;
  // The backend populates the ordering doctor as `orderedBy`.
  orderedBy?: UserRef;
  patientId?: { _id: string; name: string; uhid: string; phone?: string } | string;
  resultParameters: ResultParameter[];
  reportFileUrl?: string;
  resultNotes?: string;
}

export interface LabTest {
  _id: string;
  name: string;
  category?: string;
  sampleType: string;
  resultType: 'structured' | 'report';
  price: number;
  turnaroundTimeHours: number;
}

export interface CreateLabOrderInput {
  testId: string;
  priority?: LabOrderPriority;
  clinicalNotes?: string;
}
