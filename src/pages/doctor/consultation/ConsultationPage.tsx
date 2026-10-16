import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, Lock, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AllergyBanner } from '@/components/clinical/AllergyBanner';
import { completeConsultation, fetchAppointment, startConsultation } from '@/features/appointments/api';
import { AppointmentStatusBadge } from '@/features/appointments/staff-components';
import {
  fetchPatientSummary,
  fetchVisitRecord,
  finalizeVisitRecord,
  updateVisitClinical,
  updateVisitVitals,
} from '@/features/emr/api';
import { LabOrderPanel } from '@/features/lab/LabOrderPanel';
import { orderLabFromAppointment, searchLabOrders } from '@/features/lab/api';
import { getErrorMessage } from '@/lib/api-client';
import { ageFromDob, formatTime12h } from '@/lib/format';
import {
  clinicalFromRecord,
  clinicalToInput,
  emptyClinical,
  emptyVitals,
  vitalsFromRecord,
  vitalsToInput,
  type ClinicalForm,
  type VitalsForm,
} from './forms';
import { VitalsSection } from './VitalsSection';
import { ClinicalSection } from './ClinicalSection';
import { PrescriptionPad } from './PrescriptionPad';
import { PatientContextPanel } from './PatientContextPanel';

// The single-pane consultation view: everything a doctor needs for one
// patient on one screen, so nothing needs a tab-switch mid-consultation.
export function ConsultationPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const id = appointmentId!;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [vitals, setVitals] = useState<VitalsForm>(emptyVitals());
  const [clinical, setClinical] = useState<ClinicalForm>(emptyClinical());
  const [vitalsDirty, setVitalsDirty] = useState(false);
  const [showFinish, setShowFinish] = useState(false);

  const { data: appt, isLoading: loadingAppt } = useQuery({
    queryKey: ['appointments', 'detail', id],
    queryFn: () => fetchAppointment(id),
  });
  const patientId = appt ? (typeof appt.patientId === 'object' ? appt.patientId._id : appt.patientId) : undefined;
  const patient = appt && typeof appt.patientId === 'object' ? appt.patientId : null;

  const { data: summary } = useQuery({
    queryKey: ['emr', 'summary', patientId],
    queryFn: () => fetchPatientSummary(patientId!),
    enabled: !!patientId,
  });

  const { data: record, isFetched: recordFetched } = useQuery({
    queryKey: ['emr', 'visit', id],
    queryFn: () => fetchVisitRecord(id),
  });

  const { data: labOrders } = useQuery({
    queryKey: ['lab', 'orders', 'visit', id],
    queryFn: async () => {
      const res = await searchLabOrders({ patientId, limit: 50 });
      return res.items.filter((o) => o.appointmentId === id);
    },
    enabled: !!patientId,
  });

  // Seed the editable forms from the saved record exactly once, after it
  // has loaded - re-seeding on every refetch would overwrite what the
  // doctor is in the middle of typing.
  const seeded = useRef(false);
  useEffect(() => {
    if (recordFetched && !seeded.current) {
      setVitals(vitalsFromRecord(record ?? null));
      setClinical(clinicalFromRecord(record ?? null));
      seeded.current = true;
    }
  }, [recordFetched, record]);

  const locked = record?.status === 'finalized';
  const invalidateVisit = () => {
    queryClient.invalidateQueries({ queryKey: ['emr', 'visit', id] });
    queryClient.invalidateQueries({ queryKey: ['appointments'] });
  };

  const start = useMutation({
    mutationFn: () => startConsultation(id),
    onSuccess: () => {
      toast.success('Consultation started');
      invalidateVisit();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  async function saveAll() {
    if (locked) return;
    if (vitalsDirty) {
      await updateVisitVitals(id, vitalsToInput(vitals));
      setVitalsDirty(false);
    }
    await updateVisitClinical(id, clinicalToInput(clinical));
  }

  const saveDraft = useMutation({
    mutationFn: saveAll,
    onSuccess: () => {
      toast.success('Draft saved');
      invalidateVisit();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  // "Mark complete → next patient" in one action: save, lock the record,
  // close the visit. Each step only runs if it hasn't already happened,
  // so retrying after a partial failure is safe.
  const finish = useMutation({
    mutationFn: async () => {
      await saveAll();
      if (!locked) await finalizeVisitRecord(id);
      if (appt?.status === 'in_consultation') await completeConsultation(id);
    },
    onSuccess: () => {
      toast.success('Consultation completed');
      invalidateVisit();
      navigate('/doctor/queue');
    },
    onError: (e) => {
      toast.error(getErrorMessage(e));
      invalidateVisit();
    },
  });

  if (loadingAppt) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!appt || !patientId) return <p className="text-sm text-muted-foreground">Appointment not found.</p>;

  const canStart = appt.status === 'checked_in';
  const inConsultation = appt.status === 'in_consultation';
  const notArrived = appt.status === 'booked';
  const closed = appt.status === 'completed' || appt.status === 'cancelled' || appt.status === 'no_show';

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/doctor/queue')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{patient?.name}</h1>
            <p className="text-sm text-muted-foreground">
              {patient?.uhid}
              {summary ? ` · ${ageFromDob(summary.dob)} · ${summary.gender}` : ''}
              {summary && summary.bloodGroup !== 'unknown' ? ` · ${summary.bloodGroup}` : ''}
              {' · '}Token #{appt.tokenNumber} · {formatTime12h(appt.scheduledTime)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AppointmentStatusBadge status={appt.status} />
          {locked && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" /> Record finalized
            </span>
          )}
          {canStart && (
            <Button disabled={start.isPending} onClick={() => start.mutate()}>
              Start consultation
            </Button>
          )}
          {inConsultation && (
            <>
              {!locked && (
                <Button variant="outline" disabled={saveDraft.isPending} onClick={() => saveDraft.mutate()}>
                  <Save className="h-4 w-4" /> Save draft
                </Button>
              )}
              <Button disabled={finish.isPending} onClick={() => setShowFinish(true)}>
                <CheckCircle2 className="h-4 w-4" /> {locked ? 'Complete visit' : 'Finalize & complete'}
              </Button>
            </>
          )}
        </div>
      </div>

      <AllergyBanner allergies={summary?.allergies ?? []} className="mb-4" />

      {notArrived && (
        <Card className="mb-4">
          <CardContent className="p-4 text-sm text-muted-foreground">
            This patient hasn't been checked in yet. Reception checks them in; you can start once they have been.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid content-start gap-4 lg:col-span-2">
          <VitalsSection
            value={vitals}
            onChange={(v) => {
              setVitals(v);
              setVitalsDirty(true);
            }}
            locked={locked || closed}
          />
          <ClinicalSection value={clinical} onChange={setClinical} locked={locked || closed} />
          <PrescriptionPad appointmentId={id} allergies={summary?.allergies ?? []} />
          <LabOrderPanel
            existingOrders={labOrders ?? []}
            onOrder={(input) => orderLabFromAppointment(id, input)}
            invalidateKey={['lab', 'orders', 'visit', id]}
            disabled={closed}
          />
        </div>
        <PatientContextPanel patientId={patientId} summary={summary} />
      </div>

      <Dialog open={showFinish} onOpenChange={setShowFinish}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{locked ? 'Complete this visit?' : 'Finalize and complete?'}</DialogTitle>
            <DialogDescription>
              {locked
                ? 'This closes the visit and moves on to the next patient.'
                : "This saves your notes, locks the medical record so it can no longer be edited, and closes the visit. Prescriptions and lab orders you've already issued are unaffected."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFinish(false)}>
              Keep editing
            </Button>
            <Button
              disabled={finish.isPending}
              onClick={() => {
                setShowFinish(false);
                finish.mutate();
              }}
            >
              {finish.isPending ? 'Saving…' : locked ? 'Complete visit' : 'Finalize & complete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
