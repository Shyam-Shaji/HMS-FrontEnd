import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarPlus, FileText, Receipt, CalendarDays, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchMyAppointments } from '@/features/appointments/api';
import { formatDate, formatTime12h } from '@/lib/format';

const quickActions = [
  { label: 'Book an appointment', to: '/patient/appointments/book', icon: CalendarPlus },
  { label: 'View health records', to: '/patient/records', icon: FileText },
  { label: 'Pay a bill', to: '/patient/billing', icon: Receipt },
];

function doctorName(doctorId: unknown): string {
  if (doctorId && typeof doctorId === 'object' && 'name' in doctorId) return (doctorId as { name: string }).name;
  return 'your doctor';
}

// The patient's first screen - built around the product's core promise
// ("don't waste the patient's time"): the fastest path to booking is one
// tap away, and an empty appointments list reads as an invitation, not a
// dead end, per the UI/UX spec's content guidelines.
export function PatientHomePage() {
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', 'me'],
    queryFn: fetchMyAppointments,
  });

  const upcoming = (appointments ?? [])
    .filter((a) => ['booked', 'checked_in', 'in_consultation'].includes(a.status))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Here's what's next for your care.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {quickActions.map((action) => (
          <Link key={action.label} to={action.to}>
            <Card className="transition-colors hover:bg-accent">
              <CardContent className="flex flex-col items-start gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                  <action.icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold">Upcoming appointments</h2>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : upcoming.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <CalendarDays className="h-7 w-7 text-muted-foreground" />
              <div>
                <p className="font-medium">No appointments yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Book one to get started.</p>
              </div>
              <Link to="/patient/appointments/book" className="text-sm font-medium text-primary hover:underline">
                Book an appointment
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {upcoming.map((appt) => (
              <Link key={appt._id} to={`/patient/appointments/${appt._id}`}>
                <Card className="transition-colors hover:bg-accent">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-medium">Dr. {doctorName(appt.doctorId)}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {formatDate(appt.scheduledDate)} · {formatTime12h(appt.scheduledTime)} · Token #{appt.tokenNumber}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {appt.status === 'checked_in' && <Badge variant="warning">Checked in</Badge>}
                      {appt.status === 'in_consultation' && <Badge variant="success">In consultation</Badge>}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
