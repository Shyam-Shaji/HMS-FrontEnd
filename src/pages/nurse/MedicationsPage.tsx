import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { AllergyBanner } from "@/components/clinical/AllergyBanner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { administerMedication, fetchMedicationOrders, searchAdmissions } from "@/features/admissions/api";
import type { Admission, AdministrationStatus, MedicationOrder } from "@/features/admissions/types";
import { getErrorMessage } from "@/lib/api-client";
import { formatDateTime, humanizeStatus } from "@/lib/format";

interface Pending {
  admission: Admission;
  order: MedicationOrder;
  status: AdministrationStatus;
}

const STATUS_LABEL: Record<AdministrationStatus, string> = { administered: 'Given', held: 'Held', missed: 'Missed' };

function PatientMarCard({
  admission,
  defaultOpen,
  onAct,
}: {
  admission: Admission;
  defaultOpen: boolean;
  onAct: (p: Pending) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const patient = typeof admission.patientId === 'object' ? admission.patientId : null;
  const ward = typeof admission.wardId === 'object' ? admission.wardId : null;
  const bed = typeof admission.bedId === 'object' ? admission.bedId : null;

  // Orders load only when a card is expanded - the page lists every
  // admitted patient, and fetching all of their orders up front would be
  // one request per patient for data the nurse mostly won't open.
  const { data: orders, isLoading } = useQuery({
    queryKey: ['admissions', admission._id, 'meds'],
    queryFn: () => fetchMedicationOrders(admission._id),
    enabled: open,
  });

  return (
    <Card>
      <button type="button" className="flex w-full items-center gap-3 p-4 text-left" onClick={() => setOpen(!open)}>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        <div className="flex-1">
          <p className="font-medium">{patient?.name}</p>
          <p className="text-xs text-muted-foreground">
            {patient?.uhid} · {ward?.name}, Bed {bed?.bedNumber}
          </p>
        </div>
        {(patient?.allergies ?? []).length > 0 && <Badge variant="destructive">Allergies</Badge>}
      </button>

      {open && (
        <CardContent className="grid gap-3 border-t pt-4">
          <AllergyBanner allergies={patient?.allergies ?? []} />
          {isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : (orders ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No standing medication orders.</p>
          ) : (
            orders!.map((order) => {
              const recent = order.administrations.slice(-3).reverse();
              return (
                <div key={order._id} className="rounded-md border p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{order.medicineName}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.dosage} · {order.route} · {order.frequency}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => onAct({ admission, order, status: 'administered' })}>
                        Given
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onAct({ admission, order, status: 'held' })}>
                        Held
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onAct({ admission, order, status: 'missed' })}>
                        Missed
                      </Button>
                    </div>
                  </div>
                  {recent.length > 0 && (
                    <ul className="mt-2 grid gap-0.5 border-t pt-2 text-xs text-muted-foreground">
                      {recent.map((a, i) => (
                        <li key={i}>
                          {STATUS_LABEL[a.status]} · {formatDateTime(a.administeredAt)}
                          {a.notes ? ` — ${a.notes}` : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function MedicationsPage() {
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const focusId = params.get('admission');
  const [filter, setFilter] = useState('');
  const [pending, setPending] = useState<Pending | null>(null);
  const [notes, setNotes] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admissions', 'list', 'admitted'],
    queryFn: () => searchAdmissions({ status: 'admitted', limit: 100 }),
  });

  const record = useMutation({
    mutationFn: () => administerMedication(pending!.admission._id, pending!.order._id, pending!.status, notes || undefined),
    onSuccess: () => {
      toast.success(`Recorded: ${STATUS_LABEL[pending!.status].toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: ['admissions', pending!.admission._id, 'meds'] });
      setPending(null);
      setNotes('');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const rows = (data?.items ?? []).filter((a) => {
    const name = typeof a.patientId === 'object' ? `${a.patientId.name} ${a.patientId.uhid}` : '';
    return name.toLowerCase().includes(filter.toLowerCase());
  });
  // A held or missed dose needs a reason on the record; a given dose doesn't.
  const needsReason = pending && pending.status !== 'administered';
  const pendingPatient = pending && typeof pending.admission.patientId === 'object' ? pending.admission.patientId : null;

  return (
    <div className="max-w-3xl">
      <PageHeader title="Medication (MAR)" description="Chart every dose given, held or missed." />
      <Input className="mb-4 max-w-xs" placeholder="Filter by patient" value={filter} onChange={(e) => setFilter(e.target.value)} />

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">No admitted patients to show.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {rows.map((a) => (
            <PatientMarCard key={a._id} admission={a} defaultOpen={a._id === focusId} onAct={(p) => setPending(p)} />
          ))}
        </div>
      )}

      <Dialog open={!!pending} onOpenChange={(o) => !o && (setPending(null), setNotes(''))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record dose: {pending && STATUS_LABEL[pending.status]}</DialogTitle>
            <DialogDescription>Check this is the right patient and drug before confirming.</DialogDescription>
          </DialogHeader>
          {pending && (
            <div className="grid gap-3">
              <div className="rounded-md border bg-secondary/40 p-3 text-sm">
                <p className="font-medium">{pendingPatient?.name}</p>
                <p className="text-muted-foreground">
                  {pending.order.medicineName} · {pending.order.dosage} · {pending.order.route}
                </p>
              </div>
              <AllergyBanner allergies={pendingPatient?.allergies ?? []} />
              <Textarea
                placeholder={needsReason ? `Reason ${humanizeStatus(STATUS_LABEL[pending.status]).toLowerCase()} (required)` : 'Notes (optional)'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => (setPending(null), setNotes(''))}>
              Cancel
            </Button>
            <Button disabled={record.isPending || (!!needsReason && !notes.trim())} onClick={() => record.mutate()}>
              {record.isPending ? 'Saving…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
