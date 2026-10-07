import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, FlaskConical } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchMyLabReports } from "@/features/lab/api";
import { formatDate } from "@/lib/format";

export function LabReportsPage() {
  const { data: reports, isLoading } = useQuery({
    queryKey: ['lab', 'me'],
    queryFn: fetchMyLabReports,
  });

  return (
    <div>
      <PageHeader title="Lab reports" description="Test results, once verified by the lab." />

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : !reports || reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <FlaskConical className="h-7 w-7 text-muted-foreground" />
            <p className="font-medium">No reports yet</p>
            <p className="text-sm text-muted-foreground">Verified results will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {reports.map((order) => (
            <Link key={order._id} to={`/patient/lab-reports/${order._id}`}>
              <Card className="transition-colors hover:bg-accent">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                    <FlaskConical className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{order.testNameSnapshot}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {formatDate(order.verifiedAt)}
                      {order.doctorId ? ` · Ordered by Dr. ${order.doctorId.name}` : ''}
                    </p>
                  </div>
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
