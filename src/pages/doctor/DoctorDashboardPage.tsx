import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Stethoscope } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatTile } from '@/components/layout/StatTile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { searchAppointments } from '@/features/appointments/api';
import { AppointmentStatusBadge, patientOf } from '@/features/appointments/staff-components';
import { formatTime12h, todayLocal } from '@/lib/format';

export function DoctorDashboardPage() {
  const { user } = useAuth();
  const today = todayLocal();

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', 'doctor-dashboard', user?.id, today],
    queryFn: () => searchAppointments({ doctorId: user!.id, date: today, limit: 100 }),
    enabled: !!user,
    refetchInterval: 30_000,
  });

  const items = data?.items ?? [];
  const count = (s: string) => items.filter((a) => a.status === s).length;

  // "Continue" beats "next": if a consultation is already open, that's
  // what the doctor most needs one tap to get back to.
  const inProgress = items.find((a) => a.status === 'in_consultation');
  const nextUp = items.filter((a) => a.status === 'checked_in').sort((a, b) => a.tokenNumber - b.tokenNumber)[0];
  const focus = inProgress ?? nextUp;

  return (
    <div>
      <PageHeader title="Doctor" description="Your day at a glance." />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Today's patients" value={items.length} isLoading={isLoading} />
        <StatTile label="Waiting" value={count('checked_in')} hint="Checked in, ready to be seen" isLoading={isLoading} />
        <StatTile label="In consultation" value={count('in_consultation')} isLoading={isLoading} />
        <StatTile label="Completed" value={count('completed')} isLoading={isLoading} />
      </div>

      <Card className="mb-6 border-primary/30 bg-primary/5">
        <CardContent className="flex items-center justify-between gap-4 p-5">
          {isLoading ? (
            <Skeleton className="h-10 w-64" />
          ) : focus ? (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{inProgress ? 'In consultation' : 'Next patient'}</p>
                  <p className="font-medium">
                    {patientOf(focus)?.name} · Token #{focus.tokenNumber}
                  </p>
                </div>
              </div>
              <Link to={`/doctor/consultation/${focus._id}`}>
                <Button>
                  {inProgress ? 'Continue consultation' : 'Open consultation'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No one is waiting right now.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today's schedule</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 && !isLoading ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Nothing booked for today.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {items.map((a) => (
                  <tr key={a._id} className="border-t">
                    <td className="p-3 font-medium">{formatTime12h(a.scheduledTime)}</td>
                    <td className="p-3">
                      <Link to={`/doctor/consultation/${a._id}`} className="font-medium hover:underline">
                        {patientOf(a)?.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{patientOf(a)?.uhid}</p>
                    </td>
                    <td className="p-3 text-muted-foreground">#{a.tokenNumber}</td>
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
    </div>
  );
}
