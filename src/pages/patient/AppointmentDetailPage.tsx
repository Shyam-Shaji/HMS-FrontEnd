import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Clock, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle 
} from "@/components/ui/dialog";
import { cancelMyAppointment, fetchMyAppointments } from "@/features/appointments/api";
import { useLiveQueue } from "@/features/appointments/use-live-queue";
import { formatDate, formatTime12h, humanizeStatus } from "@/lib/format";
import { getErrorMessage } from "@/lib/api-client";

export function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCancel, setShowCancel] = useState(false);
  const [reason, setReason] = useState('');

  // No single-appointment GET exists for patients on the backend yet -
  // the list (already fetched elsewhere in the app and cached by React
  // Query) is the source of truth here instead of a dedicated fetch.
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', 'me'],
    queryFn: fetchMyAppointments,
  });
  const appointment = appointments?.find((a) => a._id === id);

  const doctor = appointment && typeof appointment.doctorId === 'object' ? appointment.doctorId : null;

  const { queue } = useLiveQueue(
    appointment?.hospitalId,
    doctor?._id,
    appointment?.scheduledDate.slice(0, 10),
  );

  const myPosition = queue?.queue.findIndex((q) => q._id === id) ?? -1;
  const peopleAhead = myPosition >= 0 ? queue!.queue.slice(0, myPosition).filter((q) => q.status !== 'in_consultation').length : null;

  const cancelMutation = useMutation({
    mutationFn: () => cancelMyAppointment(id!, reason || undefined),
    onSuccess: () => {
      toast.success('Appointment cancelled');
      queryClient.invalidateQueries({ queryKey: ['appointments', 'me'] });
      navigate('/patient/appointments');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-xl space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="mx-auto max-w-xl text-center text-sm text-muted-foreground">
        Appointment not found.
        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate('/patient/appointments')}>
            Back to appointments
          </Button>
        </div>
      </div>
    );
  }

  const isLive = appointment.status === 'checked_in' || appointment.status === 'in_consultation';

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/patient/appointments')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader title={doctor ? `Dr. ${doctor.name}` : 'Appointment'} description={doctor?.department} />
      </div>

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-2 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">When</span>
            <span className="font-medium">
              {formatDate(appointment.scheduledDate)} · {formatTime12h(appointment.scheduledTime)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Token number</span>
            <span className="font-medium">#{appointment.tokenNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={appointment.status === 'cancelled' ? 'destructive' : 'secondary'}>
              {humanizeStatus(appointment.status)}
            </Badge>
          </div>
          {appointment.reason && (
            <div className="flex justify-between gap-4">
              <span className="shrink-0 text-muted-foreground">Reason</span>
              <span className="text-right font-medium">{appointment.reason}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live queue status - only meaningful the day of, once checked in
          or for a same-day booked slot; this is the "you are #4, ~N ahead"
          screen the whole product is built around. */}
      {isLive || appointment.status === 'booked' ? (
        <Card className="mb-4 border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Users className="h-5 w-5" />
            </div>
            <div>
              {queue?.nowServingToken != null ? (
                <>
                  <p className="font-medium">Now serving token #{queue.nowServingToken}</p>
                  <p className="text-sm text-muted-foreground">
                    {peopleAhead != null && peopleAhead > 0
                      ? `${peopleAhead} patient${peopleAhead === 1 ? '' : 's'} ahead of you`
                      : 'You may be called next'}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Queue hasn't started yet today.</p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {appointment.status === 'booked' && (
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setShowCancel(true)}>
            Cancel
          </Button>
        </div>
      )}

      <Dialog open={showCancel} onOpenChange={setShowCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this appointment?</DialogTitle>
            <DialogDescription>Your slot will be released for other patients. This can't be undone.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancel(false)}>
              Keep appointment
            </Button>
            <Button variant="destructive" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate()}>
              {cancelMutation.isPending ? 'Cancelling…' : 'Cancel appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        Live updates - this page refreshes automatically.
      </div>
    </div>
  );
}
 