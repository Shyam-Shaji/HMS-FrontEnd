import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BedDouble, Sparkles, UserRound, Wrench, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdmitDialog } from "@/features/admissions/AdmitDialog";
import { searchAdmissions } from "@/features/admissions/api";
import { fetchWardBoard, updateBedStatus } from "@/features/wards/api";
import type { Bed, BedStatus, Ward } from "@/features/wards/types";
import { getErrorMessage } from "@/lib/api-client";
import { cn } from "@/lib/cn";

// Status is never conveyed by colour alone (UI/UX accessibility spec):
// every state has its own icon AND a text label.
const STATUS: Record<BedStatus, { label: string; icon: LucideIcon; className: string }> = {
  vacant: { label: 'Vacant', icon: BedDouble, className: 'border-success/60 bg-success/5' },
  occupied: { label: 'Occupied', icon: UserRound, className: 'border-border bg-secondary' },
  cleaning: { label: 'Cleaning', icon: Sparkles, className: 'border-warning/70 bg-warning/10' },
  maintenance: { label: 'Maintenance', icon: Wrench, className: 'border-dashed bg-muted text-muted-foreground' },
};

export function WardBoardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<{ bed: Bed; ward: Ward } | null>(null);
  const [admitInto, setAdmitInto] = useState<{ wardId: string; bedId: string; label: string } | null>(null);

  const { data: board, isLoading } = useQuery({
    queryKey: ['wards', 'board'],
    queryFn: fetchWardBoard,
    refetchInterval: 30_000,
  });
  // The board knows bed STATUS but not WHO is in a bed - join with the
  // active admissions to show names on occupied beds.
  const { data: admissions } = useQuery({
    queryKey: ['admissions', 'active-board'],
    queryFn: () => searchAdmissions({ status: 'admitted', limit: 100 }),
    refetchInterval: 30_000,
  });

  const admissionByBed = new Map<string, { id: string; name: string }>();
  for (const a of admissions?.items ?? []) {
    const bedId = typeof a.bedId === 'object' ? a.bedId._id : a.bedId;
    const name = typeof a.patientId === 'object' ? a.patientId.name : 'Patient';
    admissionByBed.set(bedId, { id: a._id, name });
  }

  const setStatus = useMutation({
    mutationFn: ({ bedId, status }: { bedId: string; status: BedStatus }) => updateBedStatus(bedId, status),
    onSuccess: () => {
      toast.success('Bed updated');
      queryClient.invalidateQueries({ queryKey: ['wards'] });
      setSelected(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const allBeds = (board ?? []).flatMap((w) => w.beds);
  const count = (s: BedStatus) => allBeds.filter((b) => b.status === s).length;

  function onBedClick(bed: Bed, ward: Ward) {
    if (bed.status === 'occupied') {
      const adm = admissionByBed.get(bed._id);
      if (adm) navigate(`/nurse/admissions/${adm.id}`);
      return;
    }
    setSelected({ bed, ward });
  }

  return (
    <div>
      <PageHeader title="Ward board" description="Every bed, at a glance. Tap a bed to act on it." />

      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        {(Object.keys(STATUS) as BedStatus[]).map((s) => {
          const Icon = STATUS[s].icon;
          return (
            <span key={s} className={cn('flex items-center gap-1.5 rounded-md border px-3 py-1.5', STATUS[s].className)}>
              <Icon className="h-4 w-4" />
              {STATUS[s].label} <strong>{count(s)}</strong>
            </span>
          );
        })}
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (board ?? []).length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No wards set up yet. A hospital admin adds wards and beds.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {board!.map(({ ward, beds }) => (
            <Card key={ward._id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-baseline justify-between text-base">
                  <span>{ward.name}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {beds.filter((b) => b.status === 'occupied').length}/{beds.length} occupied
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* 88px min tap targets - this screen lives on a nurse's tablet. */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  {beds.map((bed) => {
                    const s = STATUS[bed.status];
                    const Icon = s.icon;
                    const occupant = admissionByBed.get(bed._id);
                    return (
                      <button
                        key={bed._id}
                        type="button"
                        onClick={() => onBedClick(bed, ward)}
                        className={cn(
                          'flex min-h-[88px] flex-col items-start justify-between rounded-lg border-2 p-3 text-left transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          s.className,
                        )}
                      >
                        <span className="flex w-full items-center justify-between text-xs font-medium">
                          Bed {bed.bedNumber}
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-medium leading-tight">
                          {bed.status === 'occupied' ? (occupant?.name ?? 'Occupied') : s.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selected?.ward.name} — Bed {selected?.bed.bedNumber}
            </DialogTitle>
            <DialogDescription>{selected && STATUS[selected.bed.status].label}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {selected?.bed.status === 'vacant' && (
              <>
                <Button
                  onClick={() => {
                    setAdmitInto({ wardId: selected.ward._id, bedId: selected.bed._id, label: `${selected.ward.name}, Bed ${selected.bed.bedNumber}` });
                    setSelected(null);
                  }}
                >
                  Admit a patient here
                </Button>
                <Button variant="outline" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ bedId: selected.bed._id, status: 'maintenance' })}>
                  Take out of service (maintenance)
                </Button>
              </>
            )}
            {selected?.bed.status === 'cleaning' && (
              <Button disabled={setStatus.isPending} onClick={() => setStatus.mutate({ bedId: selected.bed._id, status: 'vacant' })}>
                Cleaned — mark ready
              </Button>
            )}
            {selected?.bed.status === 'maintenance' && (
              <Button disabled={setStatus.isPending} onClick={() => setStatus.mutate({ bedId: selected.bed._id, status: 'vacant' })}>
                Return to service
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AdmitDialog open={!!admitInto} onOpenChange={(o) => !o && setAdmitInto(null)} presetBed={admitInto ?? undefined} />
    </div>
  );
}
