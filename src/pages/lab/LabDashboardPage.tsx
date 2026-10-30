import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatTile } from "@/components/layout/StatTile";
import { PriorityBadge } from "@/components/clinical/PriorityBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { searchLabOrders } from "@/features/lab/api";
import { humanizeStatus, timeAgo } from "@/lib/format";

const OPEN = 'ordered,sample_collected,in_progress';

function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// limit:1 requests - we only want each query's `total`.
function useTotal(key: string, params: Parameters<typeof searchLabOrders>[0]) {
  return useQuery({ queryKey: ['lab', 'dash', key], queryFn: () => searchLabOrders({ ...params, limit: 1 }), refetchInterval: 20_000 });
}

export function LabDashboardPage() {
  const toCollect = useTotal('collect', { status: 'ordered' });
  const inLab = useTotal('lab', { status: 'sample_collected,in_progress' });
  const stat = useTotal('stat', { status: OPEN, priority: 'stat' });
  const urgent = useTotal('urgent', { status: OPEN, priority: 'urgent' });
  const verified = useTotal('verified', { status: 'completed', verifiedFrom: startOfToday() });
  const { data: top, isLoading } = useQuery({
    queryKey: ['lab', 'dash', 'top'],
    queryFn: () => searchLabOrders({ status: OPEN, limit: 6 }),
    refetchInterval: 20_000,
  });

  const urgentTotal = (stat.data?.total ?? 0) + (urgent.data?.total ?? 0);

  return (
    <div>
      <PageHeader title="Laboratory" description="What needs doing, most urgent first." />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Samples to collect" value={toCollect.data?.total ?? 0} isLoading={toCollect.isLoading} />
        <StatTile label="In the lab" value={inLab.data?.total ?? 0} isLoading={inLab.isLoading} />
        <StatTile label="STAT / urgent open" value={urgentTotal} hint={stat.data?.total ? `${stat.data.total} STAT` : undefined} isLoading={stat.isLoading || urgent.isLoading} />
        <StatTile label="Verified today" value={verified.data?.total ?? 0} isLoading={verified.isLoading} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Next up</CardTitle>
          <Link to="/lab/queue">
            <Button size="sm" variant="outline">
              Full queue <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="grid gap-2">
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (top?.items ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No open orders.</p>
          ) : (
            top!.items.map((o) => (
              <Link key={o._id} to={`/lab/queue/${o._id}`} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-accent">
                <span className="flex items-center gap-3">
                  <PriorityBadge priority={o.priority} />
                  <span className="font-medium">{o.testNameSnapshot}</span>
                  <span className="text-muted-foreground">{typeof o.patientId === 'object' ? o.patientId.name : ''}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {humanizeStatus(o.status)} · {timeAgo(o.orderedAt)}
                </span>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
