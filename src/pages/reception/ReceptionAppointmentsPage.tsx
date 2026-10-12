import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/auth-context";
import { searchAppointments } from "@/features/appointments/api";
import { searchDoctors } from "@/features/doctors/api";
import { BookForPatientDialog } from "@/features/appointments/BookForPatientDialog";
import { 
    AppointmentStatusBadge,
    ReceptionRowActions,
    doctorOf,
    patientOf,
} from "@/features/appointments/staff-components";
import { formatTime12h, todayLocal } from "@/lib/format";

const ALL = 'all';

export function ReceptionAppointmentsPage() {
  const { user } = useAuth();
  const [date, setDate] = useState(todayLocal());
  const [doctorId, setDoctorId] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);
  const [showBook, setShowBook] = useState(false);

  const { data: doctors } = useQuery({
    queryKey: ['doctors', user?.hospitalId],
    queryFn: () => searchDoctors({ hospitalId: user!.hospitalId! }),
    enabled: !!user?.hospitalId,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', 'list', date, doctorId, status, page],
    queryFn: () =>
      searchAppointments({
        date,
        doctorId: doctorId === ALL ? undefined : doctorId,
        status: status === ALL ? undefined : (status as never),
        page,
        limit: 20,
      }),
  });

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <PageHeader title="Appointments" description="Everything booked, by day and doctor." />
        <Button onClick={() => setShowBook(true)}>
          <CalendarPlus className="h-4 w-4" />
          Book appointment
        </Button>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="f-date">Date</Label>
          <Input
            id="f-date"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="grid gap-1.5">
          <Label>Doctor</Label>
          <Select
            value={doctorId}
            onValueChange={(v) => {
              setDoctorId(v);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All doctors</SelectItem>
              {(doctors ?? []).map((d) => (
                <SelectItem key={d._id} value={d._id}>
                  Dr. {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              <SelectItem value="booked">Booked</SelectItem>
              <SelectItem value="checked_in">Checked in</SelectItem>
              <SelectItem value="in_consultation">In consultation</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="no_show">No-show</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (data?.items ?? []).length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No appointments match these filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="p-3 font-medium">Time</th>
                    <th className="p-3 font-medium">Patient</th>
                    <th className="p-3 font-medium">Doctor</th>
                    <th className="p-3 font-medium">Token</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {data!.items.map((a) => (
                    <tr key={a._id} className="border-t">
                      <td className="p-3 font-medium">{formatTime12h(a.scheduledTime)}</td>
                      <td className="p-3">
                        <p className="font-medium">{patientOf(a)?.name ?? 'Patient'}</p>
                        <p className="text-xs text-muted-foreground">{patientOf(a)?.uhid}</p>
                      </td>
                      <td className="p-3 text-muted-foreground">Dr. {doctorOf(a)?.name}</td>
                      <td className="p-3 text-muted-foreground">#{a.tokenNumber}</td>
                      <td className="p-3">
                        <AppointmentStatusBadge status={a.status} />
                      </td>
                      <td className="p-3">
                        <ReceptionRowActions appointment={a} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {data.page} of {data.totalPages} · {data.total} appointments
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

      <BookForPatientDialog open={showBook} onOpenChange={setShowBook} />
    </div>
  );
}
