import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Radio } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { startConsultation } from '@/features/appointments/api';
import { useLiveQueue } from '@/features/appointments/use-live-queue';
import { AppointmentStatusBadge, patientOf } from '@/features/appointments/staff-components';
import { getErrorMessage } from '@/lib/api-client';
import { formatTime12h, todayLocal } from '@/lib/format';

export function DoctorQueuePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { queue, isLoading } = useLiveQueue(user?.hospitalId ?? undefined, user?.id, todayLocal());

  const start = useMutation({
    mutationFn: (id: string) => startConsultation(id),
    onSuccess: (appt) => navigate(`/doctor/consultation/${appt._id}`),
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const rows = queue?.queue ?? [];

  return (
    <div>
      <PageHeader title="Patient queue" description="Today's patients in token order." />
      <p className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Radio className="h-3 w-3" /> Updates live as reception checks patients in.
      </p>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">The queue is empty.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="p-3 font-medium">Token</th>
                  <th className="p-3 font-medium">Patient</th>
                  <th className="p-3 font-medium">Slot</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a._id} className="border-t">
                    <td className="p-3 text-lg font-semibold tabular-nums">#{a.tokenNumber}</td>
                    <td className="p-3">
                      <p className="font-medium">{patientOf(a)?.name}</p>
                      <p className="text-xs text-muted-foreground">{patientOf(a)?.uhid}</p>
                    </td>
                    <td className="p-3 text-muted-foreground">{formatTime12h(a.scheduledTime)}</td>
                    <td className="p-3">
                      <AppointmentStatusBadge status={a.status} />
                    </td>
                    <td className="p-3 text-right">
                      {a.status === 'checked_in' && (
                        <Button size="sm" disabled={start.isPending} onClick={() => start.mutate(a._id)}>
                          Start consultation
                        </Button>
                      )}
                      {a.status === 'in_consultation' && (
                        <Button size="sm" variant="outline" onClick={() => navigate(`/doctor/consultation/${a._id}`)}>
                          Continue
                        </Button>
                      )}
                      {a.status === 'booked' && <span className="text-xs text-muted-foreground">Not arrived</span>}
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
