import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchPatientHistory } from '@/features/emr/api';
import type { PatientSummary } from '@/features/emr/types';
import { fetchPatientLabHistory } from '@/features/lab/api';
import { formatDate } from '@/lib/format';

export function PatientContextPanel({ patientId, summary }: { patientId: string; summary?: PatientSummary }) {
  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ['emr', 'history', patientId],
    queryFn: () => fetchPatientHistory(patientId, 5),
  });
  const { data: labs } = useQuery({
    queryKey: ['lab', 'history', patientId],
    queryFn: () => fetchPatientLabHistory(patientId),
  });

  return (
    <div className="grid gap-4">
      {summary && summary.chronicConditions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Chronic conditions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {summary.chronicConditions.map((c) => (
              <Badge key={c} variant="secondary">
                {c}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Previous visits</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          {loadingHistory ? (
            <Skeleton className="h-16 w-full" />
          ) : (history?.items ?? []).length === 0 ? (
            <p className="text-muted-foreground">First visit — no history yet.</p>
          ) : (
            history!.items.map((v) => (
              <div key={v._id} className="border-b pb-3 last:border-0 last:pb-0">
                <p className="text-xs text-muted-foreground">
                  {formatDate(v.visitDate)}
                  {v.doctorId ? ` · Dr. ${v.doctorId.name}` : ''}
                </p>
                <p className="font-medium">{v.chiefComplaint || 'Consultation'}</p>
                {v.diagnosis.length > 0 && <p className="text-muted-foreground">{v.diagnosis.map((d) => d.description).join(', ')}</p>}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent lab results</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          {(labs ?? []).length === 0 ? (
            <p className="text-muted-foreground">No verified results.</p>
          ) : (
            labs!.slice(0, 5).map((o) => {
              const abnormal = o.resultParameters.filter((p) => p.flag && p.flag !== 'normal').length;
              return (
                <div key={o._id} className="flex items-center justify-between">
                  <span>
                    {o.testNameSnapshot}
                    <span className="ml-2 text-xs text-muted-foreground">{formatDate(o.verifiedAt)}</span>
                  </span>
                  {abnormal > 0 && <Badge variant="warning">{abnormal} abnormal</Badge>}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
