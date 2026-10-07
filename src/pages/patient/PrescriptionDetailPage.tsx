import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchMyPrescriptionById } from "@/features/prescriptions/api";
import { formatDate } from "@/lib/format";

export function PrescriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: rx, isLoading } = useQuery({
    queryKey: ['prescriptions', 'me', id],
    queryFn: () => fetchMyPrescriptionById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-xl space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!rx) return <p className="text-center text-sm text-muted-foreground">Prescription not found.</p>;

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/patient/prescriptions')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title="Prescription"
          description={`${formatDate(rx.createdAt)}${rx.doctorId ? ` · Dr. ${rx.doctorId.name}` : ''}`}
        />
      </div>

      <div className="flex flex-col gap-2">
        {rx.medicines.map((med) => {
          const fullyDispensed = med.quantity != null && med.quantityDispensed >= med.quantity;
          return (
            <Card key={med.lineId}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{med.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {med.dosage} · {med.frequency} · {med.duration}
                    </p>
                    {med.instructions && <p className="mt-1 text-sm text-muted-foreground">{med.instructions}</p>}
                  </div>
                  {med.quantity != null && (
                    <Badge variant={fullyDispensed ? 'success' : med.quantityDispensed > 0 ? 'warning' : 'secondary'}>
                      {med.quantityDispensed}/{med.quantity}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {rx.notes && (
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Doctor's notes</p>
              <p className="mt-1 text-sm">{rx.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
