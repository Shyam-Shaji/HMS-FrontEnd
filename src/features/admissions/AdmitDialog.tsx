import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
import { searchPatients } from "../patients/api";
import { searchDoctors } from "../doctors/api";
import { fetchWardBoard } from "../wards/api";
import { admitPatient } from "./api";
import { getErrorMessage } from "@/lib/api-client";
import { useDebounce } from "@/lib/use-debounce";

interface PresetBed {
  wardId: string;
  bedId: string;
  label: string;
}

export function AdmitDialog({
  open,
  onOpenChange,
  presetBed,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presetBed?: PresetBed;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [patient, setPatient] = useState<{ _id: string; name: string; uhid: string } | null>(null);
  const [q, setQ] = useState('');
  const [wardId, setWardId] = useState('');
  const [bedId, setBedId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [type, setType] = useState<'emergency' | 'planned'>('planned');
  const [reason, setReason] = useState('');
  const [dx, setDx] = useState('');

  // Reset on open, keyed on the preset bed's id (not the object) so a
  // caller's fresh object literal can't wipe the form mid-typing.
  useEffect(() => {
    if (open) {
      setPatient(null);
      setQ('');
      setWardId(presetBed?.wardId ?? '');
      setBedId(presetBed?.bedId ?? '');
      setDoctorId('');
      setType('planned');
      setReason('');
      setDx('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, presetBed?.bedId]);

  const debouncedQ = useDebounce(q);
  const { data: results, isFetching } = useQuery({
    queryKey: ['patients', 'search', debouncedQ],
    queryFn: () => searchPatients({ q: debouncedQ, limit: 5 }),
    enabled: open && !patient && debouncedQ.length >= 2,
  });
  const { data: doctors } = useQuery({
    queryKey: ['doctors', user?.hospitalId],
    queryFn: () => searchDoctors({ hospitalId: user!.hospitalId! }),
    enabled: open && !!user?.hospitalId,
  });
  const { data: board } = useQuery({ queryKey: ['wards', 'board'], queryFn: fetchWardBoard, enabled: open && !presetBed });

  const wardsWithVacancy = (board ?? []).filter((w) => w.beds.some((b) => b.status === 'vacant'));
  const vacantBeds = (board ?? []).find((w) => w.ward._id === wardId)?.beds.filter((b) => b.status === 'vacant') ?? [];

  const admit = useMutation({
    mutationFn: () =>
      admitPatient({
        patientId: patient!._id,
        wardId,
        bedId,
        admissionType: type,
        admittingDoctorId: doctorId,
        reasonForAdmission: reason || undefined,
        provisionalDiagnosis: dx || undefined,
      }),
    onSuccess: () => {
      toast.success(`${patient!.name} admitted`);
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      queryClient.invalidateQueries({ queryKey: ['wards'] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const canSubmit = !!patient && !!wardId && !!bedId && !!doctorId && !admit.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Admit a patient</DialogTitle>
          <DialogDescription>{presetBed ? `Into ${presetBed.label}.` : 'Choose a patient and a vacant bed.'}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Patient</Label>
            {patient ? (
              <div className="flex items-center justify-between rounded-md border bg-secondary/40 px-3 py-2 text-sm">
                <span>
                  <span className="font-medium">{patient.name}</span>
                  <span className="ml-2 text-muted-foreground">{patient.uhid}</span>
                </span>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setPatient(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Search by name, phone or UHID" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
                </div>
                {isFetching && <Skeleton className="h-10 w-full" />}
                {results?.items.map((p) => (
                  <button
                    key={p._id}
                    type="button"
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm hover:bg-accent"
                    onClick={() => setPatient({ _id: p._id, name: p.name, uhid: p.uhid })}
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted-foreground">{p.uhid}</span>
                  </button>
                ))}
              </>
            )}
          </div>

          {!presetBed && (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Ward</Label>
                <Select
                  value={wardId}
                  onValueChange={(v) => {
                    setWardId(v);
                    setBedId('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ward" />
                  </SelectTrigger>
                  <SelectContent>
                    {wardsWithVacancy.map((w) => (
                      <SelectItem key={w.ward._id} value={w.ward._id}>
                        {w.ward.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Bed</Label>
                <Select value={bedId} onValueChange={setBedId} disabled={!wardId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bed" />
                  </SelectTrigger>
                  <SelectContent>
                    {vacantBeds.map((b) => (
                      <SelectItem key={b._id} value={b._id}>
                        Bed {b.bedNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Admitting doctor</Label>
              <Select value={doctorId} onValueChange={setDoctorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                  {(doctors ?? []).map((d) => (
                    <SelectItem key={d._id} value={d._id}>
                      Dr. {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="adm-dx">Provisional diagnosis (optional)</Label>
            <Input id="adm-dx" value={dx} onChange={(e) => setDx(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="adm-reason">Reason for admission (optional)</Label>
            <Textarea id="adm-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>

          <Button disabled={!canSubmit} onClick={() => admit.mutate()}>
            {admit.isPending ? 'Admitting…' : 'Admit patient'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
