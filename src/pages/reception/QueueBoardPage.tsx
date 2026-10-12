import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Radio } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/auth-context";
import { searchDoctors } from "@/features/doctors/api";
import { useLiveQueue } from "@/features/appointments/use-live-queue";
import { todayLocal } from "@/lib/format";

// Built to be put on a waiting-room TV: huge, high-contrast, tokens only.
// Patient names are deliberately NOT shown - a public screen shouldn't
// announce who is seeing which doctor.
export function QueueBoardPage() {
  const { user } = useAuth();
  const [doctorId, setDoctorId] = useState('');
  const today = todayLocal();

  const { data: doctors } = useQuery({
    queryKey: ['doctors', user?.hospitalId],
    queryFn: () => searchDoctors({ hospitalId: user!.hospitalId! }),
    enabled: !!user?.hospitalId,
  });

  const { queue, isLoading } = useLiveQueue(user?.hospitalId ?? undefined, doctorId || undefined, today);

  const waiting = (queue?.queue ?? []).filter((a) => a.status === 'checked_in');
  const expected = (queue?.queue ?? []).filter((a) => a.status === 'booked');

  return (
    <div>
      <PageHeader title="Queue board" description="Live token status. Open this on the waiting-room display." />

      <div className="mb-6 max-w-xs">
        <Select value={doctorId} onValueChange={setDoctorId}>
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

      {!doctorId ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">Choose a doctor to see their live queue.</CardContent>
        </Card>
      ) : isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="border-primary bg-primary text-primary-foreground lg:col-span-1">
            <CardContent className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center">
              <p className="text-sm font-medium uppercase tracking-widest opacity-80">Now serving</p>
              <p className="text-8xl font-bold tabular-nums">{queue?.nowServingToken ?? '—'}</p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardContent className="grid gap-6 p-6">
              <div>
                <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Waiting — checked in ({waiting.length})
                </p>
                <div className="flex flex-wrap gap-3">
                  {waiting.length === 0 && <p className="text-sm text-muted-foreground">No one waiting.</p>}
                  {waiting.map((a) => (
                    <span
                      key={a._id}
                      className="flex h-16 min-w-16 items-center justify-center rounded-lg bg-secondary px-4 text-3xl font-bold tabular-nums"
                    >
                      {a.tokenNumber}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Expected — not yet arrived ({expected.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {expected.length === 0 && <p className="text-sm text-muted-foreground">None.</p>}
                  {expected.map((a) => (
                    <span
                      key={a._id}
                      className="flex h-10 min-w-10 items-center justify-center rounded-md border px-3 text-lg font-medium tabular-nums text-muted-foreground"
                    >
                      {a.tokenNumber}
                    </span>
                  ))}
                </div>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Radio className="h-3 w-3" /> Updates live.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
