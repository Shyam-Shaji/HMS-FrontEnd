import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { createLeave, fetchAvailability, fetchLeave, saveAvailability } from '@/features/doctors/api';
import type { AvailabilityBlock } from '@/features/doctors/types';
import { getErrorMessage } from '@/lib/api-client';
import { formatDate, formatTime12h } from '@/lib/format';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// Monday-first reads naturally for a working week.
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

type DayBlocks = Record<number, { startTime: string; endTime: string; slotDurationMinutes: number }[]>;

function toDayBlocks(blocks: AvailabilityBlock[]): DayBlocks {
  const out: DayBlocks = {};
  for (const b of blocks) {
    (out[b.dayOfWeek] ??= []).push({ startTime: b.startTime, endTime: b.endTime, slotDurationMinutes: b.slotDurationMinutes });
  }
  return out;
}

export function DoctorSchedulePage() {
  const { user } = useAuth();
  const doctorId = user!.id;
  const queryClient = useQueryClient();

  const { data: saved, isLoading } = useQuery({
    queryKey: ['doctors', doctorId, 'availability'],
    queryFn: () => fetchAvailability(doctorId),
  });
  const { data: leaves } = useQuery({
    queryKey: ['doctors', doctorId, 'leave'],
    queryFn: () => fetchLeave(doctorId),
  });

  const [days, setDays] = useState<DayBlocks>({});
  useEffect(() => {
    if (saved) setDays(toDayBlocks(saved));
  }, [saved]);

  const flat: AvailabilityBlock[] = DAY_ORDER.flatMap((d) => (days[d] ?? []).map((b) => ({ dayOfWeek: d, ...b })));
  const invalid = flat.find((b) => !b.startTime || !b.endTime || b.endTime <= b.startTime || b.slotDurationMinutes < 5);

  const save = useMutation({
    mutationFn: () => saveAvailability(doctorId, flat),
    onSuccess: () => {
      toast.success('Schedule saved');
      queryClient.invalidateQueries({ queryKey: ['doctors', doctorId] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const addBlock = (d: number) =>
    setDays((cur) => ({ ...cur, [d]: [...(cur[d] ?? []), { startTime: '09:00', endTime: '13:00', slotDurationMinutes: 15 }] }));
  const patchBlock = (d: number, i: number, patch: Partial<DayBlocks[number][number]>) =>
    setDays((cur) => ({ ...cur, [d]: cur[d].map((b, j) => (j === i ? { ...b, ...patch } : b)) }));
  const removeBlock = (d: number, i: number) => setDays((cur) => ({ ...cur, [d]: cur[d].filter((_, j) => j !== i) }));

  // ---- leave ----
  const [leaveDate, setLeaveDate] = useState('');
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');
  const [reason, setReason] = useState('');
  const addLeave = useMutation({
    mutationFn: () =>
      createLeave(doctorId, {
        date: leaveDate,
        fromTime: fromTime || undefined,
        toTime: toTime || undefined,
        reason: reason || undefined,
      }),
    onSuccess: () => {
      toast.success('Time off blocked');
      queryClient.invalidateQueries({ queryKey: ['doctors', doctorId, 'leave'] });
      setLeaveDate('');
      setFromTime('');
      setToTime('');
      setReason('');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="max-w-3xl">
      <PageHeader title="My schedule" description="The hours patients can book you, week by week." />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Weekly hours</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            DAY_ORDER.map((d) => (
              <div key={d} className="grid gap-2 border-b pb-3 last:border-0 last:pb-0 sm:grid-cols-[110px_1fr]">
                <p className="pt-2 text-sm font-medium">{DAYS[d]}</p>
                <div className="grid gap-2">
                  {(days[d] ?? []).length === 0 && <p className="pt-2 text-sm text-muted-foreground">Not available</p>}
                  {(days[d] ?? []).map((b, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2">
                      <Input type="time" className="w-32" value={b.startTime} onChange={(e) => patchBlock(d, i, { startTime: e.target.value })} />
                      <span className="text-muted-foreground">to</span>
                      <Input type="time" className="w-32" value={b.endTime} onChange={(e) => patchBlock(d, i, { endTime: e.target.value })} />
                      <Input
                        type="number"
                        min={5}
                        step={5}
                        className="w-20"
                        value={b.slotDurationMinutes}
                        onChange={(e) => patchBlock(d, i, { slotDurationMinutes: Number(e.target.value) })}
                      />
                      <span className="text-xs text-muted-foreground">min slots</span>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeBlock(d, i)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => addBlock(d)}>
                    <Plus className="h-4 w-4" /> Add hours
                  </Button>
                </div>
              </div>
            ))
          )}

          {invalid && <p className="text-sm text-destructive">Each block needs an end time after its start, and slots of at least 5 minutes.</p>}
          {flat.length === 0 && !isLoading && <p className="text-sm text-muted-foreground">Add at least one block of hours to save.</p>}
          <p className="text-xs text-muted-foreground">Changes apply to future bookings. Appointments already booked aren't affected.</p>
          <Button className="w-fit" disabled={save.isPending || flat.length === 0 || !!invalid} onClick={() => save.mutate()}>
            {save.isPending ? 'Saving…' : 'Save schedule'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Time off</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2 sm:grid-cols-[auto_auto_auto_1fr_auto]">
            <Input type="date" value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} />
            <Input type="time" value={fromTime} onChange={(e) => setFromTime(e.target.value)} aria-label="From time (optional)" />
            <Input type="time" value={toTime} onChange={(e) => setToTime(e.target.value)} aria-label="To time (optional)" />
            <Input placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
            <Button disabled={!leaveDate || addLeave.isPending || (!!fromTime !== !!toTime)} onClick={() => addLeave.mutate()}>
              Block
            </Button>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">Leave the times empty to block the whole day.</p>

          {(leaves ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No time off scheduled.</p>
          ) : (
            <ul className="grid gap-1.5 text-sm">
              {leaves!.map((l) => (
                <li key={l._id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="font-medium">{formatDate(l.date)}</span>
                  <span className="text-muted-foreground">
                    {l.fromTime && l.toTime ? `${formatTime12h(l.fromTime)} – ${formatTime12h(l.toTime)}` : 'Whole day'}
                    {l.reason ? ` · ${l.reason}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
