import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BedDouble } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { searchAdmissions } from '@/features/admissions/api';
import { formatDate } from '@/lib/format';

function daysSince(iso: string): number {
  return Math.max(1, Math.ceil((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

export function DoctorRoundsPage() {
  const { user } = useAuth();
  const [mineOnly, setMineOnly] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['admissions', 'rounds', mineOnly ? user?.id : 'all'],
    queryFn: () =>
      searchAdmissions({ status: 'admitted', admittingDoctorId: mineOnly ? user!.id : undefined, limit: 100 }),
    enabled: !!user,
  });

  const items = data?.items ?? [];

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <PageHeader title="Ward rounds" description="Admitted patients, for bedside rounds." />
        <div className="flex gap-1 rounded-md bg-muted p-1">
          <Button size="sm" variant={mineOnly ? 'default' : 'ghost'} onClick={() => setMineOnly(true)}>
            My patients
          </Button>
          <Button size="sm" variant={!mineOnly ? 'default' : 'ghost'} onClick={() => setMineOnly(false)}>
            All admitted
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <BedDouble className="h-7 w-7 text-muted-foreground" />
            <p className="font-medium">No admitted patients</p>
          </CardContent>
        </Card>
      ) : (
        // Big cards, not a dense table: this screen is used on a tablet at
        // the bedside, so tap targets matter more than row density.
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((a) => {
            const p = typeof a.patientId === 'object' ? a.patientId : null;
            const ward = typeof a.wardId === 'object' ? a.wardId : null;
            const bed = typeof a.bedId === 'object' ? a.bedId : null;
            return (
              <Link key={a._id} to={`/doctor/rounds/${a._id}`}>
                <Card className="h-full transition-colors hover:bg-accent">
                  <CardContent className="grid gap-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{p?.name}</p>
                        <p className="text-xs text-muted-foreground">{p?.uhid}</p>
                      </div>
                      <Badge variant="secondary">
                        {ward?.name} · Bed {bed?.bedNumber}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {a.provisionalDiagnosis || a.reasonForAdmission || 'No diagnosis recorded'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Admitted {formatDate(a.admissionDate)} · Day {daysSince(a.admissionDate)}
                      {a.admissionType === 'emergency' ? ' · Emergency' : ''}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
