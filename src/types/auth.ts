// Mirrors common/enums/role.enum.ts in hms-backend - keep these two files
// in sync by hand for now; a shared-types package is the natural fix once
// both repos are versioned together.
export const Role = {
  SUPER_ADMIN: 'super_admin',
  HOSPITAL_ADMIN: 'hospital_admin',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  RECEPTIONIST: 'receptionist',
  PHARMACIST: 'pharmacist',
  LAB_TECHNICIAN: 'lab_technician',
  BILLING_STAFF: 'billing_staff',
  PATIENT: 'patient',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const ROLE_LABELS: Record<Role, string> = {
  [Role.SUPER_ADMIN]: 'Super admin',
  [Role.HOSPITAL_ADMIN]: 'Hospital admin',
  [Role.DOCTOR]: 'Doctor',
  [Role.NURSE]: 'Nurse',
  [Role.RECEPTIONIST]: 'Receptionist',
  [Role.PHARMACIST]: 'Pharmacist',
  [Role.LAB_TECHNICIAN]: 'Lab technician',
  [Role.BILLING_STAFF]: 'Billing staff',
  [Role.PATIENT]: 'Patient',
};

export interface AuthUser {
  id: string;
  role: Role;
  hospitalId: string | null;
  name?: string;
  email?: string;
  phone?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: { id: string; role: Role; hospitalId: string | null };
}
