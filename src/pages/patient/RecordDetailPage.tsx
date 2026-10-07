import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { fetchMyRecordByAppointment } from "@/features/emr/api";
import { formatDate } from "@/lib/format";

const VITALS_LABELS: Record<string, { label: string; unit?: string }> = {
  heightCm: { label: 'Height', unit: 'cm' },
  weightKg: { label: 'Weight', unit: 'kg' },
  temperatureC: { label: 'Temperature', unit: '°C' },
  pulseRate: { label: 'Pulse', unit: 'bpm' },
  respiratoryRate: { label: 'Respiratory rate', unit: '/min' },
  spo2: { label: 'SpO₂', unit: '%' },
};

export function RecordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: record, isLoading } = useQuery({
    queryKey: ['emr', 'me', id],
    queryFn: () => fetchMyRecordByAppointment(id!),
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

  if (!record) {
    return <p className="text-center text-sm text-muted-foreground">Record not found.</p>;
  }

  const vitalsEntries = Object.entries(VITALS_LABELS).filter(
    ([key]) => record.vitals[key as keyof typeof record.vitals] != null,
  );
  const bp =
    record.vitals.bloodPressureSystolic && record.vitals.bloodPressureDiastolic
      ? `${record.vitals.bloodPressureSystolic}/${record.vitals.bloodPressureDiastolic} mmHg`
      : null;

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/patient/records')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={record.chiefComplaint || 'Visit summary'}
          description={`${formatDate(record.visitDate)}${record.doctorId ? ` · Dr. ${record.doctorId.name}` : ''}`}
        />
      </div>

      <div className="flex flex-col gap-4">
        {(vitalsEntries.length > 0 || bp) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Vitals</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {bp && (
                <div>
                  <p className="text-xs text-muted-foreground">Blood pressure</p>
                  <p className="font-medium">{bp}</p>
                </div>
              )}
              {vitalsEntries.map(([key, meta]) => (
                <div key={key}>
                  <p className="text-xs text-muted-foreground">{meta.label}</p>
                  <p className="font-medium">
                    {record.vitals[key as keyof typeof record.vitals]} {meta.unit}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {record.diagnosis.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Diagnosis</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {record.diagnosis.map((d, i) => (
                <div key={i}>
                  <p className="font-medium">{d.description}</p>
                  {d.icd10Code && <p className="text-xs text-muted-foreground">ICD-10: {d.icd10Code}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {record.doctorNotes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Doctor's notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{record.doctorNotes}</p>
            </CardContent>
          </Card>
        )}

        {record.followUpDate && (
          <>
            <Separator />
            <p className="text-sm">
              <span className="text-muted-foreground">Follow-up suggested: </span>
              <span className="font-medium">{formatDate(record.followUpDate)}</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
