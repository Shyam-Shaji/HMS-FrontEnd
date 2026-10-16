import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/context/auth-context';
import { searchPatients } from '@/features/patients/api';
import { searchDoctors, fetchDoctorSlots } from '@/features/doctors/api';
import { bookAppointment } from './api';
import { getErrorMessage } from '@/lib/api-client';
import { formatTime12h, todayLocal } from '@/lib/format';
import { useDebounce } from '@/lib/use-debounce';

interface PatientRef {
  _id: string;
  name: string;
  uhid: string;
}

// Desk-side booking: one form, everything visible at once (reception
// books dozens a day - a step-by-step wizard would cost them clicks).
// Used from the Appointments screen (no patient preset) and from a
// patient's own page (patient preset, so that step is skipped).
export function BookForPatientDialog({
  open,
  onOpenChange,
  presetPatient,
  defaultDoctorId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presetPatient?: PatientRef;
  defaultDoctorId?: string;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [patient, setPatient] = useState<PatientRef | null>(presetPatient ?? null);
  const [patientQuery, setPatientQuery] = useState('');
  const [doctorId, setDoctorId] = useState(defaultDoctorId ?? '');
  const [date, setDate] = useState(todayLocal());
  const [time, setTime] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  // Reset whenever the dialog is reopened so a previous booking's
  // selections never leak into the next one.
  useEffect(() => {
    if (open) {
      setPatient(presetPatient ?? null);
      setPatientQuery('');
      setDoctorId(defaultDoctorId ?? '');
      setDate(todayLocal());
      setTime(null);
      setReason('');
    }
  // Keyed on the preset patient's id, not the object itself - callers pass
  // a fresh object literal each render, which would otherwise wipe the
  // form on every parent re-render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, presetPatient?._id, defaultDoctorId]);

  const debouncedQuery = useDebounce(patientQuery);
  const { data: patientResults, isFetching: searchingPatients } = useQuery({
    queryKey: ['patients', 'search', debouncedQuery],
    queryFn: () => searchPatients({ q: debouncedQuery, limit: 5 }),
    enabled: open && !patient && debouncedQuery.length >= 2,
  });

  const { data: doctors } = useQuery({
    queryKey: ['doctors', user?.hospitalId],
    queryFn: () => searchDoctors({ hospitalId: user!.hospitalId! }),
    enabled: open && !!user?.hospitalId,
  });

  const { data: slots, isLoading: loadingSlots } = useQuery({
    queryKey: ['doctors', doctorId, 'slots', date],
    queryFn: () => fetchDoctorSlots(doctorId, date),
    enabled: open && !!doctorId && !!date,
  });

  const bookMutation = useMutation({
    mutationFn: () => bookAppointment({ patientId: patient!._id, doctorId, date, time: time!, reason: reason || undefined }),
    onSuccess: (appt) => {
      toast.success(`Booked — token #${appt.tokenNumber}`);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      onOpenChange(false);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const canSubmit = !!patient && !!doctorId && !!time && !bookMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book an appointment</DialogTitle>
          <DialogDescription>Pick the patient, doctor and a free slot.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Patient */}
          <div className="grid gap-2">
            <Label>Patient</Label>
            {patient ? (
              <div className="flex items-center justify-between rounded-md border bg-secondary/40 px-3 py-2 text-sm">
                <span>
                  <span className="font-medium">{patient.name}</span>
                  <span className="ml-2 text-muted-foreground">{patient.uhid}</span>
                </span>
                {!presetPatient && (
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setPatient(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search by name, phone or UHID"
                    value={patientQuery}
                    onChange={(e) => setPatientQuery(e.target.value)}
                    autoFocus
                  />
                </div>
                {searchingPatients && <Skeleton className="h-10 w-full" />}
                {patientResults?.items.map((p) => (
                  <button
                    key={p._id}
                    type="button"
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm hover:bg-accent"
                    onClick={() => setPatient({ _id: p._id, name: p.name, uhid: p.uhid })}
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted-foreground">
                      {p.uhid} · {p.phone}
                    </span>
                  </button>
                ))}
                {patientResults && patientResults.items.length === 0 && debouncedQuery.length >= 2 && (
                  <p className="text-sm text-muted-foreground">No match. Register the patient first from the Patients screen.</p>
                )}
              </>
            )}
          </div>

          {/* Doctor */}
          <div className="grid gap-2">
            <Label>Doctor</Label>
            <Select
              value={doctorId}
              onValueChange={(v) => {
                setDoctorId(v);
                setTime(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a doctor" />
              </SelectTrigger>
              <SelectContent>
                {(doctors ?? []).map((d) => (
                  <SelectItem key={d._id} value={d._id}>
                    Dr. {d.name}
                    {d.department ? ` — ${d.department}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date + slots */}
          <div className="grid gap-2">
            <Label htmlFor="book-date">Date</Label>
            <Input
              id="book-date"
              type="date"
              min={todayLocal()}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setTime(null);
              }}
            />
          </div>

          {doctorId &&
            (loadingSlots ? (
              <Skeleton className="h-20 w-full" />
            ) : (slots ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No slots on this day for this doctor.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {(slots ?? []).map((s) => (
                  <Button
                    key={s.time}
                    type="button"
                    size="sm"
                    variant={time === s.time ? 'default' : 'outline'}
                    disabled={!s.available}
                    onClick={() => setTime(s.time)}
                  >
                    {formatTime12h(s.time)}
                  </Button>
                ))}
              </div>
            ))}

          <div className="grid gap-2">
            <Label htmlFor="book-reason">Reason (optional)</Label>
            <Textarea id="book-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>

          <Button disabled={!canSubmit} onClick={() => bookMutation.mutate()}>
            {bookMutation.isPending ? 'Booking…' : 'Confirm booking'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
