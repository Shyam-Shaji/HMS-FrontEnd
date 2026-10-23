import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRightLeft, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AllergyBanner } from "@/components/clinical/AllergyBanner";
import { addVitalsLog, completeNurseChecklist, fetchAdmission, fetchMedicationOrders, fetchVitalsLogs } from "@/features/admissions/api";
import { TransferDialog } from "@/features/admissions/TransferDialog";
import type { AddVitalsLogInput } from "@/features/admissions/types";
import { getErrorMessage } from "@/lib/api-client";
import { ageFromDob, formatDate, formatDateTime } from "@/lib/format";

const FIELDS: { key: keyof Omit<AddVitalsLogInput, 'notes'>; label: string; unit: string }[] = [
  { key: 'temperatureC', label: 'Temp', unit: '°C' },
  { key: 'bloodPressureSystolic', label: 'BP sys', unit: 'mmHg' },
  { key: 'bloodPressureDiastolic', label: 'BP dia', unit: 'mmHg' },
  { key: 'pulseRate', label: 'Pulse', unit: 'bpm' },
  { key: 'respiratoryRate', label: 'Resp', unit: '/min' },
  { key: 'spo2', label: 'SpO₂', unit: '%' },
];

export function NurseAdmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const admissionId = id!;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showTransfer, setShowTransfer] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');

  const { data: admission, isLoading } = useQuery({ queryKey: ['admissions', admissionId], queryFn: () => fetchAdmission(admissionId) });
  const { data: logs } = useQuery({ queryKey: ['admissions', admissionId, 'vitals'], queryFn: () => fetchVitalsLogs(admissionId) });
  const { data: meds } = useQuery({ queryKey: ['admissions', admissionId, 'meds'], queryFn: () => fetchMedicationOrders(admissionId) });

  const hasReading = FIELDS.some((f) => (form[f.key] ?? '').trim() !== '');

  const chart = useMutation({
    mutationFn: () => {
      const input: AddVitalsLogInput = { notes: notes || undefined };
      // Blank fields are omitted, never sent as 0.
      for (const f of FIELDS) if ((form[f.key] ?? '').trim() !== '') input[f.key] = Number(form[f.key]);
      return addVitalsLog(admissionId, input);
    },
    onSuccess: () => {
      toast.success('Vitals charted');
      setForm({});
      setNotes('');
      queryClient.invalidateQueries({ queryKey: ['admissions', admissionId, 'vitals'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const checklist = useMutation({
    mutationFn: () => completeNurseChecklist(admissionId),
    onSuccess: () => {
      toast.success('Discharge checklist completed');
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!admission) return <p className="text-sm text-muted-foreground">Admission not found.</p>;

  const patient = typeof admission.patientId === 'object' ? admission.patientId : null;
  const ward = typeof admission.wardId === 'object' ? admission.wardId : null;
  const bed = typeof admission.bedId === 'object' ? admission.bedId : null;
  const discharged = admission.status === 'discharged';
  const doctor = typeof admission.admittingDoctorId === 'object' ? admission.admittingDoctorId : null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/nurse/admissions')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{patient?.name}</h1>
            <p className="text-sm text-muted-foreground">
              {patient?.uhid} · {ageFromDob(patient?.dob)} · {ward?.name}, Bed {bed?.bedNumber}
              {doctor ? ` · Dr. ${doctor.name}` : ''} · Admitted {formatDate(admission.admissionDate)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!discharged && (
            <Button variant="outline" onClick={() => setShowTransfer(true)}>
              <ArrowRightLeft className="h-4 w-4" /> Transfer
            </Button>
          )}
          {discharged && !admission.dischargeSummary?.nurseChecklistCompleted && (
            <Button disabled={checklist.isPending} onClick={() => checklist.mutate()}>
              Complete discharge checklist
            </Button>
          )}
        </div>
      </div>

      <AllergyBanner allergies={patient?.allergies ?? []} className="mb-4" />

      <div className="grid gap-4 lg:grid-cols-2">
        {!discharged && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chart vitals</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid grid-cols-3 gap-3">
                {FIELDS.map((f) => (
                  <div key={f.key} className="grid gap-1.5">
                    <Label htmlFor={`iv-${f.key}`} className="text-xs text-muted-foreground">
                      {f.label} ({f.unit})
                    </Label>
                    <Input
                      id={`iv-${f.key}`}
                      type="number"
                      step="any"
                      inputMode="decimal"
                      value={form[f.key] ?? ''}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
              <Input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
              <Button className="w-fit" disabled={!hasReading || chart.isPending} onClick={() => chart.mutate()}>
                {chart.isPending ? 'Saving…' : 'Save vitals'}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              Medication
              <Link to={`/nurse/medications?admission=${admissionId}`}>
                <Button size="sm" variant="outline">
                  <Pill className="h-4 w-4" /> Open MAR
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {(meds ?? []).length === 0 ? (
              <p className="text-muted-foreground">No standing orders.</p>
            ) : (
              meds!.map((m) => (
                <div key={m._id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span>
                    <span className="font-medium">{m.medicineName}</span>
                    <span className="ml-2 text-muted-foreground">
                      {m.dosage} · {m.route} · {m.frequency}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">{m.administrations.length} charted</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Vitals chart</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {(logs ?? []).length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Nothing charted yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="p-3 font-medium">Time</th>
                      <th className="p-3 font-medium">Temp</th>
                      <th className="p-3 font-medium">BP</th>
                      <th className="p-3 font-medium">Pulse</th>
                      <th className="p-3 font-medium">Resp</th>
                      <th className="p-3 font-medium">SpO₂</th>
                      <th className="p-3 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs!.map((v) => (
                      <tr key={v._id} className="border-t">
                        <td className="p-3 text-muted-foreground">{formatDateTime(v.recordedAt)}</td>
                        <td className="p-3">{v.temperatureC ?? '—'}</td>
                        <td className="p-3">{v.bloodPressureSystolic != null ? `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic ?? '—'}` : '—'}</td>
                        <td className="p-3">{v.pulseRate ?? '—'}</td>
                        <td className="p-3">{v.respiratoryRate ?? '—'}</td>
                        <td className="p-3">{v.spo2 ?? '—'}</td>
                        <td className="p-3 text-muted-foreground">{v.notes ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <TransferDialog open={showTransfer} onOpenChange={setShowTransfer} admissionId={admissionId} patientName={patient?.name} />
    </div>
  );
}
