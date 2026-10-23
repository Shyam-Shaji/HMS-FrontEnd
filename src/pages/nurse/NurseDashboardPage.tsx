import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatTile } from "@/components/layout/StatTile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { searchAdmissions } from "@/features/admissions/api";
import { searchAppointments } from "@/features/appointments/api";
import { fetchWardBoard, updateBedStatus } from "@/features/wards/api";
import { getErrorMessage } from "@/lib/api-client";
import { todayLocal } from "@/lib/format";

export function NurseDashboardPage() {
  const queryClient = useQueryClient();

  const { data: board, isLoading: loadingBoard } = useQuery({ queryKey: ['wards', 'board'], queryFn: fetchWardBoard, refetchInterval: 30_000 });
  const { data: admitted, isLoading: loadingAdm } = useQuery({
    queryKey: ['admissions', 'list', 'admitted'],
    queryFn: () => searchAdmissions({ status: 'admitted', limit: 100 }),
    refetchInterval: 30_000,
  });
  const { data: discharged } = useQuery({
    queryKey: ['admissions', 'list', 'discharged'],
    queryFn: () => searchAdmissions({ status: 'discharged', limit: 50 }),
  });
  const { data: opd } = useQuery({
    queryKey: ['appointments', 'triage', todayLocal()],
    queryFn: () => searchAppointments({ date: todayLocal(), limit: 100 }),
    refetchInterval: 20_000,
  });

  const beds = (board ?? []).flatMap((w) => w.beds.map((b) => ({ ...b, wardName: w.ward.name })));
  const toClean = beds.filter((b) => b.status === 'cleaning');
  const pendingChecklist = (discharged?.items ?? []).filter((a) => !a.dischargeSummary?.nurseChecklistCompleted).length;
  const waitingOpd = (opd?.items ?? []).filter((a) => a.status === 'checked_in').length;

  const ready = useMutation({
    mutationFn: (bedId: string) => updateBedStatus(bedId, 'vacant'),
    onSuccess: () => {
      toast.success('Bed ready');
      queryClient.invalidateQueries({ queryKey: ['wards'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div>
      <PageHeader title="Nurse" description="Your wards at a glance." />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Admitted patients" value={admitted?.total ?? 0} isLoading={loadingAdm} />
        <StatTile label="Vacant beds" value={beds.filter((b) => b.status === 'vacant').length} isLoading={loadingBoard} />
        <StatTile label="Beds to turn over" value={toClean.length} hint="Waiting to be cleaned" isLoading={loadingBoard} />
        <StatTile label="Waiting in OPD" value={waitingOpd} hint="Checked in, may need vitals" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Beds needing turnover</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {toClean.length === 0 ? (
              <p className="text-sm text-muted-foreground">Every bed is ready or in use.</p>
            ) : (
              toClean.map((b) => (
                <div key={b._id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span>
                    <span className="font-medium">Bed {b.bedNumber}</span>
                    <span className="ml-2 text-muted-foreground">{b.wardName}</span>
                  </span>
                  <Button size="sm" disabled={ready.isPending} onClick={() => ready.mutate(b._id)}>
                    Mark ready
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Needs your attention</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <Link to="/nurse/triage" className="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-accent">
              <span>OPD patients waiting for vitals</span>
              <span className="font-semibold">{waitingOpd}</span>
            </Link>
            <Link to="/nurse/admissions" className="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-accent">
              <span>Discharge checklists to complete</span>
              <span className="font-semibold">{pendingChecklist}</span>
            </Link>
            <Link to="/nurse/medications" className="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-accent">
              <span>Medication round (MAR)</span>
              <span className="text-muted-foreground">{admitted?.total ?? 0} patients</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
