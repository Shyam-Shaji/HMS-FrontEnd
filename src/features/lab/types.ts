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
  sampleCollectedAt?: string;
  clinicalNotes?: string;
  // The backend populates the ordering doctor as `orderedBy`.
  orderedBy?: UserRef;
  patientId?: { _id: string; name: string; uhid: string; phone?: string; dob?: string; gender?: string } | string;
  resultParameters: ResultParameter[];
  reportFileUrl?: string;
  // Set when a PDF/image has been uploaded. The file itself is only
  // reachable through the authenticated download routes.
  reportFileMime?: string;
  reportFileSize?: number;
  resultNotes?: string;
  // Populated on the single-order endpoint only.
  testId?: { _id: string; name: string; category?: string; sampleType?: string; resultType: 'structured' | 'report'; parameters: ParameterDefinition[] } | string;
}

export interface ParameterDefinition {
  name: string;
  unit: string;
  referenceRangeLow?: number;
  referenceRangeHigh?: number;
}

export interface LabTest {
  _id: string;
  name: string;
  category?: string;
  sampleType: string;
  resultType: 'structured' | 'report';
  price: number;
  turnaroundTimeHours: number;
  isActive?: boolean;
  code?: string;
  parameters?: ParameterDefinition[];
}

export interface CreateLabOrderInput {
  testId: string;
  priority?: LabOrderPriority;
  clinicalNotes?: string;
}

export interface ResultParameterInput {
  name: string;
  value: string;
  unit?: string;
  referenceRangeLow?: number;
  referenceRangeHigh?: number;
  flag?: 'normal' | 'low' | 'high' | 'critical';
}

export interface SaveLabTestInput {
  name: string;
  code?: string;
  category?: string;
  sampleType: string;
  resultType: 'structured' | 'report';
  parameters?: ParameterDefinition[];
  price?: number;
  turnaroundTimeHours?: number;
  isActive?: boolean;
}
