import { useEffect, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { searchAppointments } from "@/features/appointments/api";
import { doctorOf, patientOf } from "@/features/appointments/staff-components";
import type { Appointment } from "@/features/appointments/types";
import { fetchVisitRecord, updateVisitVitals } from "@/features/emr/api";
import { VITAL_FIELDS, emptyVitals, vitalsFromRecord, vitalsToInput, type VitalsForm } from "@/features/emr/vitals-form";
import { getErrorMessage } from "@/lib/api-client";
import { formatTime12h, todayLocal } from "@/lib/format";

function VitalsDialog({ appointment, onClose }: { appointment: Appointment | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<VitalsForm>(emptyVitals());

  const { data: record, isFetched } = useQuery({
    queryKey: ['emr', 'visit', appointment?._id],
    queryFn: () => fetchVisitRecord(appointment!._id),
    enabled: !!appointment,
  });

  // Prefill once per opened appointment so a re-measure edits the existing
  // reading instead of starting from blanks.
  useEffect(() => {
    if (appointment && isFetched) setForm(vitalsFromRecord(record ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointment?._id, isFetched]);

  const save = useMutation({
    mutationFn: () => updateVisitVitals(appointment!._id, vitalsToInput(form)),
    onSuccess: () => {
      toast.success('Vitals saved — the doctor will see them');
      queryClient.invalidateQueries({ queryKey: ['emr', 'visit', appointment!._id] });
      onClose();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const any = VITAL_FIELDS.some((f) => form[f.key].trim() !== '');
  const finalized = record?.status === 'finalized';

  return (
    <Dialog open={!!appointment} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vitals — {appointment && patientOf(appointment)?.name}</DialogTitle>
          <DialogDescription>
            {finalized ? 'This visit\u2019s record is finalized and can no longer be edited.' : 'Leave anything you didn\u2019t measure blank.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {VITAL_FIELDS.map((f) => (
            <div key={f.key} className="grid gap-1.5">
              <Label htmlFor={`tv-${f.key}`} className="text-xs text-muted-foreground">
                {f.label} ({f.unit})
              </Label>
              <Input
                id={`tv-${f.key}`}
                type="number"
                step="any"
                inputMode="decimal"
                disabled={finalized}
                value={form[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <Button disabled={!any || finalized || save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? 'Saving…' : 'Save vitals'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function TriagePage() {
  const [target, setTarget] = useState<Appointment | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', 'triage', todayLocal()],
    queryFn: () => searchAppointments({ date: todayLocal(), limit: 100 }),
    refetchInterval: 20_000,
  });

  // Anyone physically here: checked in (waiting) or already with the doctor.
  const rows = (data?.items ?? [])
    .filter((a) => a.status === 'checked_in' || a.status === 'in_consultation')
    .sort((a, b) => a.tokenNumber - b.tokenNumber);

  // One lookup per row (shares the cache key the doctor's screen uses) so
  // the nurse can see at a glance who STILL needs vitals taken.
  const records = useQueries({
    queries: rows.map((a) => ({ queryKey: ['emr', 'visit', a._id], queryFn: () => fetchVisitRecord(a._id) })),
  });

  return (
    <div className="max-w-3xl">
      <PageHeader title="OPD triage" description="Record vitals for patients who've checked in, before they see the doctor." />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No one is waiting. Patients appear here once reception checks them in.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {rows.map((a, i) => {
                  const done = !!records[i]?.data?.vitals?.recordedAt;
                  return (
                    <tr key={a._id} className="border-t first:border-0">
                      <td className="p-3 text-lg font-semibold tabular-nums">#{a.tokenNumber}</td>
                      <td className="p-3">
                        <p className="font-medium">{patientOf(a)?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime12h(a.scheduledTime)} · Dr. {doctorOf(a)?.name}
                        </p>
                      </td>
                      <td className="p-3">
                        {done ? (
                          <Badge variant="success">
                            <Check className="mr-1 h-3 w-3" /> Vitals recorded
                          </Badge>
                        ) : (
                          <Badge variant="warning">Needs vitals</Badge>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <Button size="sm" variant={done ? 'outline' : 'default'} onClick={() => setTarget(a)}>
                          {done ? 'Edit' : 'Record vitals'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <VitalsDialog appointment={target} onClose={() => setTarget(null)} />
    </div>
  );
}
