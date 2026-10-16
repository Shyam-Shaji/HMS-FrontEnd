import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AllergyBanner } from '@/components/clinical/AllergyBanner';
import {
  addRoundNote,
  createMedicationOrder,
  dischargeAdmission,
  fetchAdmission,
  fetchMedicationOrders,
  fetchRoundNotes,
  fetchVitalsLogs,
} from '@/features/admissions/api';
import { LabOrderPanel } from '@/features/lab/LabOrderPanel';
import { orderLabFromAdmission, searchLabOrders } from '@/features/lab/api';
import { getErrorMessage } from '@/lib/api-client';
import { ageFromDob, formatDate, formatDateTime, humanizeStatus } from '@/lib/format';

export function RoundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const admissionId = id!;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: admission, isLoading } = useQuery({
    queryKey: ['admissions', admissionId],
    queryFn: () => fetchAdmission(admissionId),
  });
  const { data: notes } = useQuery({ queryKey: ['admissions', admissionId, 'rounds'], queryFn: () => fetchRoundNotes(admissionId) });
  const { data: vitals } = useQuery({ queryKey: ['admissions', admissionId, 'vitals'], queryFn: () => fetchVitalsLogs(admissionId) });
  const { data: meds } = useQuery({ queryKey: ['admissions', admissionId, 'meds'], queryFn: () => fetchMedicationOrders(admissionId) });

  const patient = admission && typeof admission.patientId === 'object' ? admission.patientId : null;
  const patientId = patient?._id;
  const { data: labOrders } = useQuery({
    queryKey: ['lab', 'orders', 'admission', admissionId],
    queryFn: async () => (await searchLabOrders({ patientId, limit: 50 })).items.filter((o) => o.admissionId === admissionId),
    enabled: !!patientId,
  });

  const discharged = admission?.status === 'discharged';

  // ---- round note ----
  const [note, setNote] = useState('');
  const noteMut = useMutation({
    mutationFn: () => addRoundNote(admissionId, note),
    onSuccess: () => {
      toast.success('Note added');
      setNote('');
      queryClient.invalidateQueries({ queryKey: ['admissions', admissionId, 'rounds'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  // ---- medication order ----
  const [med, setMed] = useState({ medicineName: '', dosage: '', route: '', frequency: '' });
  const medMut = useMutation({
    mutationFn: () => createMedicationOrder(admissionId, med),
    onSuccess: () => {
      toast.success('Medication ordered');
      setMed({ medicineName: '', dosage: '', route: '', frequency: '' });
      queryClient.invalidateQueries({ queryKey: ['admissions', admissionId, 'meds'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  const medReady = Object.values(med).every((v) => v.trim());

  // ---- discharge ----
  const [showDischarge, setShowDischarge] = useState(false);
  const [dc, setDc] = useState({ finalDiagnosis: '', summary: '', followUpInstructions: '' });
  const dischargeMut = useMutation({
    mutationFn: () =>
      dischargeAdmission(admissionId, {
        finalDiagnosis: dc.finalDiagnosis || undefined,
        summary: dc.summary || undefined,
        followUpInstructions: dc.followUpInstructions || undefined,
      }),
    onSuccess: () => {
      toast.success('Patient discharged');
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      navigate('/doctor/rounds');
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

  const ward = typeof admission.wardId === 'object' ? admission.wardId : null;
  const bed = typeof admission.bedId === 'object' ? admission.bedId : null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/doctor/rounds')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{patient?.name}</h1>
            <p className="text-sm text-muted-foreground">
              {patient?.uhid} · {ageFromDob(patient?.dob)} · {ward?.name}, Bed {bed?.bedNumber} · Admitted {formatDate(admission.admissionDate)}
            </p>
          </div>
        </div>
        {discharged ? (
          <Badge variant="secondary">Discharged</Badge>
        ) : (
          <Button variant="outline" onClick={() => setShowDischarge(true)}>
            <LogOut className="h-4 w-4" /> Discharge
          </Button>
        )}
      </div>

      <AllergyBanner allergies={patient?.allergies ?? []} className="mb-4" />

      {(admission.provisionalDiagnosis || admission.reasonForAdmission) && (
        <p className="mb-4 text-sm text-muted-foreground">
          {admission.provisionalDiagnosis || admission.reasonForAdmission}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid content-start gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Round notes</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {!discharged && (
                <>
                  <Textarea rows={3} placeholder="Today's findings, plan…" value={note} onChange={(e) => setNote(e.target.value)} />
                  <Button className="w-fit" disabled={!note.trim() || noteMut.isPending} onClick={() => noteMut.mutate()}>
                    Add note
                  </Button>
                </>
              )}
              {(notes ?? []).map((n) => (
                <div key={n._id} className="border-t pt-3 text-sm">
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(n.createdAt)}
                    {n.doctorId ? ` · Dr. ${n.doctorId.name}` : ''}
                  </p>
                  <p className="whitespace-pre-wrap">{n.note}</p>
                </div>
              ))}
              {(notes ?? []).length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vitals (nursing chart)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {(vitals ?? []).length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No vitals charted yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground">
                        <th className="p-3 font-medium">Time</th>
                        <th className="p-3 font-medium">Temp</th>
                        <th className="p-3 font-medium">BP</th>
                        <th className="p-3 font-medium">Pulse</th>
                        <th className="p-3 font-medium">SpO₂</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vitals!.slice(0, 10).map((v) => (
                        <tr key={v._id} className="border-t">
                          <td className="p-3 text-muted-foreground">{formatDateTime(v.recordedAt)}</td>
                          <td className="p-3">{v.temperatureC ?? '—'}</td>
                          <td className="p-3">
                            {v.bloodPressureSystolic != null ? `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic ?? '—'}` : '—'}
                          </td>
                          <td className="p-3">{v.pulseRate ?? '—'}</td>
                          <td className="p-3">{v.spo2 ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid content-start gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Medication orders</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {(meds ?? []).map((m) => {
                const last = m.administrations[m.administrations.length - 1];
                return (
                  <div key={m._id} className="rounded-md border px-3 py-2 text-sm">
                    <p className="font-medium">{m.medicineName}</p>
                    <p className="text-muted-foreground">
                      {m.dosage} · {m.route} · {m.frequency}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {m.administrations.length} dose{m.administrations.length === 1 ? '' : 's'} charted
                      {last ? ` · last ${humanizeStatus(last.status).toLowerCase()} ${formatDateTime(last.administeredAt)}` : ''}
                    </p>
                  </div>
                );
              })}
              {(meds ?? []).length === 0 && <p className="text-sm text-muted-foreground">No standing orders.</p>}

              {!discharged && (
                <div className="grid gap-2 border-t pt-3">
                  <Input placeholder="Medicine" value={med.medicineName} onChange={(e) => setMed({ ...med, medicineName: e.target.value })} />
                  <div className="grid grid-cols-3 gap-2">
                    <Input placeholder="Dosage" value={med.dosage} onChange={(e) => setMed({ ...med, dosage: e.target.value })} />
                    <Input placeholder="Route (IV)" value={med.route} onChange={(e) => setMed({ ...med, route: e.target.value })} />
                    <Input placeholder="Every 8h" value={med.frequency} onChange={(e) => setMed({ ...med, frequency: e.target.value })} />
                  </div>
                  <Button className="w-fit" disabled={!medReady || medMut.isPending} onClick={() => medMut.mutate()}>
                    Order medication
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <LabOrderPanel
            existingOrders={labOrders ?? []}
            onOrder={(input) => orderLabFromAdmission(admissionId, input)}
            invalidateKey={['lab', 'orders', 'admission', admissionId]}
            disabled={discharged}
          />
        </div>
      </div>

      <Dialog open={showDischarge} onOpenChange={setShowDischarge}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Discharge {patient?.name}?</DialogTitle>
            <DialogDescription>The patient gets their discharge summary, and the bed is released for cleaning.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="dc-dx">Final diagnosis</Label>
              <Input id="dc-dx" value={dc.finalDiagnosis} onChange={(e) => setDc({ ...dc, finalDiagnosis: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="dc-sum">Summary of stay</Label>
              <Textarea id="dc-sum" rows={4} value={dc.summary} onChange={(e) => setDc({ ...dc, summary: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="dc-fu">Follow-up instructions</Label>
              <Textarea id="dc-fu" rows={3} value={dc.followUpInstructions} onChange={(e) => setDc({ ...dc, followUpInstructions: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDischarge(false)}>
              Cancel
            </Button>
            <Button disabled={dischargeMut.isPending} onClick={() => dischargeMut.mutate()}>
              {dischargeMut.isPending ? 'Discharging…' : 'Discharge patient'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
