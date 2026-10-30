import type { Diagnosis, MedicalRecordDetail, UpdateClinicalInput } from '@/features/emr/types';

export { VITAL_FIELDS, emptyVitals, vitalsFromRecord, vitalsToInput } from '@/features/emr/vitals-form';
export type { VitalKey, VitalsForm } from '@/features/emr/vitals-form';

export interface ClinicalForm {
  chiefComplaint: string;
  diagnosis: { description: string; icd10Code: string }[];
  doctorNotes: string;
  followUpDate: string;
  referredTo: string;
}

export const emptyClinical = (): ClinicalForm => ({
  chiefComplaint: '',
  diagnosis: [],
  doctorNotes: '',
  followUpDate: '',
  referredTo: '',
});

export function clinicalFromRecord(r: MedicalRecordDetail | null): ClinicalForm {
  if (!r) return emptyClinical();
  return {
    chiefComplaint: r.chiefComplaint ?? '',
    diagnosis: r.diagnosis.map((d) => ({ description: d.description, icd10Code: d.icd10Code ?? '' })),
    doctorNotes: r.doctorNotes ?? '',
    followUpDate: r.followUpDate ? r.followUpDate.slice(0, 10) : '',
    referredTo: r.referredTo ?? '',
  };
}

export function clinicalToInput(form: ClinicalForm): UpdateClinicalInput {
  const diagnosis: Diagnosis[] = form.diagnosis
    .filter((d) => d.description.trim())
    .map((d) => ({ description: d.description.trim(), icd10Code: d.icd10Code.trim() || undefined }));
  return {
    chiefComplaint: form.chiefComplaint,
    diagnosis,
    doctorNotes: form.doctorNotes,
    followUpDate: form.followUpDate || undefined,
    referredTo: form.referredTo,
  };
}
