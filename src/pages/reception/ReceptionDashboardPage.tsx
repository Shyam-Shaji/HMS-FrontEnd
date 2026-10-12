import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatTile } from "@/components/layout/StatTile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { searchAppointments } from "@/features/appointments/api";
import { BookForPatientDialog } from "@/features/appointments/BookForPatientDialog";
import { 
    ReceptionRowActions ,
    doctorOf,
    patientOf,
} from "@/features/appointments/staff-components";
import { formatTime12h, todayLocal } from "@/lib/format";

export function ReceptionDashboardPage() {
  const [showBook, setShowBook] = useState(false);
  const today = todayLocal();

  // One query feeds every number and the worklist below - the day's
  // appointments are a small set, so counting client-side beats several
  // round trips.
  const { data, isLoading } = useQuery({
    queryKey: ['appointments', 'reception-dashboard', today],
    queryFn: () => searchAppointments({ date: today, limit: 100 }),
    refetchInterval: 30_000, // keeps the desk's view fresh without a socket
  });

  const items = data?.items ?? [];
  const count = (s: string) => items.filter((a) => a.status === s).length;
  const waiting = items.filter((a) => a.status === 'booked');

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <PageHeader title="Reception" description="Today's check-ins and appointments at a glance." />
        <Button onClick={() => setShowBook(true)}>
          <CalendarPlus className="h-4 w-4" />
          Book appointment
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Today's appointments" value={items.length} isLoading={isLoading} />
        <StatTile label="Awaiting check-in" value={count('booked')} hint="Booked, not yet arrived" isLoading={isLoading} />
        <StatTile label="Checked in" value={count('checked_in') + count('in_consultation')} hint="In the building" isLoading={isLoading} />
        <StatTile label="Completed" value={count('completed')} isLoading={isLoading} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Awaiting check-in</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : waiting.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Everyone expected has arrived.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {waiting.map((a) => (
                  <tr key={a._id} className="border-t">
                    <td className="p-3 font-medium">{formatTime12h(a.scheduledTime)}</td>
                    <td className="p-3">
                      <p className="font-medium">{patientOf(a)?.name ?? 'Patient'}</p>
                      <p className="text-xs text-muted-foreground">{patientOf(a)?.uhid}</p>
                    </td>
                    <td className="p-3 text-muted-foreground">Dr. {doctorOf(a)?.name}</td>
                    <td className="p-3 text-muted-foreground">#{a.tokenNumber}</td>
                    <td className="p-3">
                      <ReceptionRowActions appointment={a} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <BookForPatientDialog open={showBook} onOpenChange={setShowBook} />
    </div>
  );
}
