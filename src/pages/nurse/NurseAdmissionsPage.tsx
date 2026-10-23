import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdmitDialog } from "@/features/admissions/AdmitDialog";
import { completeNurseChecklist, searchAdmissions } from "@/features/admissions/api";
import type { Admission } from "@/features/admissions/types";
import { getErrorMessage } from "@/lib/api-client";
import { formatDate } from "@/lib/format";

const pName = (a: Admission) => (typeof a.patientId === 'object' ? a.patientId.name : 'Patient');
const pUhid = (a: Admission) => (typeof a.patientId === 'object' ? a.patientId.uhid : '');
const wardBed = (a: Admission) =>
  `${typeof a.wardId === 'object' ? a.wardId.name : ''} · Bed ${typeof a.bedId === 'object' ? a.bedId.bedNumber : ''}`;

export function NurseAdmissionsPage() {
  const queryClient = useQueryClient();
  const [showAdmit, setShowAdmit] = useState(false);
  const [filter, setFilter] = useState('');

  const { data: admitted, isLoading } = useQuery({
    queryKey: ['admissions', 'list', 'admitted'],
    queryFn: () => searchAdmissions({ status: 'admitted', limit: 100 }),
    refetchInterval: 30_000,
  });
  const { data: discharged } = useQuery({
    queryKey: ['admissions', 'list', 'discharged'],
    queryFn: () => searchAdmissions({ status: 'discharged', limit: 50 }),
  });

  const pendingChecklist = (discharged?.items ?? []).filter((a) => !a.dischargeSummary?.nurseChecklistCompleted);
  const rows = (admitted?.items ?? []).filter((a) => `${pName(a)} ${pUhid(a)}`.toLowerCase().includes(filter.toLowerCase()));

  const checklist = useMutation({
    mutationFn: (id: string) => completeNurseChecklist(id),
    onSuccess: () => {
      toast.success('Discharge checklist completed');
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <PageHeader title="Admissions" description="Patients currently in the wards." />
        <Button onClick={() => setShowAdmit(true)}>
          <UserPlus className="h-4 w-4" /> Admit patient
        </Button>
      </div>

      <Tabs defaultValue="admitted">
        <TabsList>
          <TabsTrigger value="admitted">Admitted ({admitted?.total ?? 0})</TabsTrigger>
          <TabsTrigger value="discharge">Discharge checklist ({pendingChecklist.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="admitted">
          <Input className="mb-3 max-w-xs" placeholder="Filter by name or UHID" value={filter} onChange={(e) => setFilter(e.target.value)} />
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-2 p-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : rows.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">No admitted patients.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="p-3 font-medium">Patient</th>
                      <th className="p-3 font-medium">Ward / bed</th>
                      <th className="p-3 font-medium">Doctor</th>
                      <th className="p-3 font-medium">Admitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((a) => (
                      <tr key={a._id} className="border-t hover:bg-accent">
                        <td className="p-3">
                          <Link to={`/nurse/admissions/${a._id}`} className="font-medium hover:underline">
                            {pName(a)}
                          </Link>
                          <p className="text-xs text-muted-foreground">{pUhid(a)}</p>
                        </td>
                        <td className="p-3 text-muted-foreground">{wardBed(a)}</td>
                        <td className="p-3 text-muted-foreground">Dr. {typeof a.admittingDoctorId === 'object' ? a.admittingDoctorId.name : ''}</td>
                        <td className="p-3 text-muted-foreground">{formatDate(a.admissionDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discharge">
          <Card>
            <CardContent className="p-0">
              {pendingChecklist.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">No discharges waiting on a nursing checklist.</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {pendingChecklist.map((a) => (
                      <tr key={a._id} className="border-t first:border-0">
                        <td className="p-3">
                          <p className="font-medium">{pName(a)}</p>
                          <p className="text-xs text-muted-foreground">{pUhid(a)}</p>
                        </td>
                        <td className="p-3 text-muted-foreground">Discharged {formatDate(a.dischargeDate)}</td>
                        <td className="p-3 text-right">
                          <Button size="sm" disabled={checklist.isPending} onClick={() => checklist.mutate(a._id)}>
                            Complete checklist
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AdmitDialog open={showAdmit} onOpenChange={setShowAdmit} />
    </div>
  );
}
