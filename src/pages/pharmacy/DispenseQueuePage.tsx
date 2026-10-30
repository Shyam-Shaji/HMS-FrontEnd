import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDispenseQueue } from "@/features/pharmacy/api";
import type { Prescription } from "@/features/prescriptions/types";
import { timeAgo } from "@/lib/format";
import { DispenseDialog } from "./DispenseDialog";

export function DispenseQueuePage() {
  const [open, setOpen] = useState<Prescription | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['pharmacy', 'queue'],
    queryFn: fetchDispenseQueue,
    refetchInterval: 20_000,
  });

  return (
    <div>
      <PageHeader title="Dispense queue" description="Active prescriptions waiting to be dispensed, oldest first." />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (data ?? []).length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">Nothing waiting. New prescriptions appear here as doctors issue them.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="p-3 font-medium">Patient</th>
                  <th className="p-3 font-medium">Prescribed by</th>
                  <th className="p-3 font-medium">Medicines</th>
                  <th className="p-3 font-medium">Waiting</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {data!.map((rx) => (
                  <tr key={rx._id} className="border-t">
                    <td className="p-3">
                      <p className="font-medium">{rx.patientId?.name}</p>
                      <p className="text-xs text-muted-foreground">{rx.patientId?.uhid}</p>
                    </td>
                    <td className="p-3 text-muted-foreground">Dr. {rx.doctorId?.name}</td>
                    <td className="p-3 text-muted-foreground">{rx.medicines.length}</td>
                    <td className="p-3 text-muted-foreground">{timeAgo(rx.createdAt)}</td>
                    <td className="p-3">
                      {(rx.patientId?.allergies ?? []).length > 0 && <Badge variant="destructive" className="mr-1">Allergies</Badge>}
                      <Badge variant={rx.dispenseStatus === 'partially_dispensed' ? 'warning' : 'secondary'}>
                        {rx.dispenseStatus === 'partially_dispensed' ? 'Partially dispensed' : 'Pending'}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <Button size="sm" onClick={() => setOpen(rx)}>
                        Dispense
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <DispenseDialog prescription={open} onClose={() => setOpen(null)} />
    </div>
  );
}
