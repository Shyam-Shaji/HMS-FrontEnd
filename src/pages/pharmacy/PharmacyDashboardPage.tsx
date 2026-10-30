import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatTile } from "@/components/layout/StatTile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card,CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDispenseQueue, fetchExpiring, fetchLowStock, fetchPurchaseOrders } from "@/features/pharmacy/api";
import { timeAgo } from "@/lib/format";

export function PharmacyDashboardPage() {
  const { data: queue, isLoading: loadingQueue } = useQuery({
    queryKey: ['pharmacy', 'queue'],
    queryFn: fetchDispenseQueue,
    refetchInterval: 20_000,
  });
  const { data: low, isLoading: loadingLow } = useQuery({ queryKey: ['pharmacy', 'low-stock'], queryFn: fetchLowStock });
  const { data: expiring, isLoading: loadingExp } = useQuery({ queryKey: ['pharmacy', 'expiring', '30'], queryFn: () => fetchExpiring(30) });
  const { data: orders } = useQuery({ queryKey: ['pharmacy', 'purchase-orders'], queryFn: fetchPurchaseOrders });

  const pendingOrders = (orders ?? []).filter((o) => o.status === 'pending').length;
  const outOfStock = (low ?? []).filter((l) => l.totalAvailable === 0).length;

  return (
    <div>
      <PageHeader title="Pharmacy" description="Prescriptions to dispense and stock that needs attention." />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Waiting to dispense" value={queue?.length ?? 0} isLoading={loadingQueue} />
        <StatTile label="Low or out of stock" value={low?.length ?? 0} hint={outOfStock ? `${outOfStock} out of stock` : undefined} isLoading={loadingLow} />
        <StatTile label="Expiring in 30 days" value={expiring?.length ?? 0} hint="Batches, incl. already expired" isLoading={loadingExp} />
        <StatTile label="Orders awaiting delivery" value={pendingOrders} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Longest waiting</CardTitle>
            <Link to="/pharmacy/queue">
              <Button size="sm" variant="outline">
                Open queue <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="grid gap-2">
            {loadingQueue ? (
              <Skeleton className="h-20 w-full" />
            ) : (queue ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No prescriptions waiting.</p>
            ) : (
              queue!.slice(0, 5).map((rx) => (
                <div key={rx._id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span>
                    <span className="font-medium">{rx.patientId?.name}</span>
                    <span className="ml-2 text-muted-foreground">{rx.medicines.length} medicine{rx.medicines.length === 1 ? '' : 's'}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {(rx.patientId?.allergies ?? []).length > 0 && <Badge variant="destructive">Allergies</Badge>}
                    <span className="text-xs text-muted-foreground">{timeAgo(rx.createdAt)}</span>
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Running low</CardTitle>
            <Link to="/pharmacy/inventory">
              <Button size="sm" variant="outline">
                Inventory <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="grid gap-2">
            {loadingLow ? (
              <Skeleton className="h-20 w-full" />
            ) : (low ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Everything is above its reorder level.</p>
            ) : (
              low!.slice(0, 5).map((l) => (
                <div key={l.medicine._id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span className="font-medium">{l.medicine.name}</span>
                  <span className="text-muted-foreground">
                    {l.totalAvailable === 0 ? <Badge variant="destructive">Out of stock</Badge> : `${l.totalAvailable} left`}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
