import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { PriorityBadge } from '@/components/clinical/PriorityBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/context/auth-context';
import { fetchLabOrder, searchLabOrders } from '@/features/lab/api';
import type { LabOrder, LabOrderStatus } from '@/features/lab/types';
import { formatDate, formatDateTime, humanizeStatus } from '@/lib/format';
import { cn } from '@/lib/cn';

const ALL = 'all';

function patientName(o: LabOrder) {
  return typeof o.patientId === 'object' ? o.patientId.name : 'Patient';
}

function ResultDialog({ orderId, onClose }: { orderId: string | null; onClose: () => void }) {
  const { data: order, isLoading } = useQuery({
    queryKey: ['lab', 'orders', orderId],
    queryFn: () => fetchLabOrder(orderId!),
    enabled: !!orderId,
  });

  return (
    <Dialog open={!!orderId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order?.testNameSnapshot ?? 'Lab order'}</DialogTitle>
          <DialogDescription>
            {order ? `${patientName(order)} · ${humanizeStatus(order.status)}` : 'Loading…'}
          </DialogDescription>
        </DialogHeader>

        {isLoading || !order ? (
          <Skeleton className="h-32 w-full" />
        ) : order.status !== 'completed' ? (
          <p className="text-sm text-muted-foreground">
            Results aren't available yet — they appear here once the lab verifies them.
          </p>
        ) : (
          <div className="grid gap-4">
            {order.resultParameters.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="py-2 font-medium">Parameter</th>
                    <th className="py-2 font-medium">Result</th>
                    <th className="py-2 font-medium">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {order.resultParameters.map((p, i) => {
                    const abnormal = p.flag && p.flag !== 'normal';
                    return (
                      <tr key={i} className="border-t">
                        <td className="py-2">{p.name}</td>
                        <td className={cn('py-2 font-medium', abnormal && 'text-destructive')}>
                          {p.value} {p.unit}
                          {abnormal && (
                            <Badge variant={p.flag === 'critical' ? 'destructive' : 'warning'} className="ml-2">
                              {p.flag}
                            </Badge>
                          )}
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {p.referenceRangeLow != null && p.referenceRangeHigh != null
                            ? `${p.referenceRangeLow} – ${p.referenceRangeHigh}`
                            : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {order.reportFileUrl && (
              <a href={order.reportFileUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline">
                Open full report
              </a>
            )}
            {order.resultNotes && <p className="whitespace-pre-wrap text-sm">{order.resultNotes}</p>}
            <p className="text-xs text-muted-foreground">Verified {formatDateTime(order.verifiedAt)}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function DoctorLabOrdersPage() {
  const { user } = useAuth();
  const [mineOnly, setMineOnly] = useState(true);
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['lab', 'orders', 'doctor', mineOnly ? user?.id : 'all', status, page],
    queryFn: () =>
      searchLabOrders({
        orderedBy: mineOnly ? user!.id : undefined,
        status: status === ALL ? undefined : (status as LabOrderStatus),
        page,
        limit: 20,
      }),
    enabled: !!user,
    refetchInterval: 30_000,
  });

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <PageHeader title="Lab orders" description="Track tests and review results." />
        <div className="flex gap-1 rounded-md bg-muted p-1">
          <Button size="sm" variant={mineOnly ? 'default' : 'ghost'} onClick={() => { setMineOnly(true); setPage(1); }}>
            Ordered by me
          </Button>
          <Button size="sm" variant={!mineOnly ? 'default' : 'ghost'} onClick={() => { setMineOnly(false); setPage(1); }}>
            All
          </Button>
        </div>
      </div>

      <div className="mb-4 max-w-xs">
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            <SelectItem value="ordered">Ordered</SelectItem>
            <SelectItem value="sample_collected">Sample collected</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (data?.items ?? []).length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No lab orders match.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="p-3 font-medium">Test</th>
                  <th className="p-3 font-medium">Patient</th>
                  <th className="p-3 font-medium">Priority</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Ordered</th>
                </tr>
              </thead>
              <tbody>
                {data!.items.map((o) => (
                  <tr key={o._id} className="cursor-pointer border-t hover:bg-accent" onClick={() => setOpenId(o._id)}>
                    <td className="p-3 font-medium">{o.testNameSnapshot}</td>
                    <td className="p-3 text-muted-foreground">{patientName(o)}</td>
                    <td className="p-3">
                      <PriorityBadge priority={o.priority} />
                    </td>
                    <td className="p-3">
                      <Badge variant={o.status === 'completed' ? 'success' : o.status === 'cancelled' ? 'destructive' : 'secondary'}>
                        {humanizeStatus(o.status)}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{formatDate(o.orderedAt)}</td>
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

      <ResultDialog orderId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
