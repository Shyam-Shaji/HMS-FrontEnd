import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchWardBoard } from "../wards/api";
import { transferAdmission } from "./api";
import { getErrorMessage } from "@/lib/api-client";

export function TransferDialog({
  open,
  onOpenChange,
  admissionId,
  patientName,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  admissionId: string;
  patientName?: string;
}) {
  const queryClient = useQueryClient();
  const [wardId, setWardId] = useState('');
  const [bedId, setBedId] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) {
      setWardId('');
      setBedId('');
      setReason('');
    }
  }, [open]);

  const { data: board } = useQuery({ queryKey: ['wards', 'board'], queryFn: fetchWardBoard, enabled: open });
  const wardsWithVacancy = (board ?? []).filter((w) => w.beds.some((b) => b.status === 'vacant'));
  const vacantBeds = (board ?? []).find((w) => w.ward._id === wardId)?.beds.filter((b) => b.status === 'vacant') ?? [];

  const transfer = useMutation({
    mutationFn: () => transferAdmission(admissionId, { toWardId: wardId, toBedId: bedId, reason: reason || undefined }),
    onSuccess: () => {
      toast.success('Patient transferred — the old bed is now marked for cleaning');
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      queryClient.invalidateQueries({ queryKey: ['wards'] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer {patientName ?? 'patient'}</DialogTitle>
          <DialogDescription>Only vacant beds are offered. The bed being left goes to cleaning.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>To ward</Label>
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
          <div className="grid gap-2">
            <Label htmlFor="tr-reason">Reason (optional)</Label>
            <Input id="tr-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <Button disabled={!wardId || !bedId || transfer.isPending} onClick={() => transfer.mutate()}>
            {transfer.isPending ? 'Transferring…' : 'Transfer patient'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
