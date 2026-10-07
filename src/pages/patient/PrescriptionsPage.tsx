import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Pill } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchMyPrescriptions } from "@/features/prescriptions/api";
import type { DispenseStatus } from "@/features/prescriptions/types";
import { formatDate } from "@/lib/format";

function dispenseBadge(status: DispenseStatus) {
  if (status === 'fully_dispensed') return <Badge variant="success">Dispensed</Badge>;
  if (status === 'partially_dispensed') return <Badge variant="warning">Partially dispensed</Badge>;
  return <Badge variant="secondary">Pending pickup</Badge>;
}

export function PrescriptionsPage() {
  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ['prescriptions', 'me'],
    queryFn: fetchMyPrescriptions,
  });

  return (
    <div>
      <PageHeader title="Prescriptions" description="Medicines prescribed to you, across every visit." />

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : !prescriptions || prescriptions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <Pill className="h-7 w-7 text-muted-foreground" />
            <p className="font-medium">No prescriptions yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {prescriptions.map((rx) => (
            <Link key={rx._id} to={`/patient/prescriptions/${rx._id}`}>
              <Card className="transition-colors hover:bg-accent">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                    <Pill className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {rx.medicines.length} medicine{rx.medicines.length === 1 ? '' : 's'}
                      {rx.doctorId ? ` · Dr. ${rx.doctorId.name}` : ''}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{formatDate(rx.createdAt)}</p>
                  </div>
                  {rx.status === 'cancelled' ? (
                    <Badge variant="destructive">Cancelled</Badge>
                  ) : (
                    dispenseBadge(rx.dispenseStatus)
                  )}
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
