import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { PriorityBadge } from '@/components/clinical/PriorityBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { searchLabOrders } from '@/features/lab/api';
import type { LabOrder } from '@/features/lab/types';
import { humanizeStatus, timeAgo } from '@/lib/format';

const STAGES = {
  collect: { status: 'ordered', empty: 'No samples waiting to be collected.' },
  lab: { status: 'sample_collected,in_progress', empty: 'Nothing in the lab right now.' },
  done: { status: 'completed', empty: 'No verified results yet.' },
} as const;

function patientOf(o: LabOrder) {
  return typeof o.patientId === 'object' ? o.patientId : null;
}

// Server returns these already ordered STAT -> urgent -> routine, oldest
// first within each tier - the order the bench should actually work in.
function StageTable({ stage }: { stage: keyof typeof STAGES }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['lab', 'orders', 'queue', stage, page],
    queryFn: () => searchLabOrders({ status: STAGES[stage].status, page, limit: 20 }),
    refetchInterval: 20_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          {(data?.items ?? []).length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">{STAGES[stage].empty}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="p-3 font-medium">Priority</th>
                  <th className="p-3 font-medium">Test</th>
                  <th className="p-3 font-medium">Patient</th>
                  <th className="p-3 font-medium">Ordered by</th>
                  <th className="p-3 font-medium">Waiting</th>
                  <th className="p-3 font-medium">Stage</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {data!.items.map((o) => (
                  <tr key={o._id} className="cursor-pointer border-t hover:bg-accent" onClick={() => navigate(`/lab/queue/${o._id}`)}>
                    <td className="p-3">
                      <PriorityBadge priority={o.priority} />
                    </td>
                    <td className="p-3 font-medium">{o.testNameSnapshot}</td>
                    <td className="p-3">
                      <p>{patientOf(o)?.name}</p>
                      <p className="text-xs text-muted-foreground">{patientOf(o)?.uhid}</p>
                    </td>
                    <td className="p-3 text-muted-foreground">{o.orderedBy ? `Dr. ${o.orderedBy.name}` : ''}</td>
                    <td className="p-3 text-muted-foreground">{timeAgo(o.orderedAt)}</td>
                    <td className="p-3">
                      <Badge variant={o.status === 'completed' ? 'success' : 'secondary'}>{humanizeStatus(o.status)}</Badge>
                    </td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant={stage === 'done' ? 'ghost' : 'default'}>
                        {stage === 'collect' ? 'Collect' : stage === 'lab' ? 'Enter results' : 'View'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {data.page} of {data.totalPages} · {data.total} orders
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function useStageTotal(stage: keyof typeof STAGES) {
  return useQuery({ queryKey: ['lab', 'count', stage], queryFn: () => searchLabOrders({ status: STAGES[stage].status, limit: 1 }) }).data?.total;
}

export function LabQueuePage() {
  const nCollect = useStageTotal('collect');
  const nLab = useStageTotal('lab');

  return (
    <div>
      <PageHeader title="Order queue" description="Most urgent first: STAT, then urgent, then routine — oldest first within each." />
      <Tabs defaultValue="collect">
        <TabsList>
          <TabsTrigger value="collect">To collect{nCollect != null ? ` (${nCollect})` : ''}</TabsTrigger>
          <TabsTrigger value="lab">In the lab{nLab != null ? ` (${nLab})` : ''}</TabsTrigger>
          <TabsTrigger value="done">Completed</TabsTrigger>
        </TabsList>
        {(Object.keys(STAGES) as (keyof typeof STAGES)[]).map((s) => (
          <TabsContent key={s} value={s}>
            <StageTable stage={s} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
