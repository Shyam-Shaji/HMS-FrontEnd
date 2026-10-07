import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileDown } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchMyLabReportById } from "@/features/lab/api";
import type { ResultParameter } from "@/features/lab/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

function flagVariant(flag: ResultParameter['flag']) {
  if (flag === 'critical') return 'destructive' as const;
  if (flag === 'high' || flag === 'low') return 'warning' as const;
  return 'secondary' as const;
}

export function LabReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: order, isLoading } = useQuery({
    queryKey: ['lab', 'me', id],
    queryFn: () => fetchMyLabReportById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-xl space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!order) return <p className="text-center text-sm text-muted-foreground">Report not found.</p>;

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/patient/lab-reports')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={order.testNameSnapshot}
          description={`Verified ${formatDate(order.verifiedAt)}${order.doctorId ? ` · Ordered by Dr. ${order.doctorId.name}` : ''}`}
        />
      </div>

      {order.resultParameters.length > 0 && (
        <Card className="mb-4">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="p-3 font-medium">Parameter</th>
                  <th className="p-3 font-medium">Result</th>
                  <th className="p-3 font-medium">Reference range</th>
                </tr>
              </thead>
              <tbody>
                {order.resultParameters.map((p, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="p-3">{p.name}</td>
                    <td className="p-3">
                      <span className={cn('font-medium', p.flag && p.flag !== 'normal' && 'text-destructive')}>
                        {p.value} {p.unit}
                      </span>
                      {p.flag && p.flag !== 'normal' && (
                        <Badge variant={flagVariant(p.flag)} className="ml-2">
                          {p.flag}
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {p.referenceRangeLow != null && p.referenceRangeHigh != null
                        ? `${p.referenceRangeLow} - ${p.referenceRangeHigh} ${p.unit ?? ''}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {order.reportFileUrl && (
        <Card className="mb-4">
          <CardContent className="flex items-center justify-between p-4">
            <p className="text-sm font-medium">Full report</p>
            <a href={order.reportFileUrl} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm">
                <FileDown className="h-4 w-4" />
                View / download
              </Button>
            </a>
          </CardContent>
        </Card>
      )}

      {order.resultNotes && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{order.resultNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
