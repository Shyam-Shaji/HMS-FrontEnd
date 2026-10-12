import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, CalendarPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchPatientById } from "@/features/patients/api";
import { searchAppointments } from "@/features/appointments/api";
import { BookForPatientDialog } from "@/features/appointments/BookForPatientDialog";
import { AppointmentStatusBadge, doctorOf } from "@/features/appointments/staff-components";
import { formatDate, formatTime12h } from "@/lib/format";

export function ReceptionPatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showBook, setShowBook] = useState(false);

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patients', id],
    queryFn: () => fetchPatientById(id!),
    enabled: !!id,
  });

  const { data: appts } = useQuery({
    queryKey: ['appointments', 'patient', id],
    queryFn: () => searchAppointments({ patientId: id, limit: 10 }),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (!patient) return <p className="text-sm text-muted-foreground">Patient not found.</p>;

  const rows: [string, string | undefined][] = [
    ['UHID', patient.uhid],
    ['Date of birth', formatDate(patient.dob)],
    ['Gender', patient.gender],
    ['Blood group', patient.bloodGroup === 'unknown' ? undefined : patient.bloodGroup],
    ['Phone', patient.phone],
    ['Email', patient.email],
    ['Address', patient.address],
  ];

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/reception/patients')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageHeader title={patient.name} description={`UHID ${patient.uhid}`} />
        </div>
        <Button onClick={() => setShowBook(true)}>
          <CalendarPlus className="h-4 w-4" />
          Book appointment
        </Button>
      </div>

      {/* Safety-critical info gets its own always-visible, red-coded
          banner - never buried in a details list (UI/UX spec: red is
          reserved for exactly this kind of alert). */}
      {patient.allergies.length > 0 && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Allergies</p>
            <p>{patient.allergies.join(', ')}</p>
          </div>
        </div>
      )}

      <Card className="mb-4">
        <CardContent className="grid grid-cols-1 gap-3 p-4 text-sm sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-medium capitalize">{value || '—'}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent appointments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(appts?.items ?? []).length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No appointments yet.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {appts!.items.map((a) => (
                  <tr key={a._id} className="border-t">
                    <td className="p-3">{formatDate(a.scheduledDate)}</td>
                    <td className="p-3 text-muted-foreground">{formatTime12h(a.scheduledTime)}</td>
                    <td className="p-3 text-muted-foreground">Dr. {doctorOf(a)?.name}</td>
                    <td className="p-3">
                      <AppointmentStatusBadge status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <BookForPatientDialog
        open={showBook}
        onOpenChange={setShowBook}
        presetPatient={{ _id: patient._id, name: patient.name, uhid: patient.uhid }}
      />
    </div>
  );
}
