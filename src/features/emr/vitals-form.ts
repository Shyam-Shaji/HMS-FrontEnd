import type { MedicalRecordDetail, UpdateVitalsInput } from './types';

// Shared by the doctor's consultation screen and the nurse's OPD triage
// screen - both edit the same visit vitals, so they share one definition.
export const VITAL_FIELDS = [
  { key: 'temperatureC', label: 'Temp', unit: '°C' },
  { key: 'bloodPressureSystolic', label: 'BP sys', unit: 'mmHg' },
  { key: 'bloodPressureDiastolic', label: 'BP dia', unit: 'mmHg' },
  { key: 'pulseRate', label: 'Pulse', unit: 'bpm' },
  { key: 'respiratoryRate', label: 'Resp', unit: '/min' },
  { key: 'spo2', label: 'SpO₂', unit: '%' },
  { key: 'heightCm', label: 'Height', unit: 'cm' },
  { key: 'weightKg', label: 'Weight', unit: 'kg' },
] as const;

export type VitalKey = (typeof VITAL_FIELDS)[number]['key'];
export type VitalsForm = Record<VitalKey, string>;

export const emptyVitals = (): VitalsForm => Object.fromEntries(VITAL_FIELDS.map((f) => [f.key, ''])) as VitalsForm;

export function vitalsFromRecord(r: MedicalRecordDetail | null): VitalsForm {
  const form = emptyVitals();
  if (!r) return form;
  for (const f of VITAL_FIELDS) {
    const v = r.vitals[f.key];
    if (v != null) form[f.key] = String(v);
  }
  return form;
}

// Blank fields are omitted rather than sent as 0 - a missing vital must
// never be recorded as a reading of zero.
export function vitalsToInput(form: VitalsForm): UpdateVitalsInput {
  const out: UpdateVitalsInput = {};
  for (const f of VITAL_FIELDS) {
    if (form[f.key].trim() !== '') out[f.key] = Number(form[f.key]);
  }
  return out;
}
