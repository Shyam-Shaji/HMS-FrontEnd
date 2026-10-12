import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
    Dialog ,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cancelAppointment, checkInAppointment, markAppointmentNoShow } from "./api";
import type { Appointment, AppointmentStatus, PopulatedRef } from "./types";
import { getErrorMessage } from "@/lib/api-client";
import { humanizeStatus } from "@/lib/format";

export function patientOf(a: Appointment): PopulatedRef | null {
  return typeof a.patientId === 'object' ? a.patientId : null;
}

export function doctorOf(a: Appointment): PopulatedRef | null {
  return typeof a.doctorId === 'object' ? a.doctorId : null;
}

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const variant =
    status === 'completed'
      ? 'success'
      : status === 'checked_in' || status === 'in_consultation'
        ? 'warning'
        : status === 'cancelled' || status === 'no_show'
          ? 'destructive'
          : 'secondary';
  return <Badge variant={variant}>{humanizeStatus(status)}</Badge>;
}

// Reception's per-row actions. Which buttons appear depends on status -
// e.g. you can only check in a "booked" appointment - so the UI never
// offers an action the backend would reject.
export function ReceptionRowActions({ appointment }: { appointment: Appointment }) {
  const queryClient = useQueryClient();
  const [showCancel, setShowCancel] = useState(false);
  const [reason, setReason] = useState('');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['appointments'] });

  const checkIn = useMutation({
    mutationFn: () => checkInAppointment(appointment._id),
    onSuccess: () => {
      toast.success('Checked in');
      invalidate();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const noShow = useMutation({
    mutationFn: () => markAppointmentNoShow(appointment._id),
    onSuccess: () => {
      toast.success('Marked as no-show');
      invalidate();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const cancel = useMutation({
    mutationFn: () => cancelAppointment(appointment._id, reason || undefined),
    onSuccess: () => {
      toast.success('Appointment cancelled');
      invalidate();
      setShowCancel(false);
      setReason('');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (appointment.status !== 'booked' && appointment.status !== 'checked_in') return null;

  return (
    <div className="flex items-center justify-end gap-1">
      {appointment.status === 'booked' && (
        <>
          <Button size="sm" disabled={checkIn.isPending} onClick={() => checkIn.mutate()}>
            Check in
          </Button>
          <Button size="sm" variant="ghost" disabled={noShow.isPending} onClick={() => noShow.mutate()}>
            No-show
          </Button>
        </>
      )}
      <Button size="sm" variant="ghost" onClick={() => setShowCancel(true)}>
        Cancel
      </Button>

      <Dialog open={showCancel} onOpenChange={setShowCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this appointment?</DialogTitle>
            <DialogDescription>The slot is released for other patients.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancel(false)}>
              Keep
            </Button>
            <Button variant="destructive" disabled={cancel.isPending} onClick={() => cancel.mutate()}>
              {cancel.isPending ? 'Cancelling…' : 'Cancel appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
