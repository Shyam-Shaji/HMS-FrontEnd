import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarPlus, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cancelMyAppointment, fetchMyAppointments } from "@/features/appointments/api";
import type { Appointment, AppointmentStatus } from "@/features/appointments/types";
import { formatDate, formatTime12h, humanizeStatus } from "@/lib/format";
import { getErrorMessage } from "@/lib/api-client";

const UPCOMING_STATUSES: AppointmentStatus[] = ['booked', 'checked_in', 'in_consultation'];

function statusVariant(
  status: AppointmentStatus
): 'default' | 'destructive' | 'secondary' {
  switch (status) {
    case 'completed':
      return 'default';

    case 'cancelled':
    case 'no_show':
      return 'destructive';

    case 'checked_in':
    case 'in_consultation':
      return 'secondary';

    default:
      return 'secondary';
  }
}

function doctorName(doctorId: Appointment['doctorId']): string {
  return typeof doctorId === 'object' ? doctorId.name : 'your doctor';
}

export function AppointmentsPage() {
  const queryClient = useQueryClient();
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', 'me'],
    queryFn: fetchMyAppointments,
  });

  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => cancelMyAppointment(id, reason || undefined),
    onSuccess: () => {
      toast.success('Appointment cancelled');
      queryClient.invalidateQueries({ queryKey: ['appointments', 'me'] });
      setCancelTarget(null);
      setCancelReason('');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const upcoming = (appointments ?? [])
    .filter((a) => UPCOMING_STATUSES.includes(a.status))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const past = (appointments ?? [])
    .filter((a) => !UPCOMING_STATUSES.includes(a.status))
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  function renderList(list: Appointment[], emptyMessage: string) {
    if (isLoading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      );
    }
    if (list.length === 0) {
      return (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">{emptyMessage}</CardContent>
        </Card>
      );
    }
    return (
      <div className="flex flex-col gap-2">
        {list.map((appt) => (
          <Card key={appt._id}>
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <Link to={`/patient/appointments/${appt._id}`} className="flex-1">
                <p className="font-medium">Dr. {doctorName(appt.doctorId)}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {formatDate(appt.scheduledDate)} · {formatTime12h(appt.scheduledTime)} · Token #{appt.tokenNumber}
                </p>
              </Link>
              <div className="flex items-center gap-2">
                <Badge variant={statusVariant(appt.status)}>{humanizeStatus(appt.status)}</Badge>
                {UPCOMING_STATUSES.includes(appt.status) && appt.status === 'booked' && (
                  <Button variant="ghost" size="sm" onClick={() => setCancelTarget(appt)}>
                    Cancel
                  </Button>
                )}
                <Link to={`/patient/appointments/${appt._id}`}>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <PageHeader title="Appointments" description="Book, view, or manage your visits." />
        <Link to="/patient/appointments/book">
          <Button>
            <CalendarPlus className="h-4 w-4" />
            Book appointment
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">{renderList(upcoming, "No upcoming appointments. Book one when you're ready.")}</TabsContent>
        <TabsContent value="past">{renderList(past, 'No past appointments yet.')}</TabsContent>
      </Tabs>

      <Dialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this appointment?</DialogTitle>
            <DialogDescription>
              Your slot with Dr. {cancelTarget ? doctorName(cancelTarget.doctorId) : ''} will be released for other
              patients. This can't be undone.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason (optional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>
              Keep appointment
            </Button>
            <Button
              variant="destructive"
              disabled={cancelMutation.isPending}
              onClick={() => cancelTarget && cancelMutation.mutate({ id: cancelTarget._id, reason: cancelReason })}
            >
              {cancelMutation.isPending ? 'Cancelling…' : 'Cancel appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
