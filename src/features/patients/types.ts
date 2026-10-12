export type Gender = 'male' | 'female' | 'other';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown';

export interface EmergencyContact {
  name: string;
  phone: string;
  relation?: string;
}

export interface MyPatientRecord {
  _id: string;
  hospitalId: string;
  uhid: string;
  name: string;
  dob: string;
  gender: Gender;
  bloodGroup: BloodGroup;
  phone: string;
  email?: string;
  address?: string;
  emergencyContact?: EmergencyContact;
  allergies: string[];
  chronicConditions: string[];
  isActive: boolean;
}

export interface SelfRegisterPatientInput {
  hospitalId: string;
  name: string;
  dob: string;
  gender: Gender;
  phone: string;
  email?: string;
  address?: string;
}

// Staff-facing registration (reception/nurse/doctor) - richer than the
// patient's own self-registration: allergies are captured here because
// they feed the always-visible allergy banner on clinical screens.
export interface CreatePatientInput {
  name: string;
  dob: string;
  gender: Gender;
  phone: string;
  email?: string;
  address?: string;
  bloodGroup?: BloodGroup;
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContact?: EmergencyContact;
}
