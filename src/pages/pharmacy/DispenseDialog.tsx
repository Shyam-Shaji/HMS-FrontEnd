import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AllergyBanner } from "@/components/clinical/AllergyBanner";
import { dispensePrescription, searchMedicines } from "@/features/pharmacy/api";
import type { DispenseRecord, Medicine } from "@/features/pharmacy/types";
import type { Prescription } from "@/features/prescriptions/types";
import { getErrorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";

interface LineState {
  medicineId: string;
  qty: string;
  include: boolean;
}

// The doctor prescribes in free text ("Amoxicillin 500mg"); the pharmacist
// maps each line to a real catalogue item. Pre-select the obvious match so
// the common case is one click, but never silently - an inexact match is
// flagged so it gets a second look.
function autoMatch(name: string, catalogue: Medicine[]): { medicine?: Medicine; exact: boolean } {
  const n = name.trim().toLowerCase();
  const exact = catalogue.find((m) => m.name.toLowerCase() === n);
  if (exact) return { medicine: exact, exact: true };
  const loose = catalogue.find((m) => m.name.toLowerCase().includes(n) || n.includes(m.name.toLowerCase()));
  return { medicine: loose, exact: false };
}

function matchesAllergy(med: Medicine | undefined, allergies: string[]): string | null {
  if (!med) return null;
  const haystack = `${med.name} ${med.genericName ?? ''}`.toLowerCase();
  return allergies.find((a) => a.trim() && haystack.includes(a.trim().toLowerCase())) ?? null;
}

export function DispenseDialog({ prescription, onClose }: { prescription: Prescription | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [lines, setLines] = useState<Record<string, LineState>>({});
  const [initFor, setInitFor] = useState<string | null>(null);
  const [result, setResult] = useState<DispenseRecord | null>(null);

  const { data: catalogue, isLoading } = useQuery({
    queryKey: ['pharmacy', 'medicines', ''],
    queryFn: () => searchMedicines(),
    enabled: !!prescription,
  });

  const allergies = prescription?.patientId?.allergies ?? [];

  useEffect(() => {
    if (!prescription) {
      setInitFor(null);
      setResult(null);
      return;
    }
    if (!catalogue || initFor === prescription._id) return;
    const next: Record<string, LineState> = {};
    for (const m of prescription.medicines) {
      const remaining = m.quantity != null ? m.quantity - m.quantityDispensed : null;
      const { medicine } = autoMatch(m.name, catalogue);
      next[m.lineId] = {
        medicineId: medicine?._id ?? '',
        qty: remaining != null && remaining > 0 ? String(remaining) : '',
        include: !!medicine && remaining !== 0 && remaining != null,
      };
    }
    setLines(next);
    setInitFor(prescription._id);
  }, [prescription, catalogue, initFor]);

  const patch = (lineId: string, p: Partial<LineState>) => setLines((cur) => ({ ...cur, [lineId]: { ...cur[lineId], ...p } }));
  const medById = (id: string) => (catalogue ?? []).find((m) => m._id === id);

  const included = prescription?.medicines.filter((m) => lines[m.lineId]?.include) ?? [];
  const problems = included.map((m) => {
    const st = lines[m.lineId];
    const qty = Number(st.qty);
    const med = medById(st.medicineId);
    if (!st.medicineId) return 'Choose a medicine';
    if (!Number.isInteger(qty) || qty < 1) return 'Enter a whole quantity';
    if (med && qty > med.totalAvailable) return `Only ${med.totalAvailable} in stock`;
    return null;
  });
  const canSubmit = included.length > 0 && problems.every((p) => !p);

  const dispense = useMutation({
    mutationFn: () =>
      dispensePrescription(prescription!._id, {
        items: included.map((m) => ({
          prescriptionLineId: m.lineId,
          medicineId: lines[m.lineId].medicineId,
          quantity: Number(lines[m.lineId].qty),
        })),
      }),
    onSuccess: (record) => {
      setResult(record);
      queryClient.invalidateQueries({ queryKey: ['pharmacy'] });
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <Dialog open={!!prescription} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        {result ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" /> Dispensed
              </DialogTitle>
              <DialogDescription>
                Stock was drawn from the earliest-expiring batches first. Hand over exactly these:
              </DialogDescription>
            </DialogHeader>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="py-2 font-medium">Medicine</th>
                  <th className="py-2 font-medium">Batch</th>
                  <th className="py-2 text-right font-medium">Qty</th>
                  <th className="py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((it, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-2 font-medium">{it.medicineName}</td>
                    <td className="py-2 text-muted-foreground">{it.batchNumber}</td>
                    <td className="py-2 text-right">{it.quantity}</td>
                    <td className="py-2 text-right">{formatCurrency(it.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t font-semibold">
                  <td className="py-2" colSpan={3}>
                    Total
                  </td>
                  <td className="py-2 text-right">{formatCurrency(result.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
            <DialogFooter>
              <Button onClick={onClose}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Dispense — {prescription?.patientId?.name}</DialogTitle>
              <DialogDescription>
                {prescription?.patientId?.uhid}
                {prescription?.doctorId ? ` · Prescribed by Dr. ${prescription.doctorId.name}` : ''}
              </DialogDescription>
            </DialogHeader>

            <AllergyBanner allergies={allergies} />

            {isLoading || !catalogue ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <div className="grid gap-3">
                {prescription?.medicines.map((m, idx) => {
                  const st = lines[m.lineId];
                  if (!st) return null;
                  const remaining = m.quantity != null ? m.quantity - m.quantityDispensed : null;
                  const done = remaining === 0;
                  const med = medById(st.medicineId);
                  const { exact } = autoMatch(m.name, catalogue);
                  const allergyHit = matchesAllergy(med, allergies);
                  const includedIdx = included.findIndex((x) => x.lineId === m.lineId);
                  const problem = includedIdx >= 0 ? problems[includedIdx] : null;

                  return (
                    <div key={m.lineId} className={`rounded-md border p-3 ${done ? 'opacity-60' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{m.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {m.dosage} · {m.frequency} · {m.duration}
                          </p>
                          {m.instructions && <p className="text-xs text-muted-foreground">{m.instructions}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {done ? (
                            <Badge variant="success">Fully dispensed</Badge>
                          ) : remaining != null ? (
                            <Badge variant={m.quantityDispensed > 0 ? 'warning' : 'secondary'}>
                              {remaining} of {m.quantity} remaining
                            </Badge>
                          ) : (
                            <Badge variant="secondary">No quantity set</Badge>
                          )}
                          {!done && (
                            <label className="flex cursor-pointer items-center gap-1.5 text-xs">
                              <input
                                type="checkbox"
                                checked={st.include}
                                onChange={(e) => patch(m.lineId, { include: e.target.checked })}
                              />
                              Dispense this line
                            </label>
                          )}
                        </div>
                      </div>

                      {!done && st.include && (
                        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_120px]">
                          <Select value={st.medicineId} onValueChange={(v) => patch(m.lineId, { medicineId: v })}>
                            <SelectTrigger aria-label={`Medicine for line ${idx + 1}`}>
                              <SelectValue placeholder="Match to a catalogue medicine" />
                            </SelectTrigger>
                            <SelectContent>
                              {catalogue.map((c) => (
                                <SelectItem key={c._id} value={c._id}>
                                  {c.name} — {c.totalAvailable} in stock
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            min={1}
                            inputMode="numeric"
                            placeholder="Qty"
                            value={st.qty}
                            onChange={(e) => patch(m.lineId, { qty: e.target.value })}
                          />
                        </div>
                      )}

                      {!done && st.include && med && !exact && (
                        <p className="mt-2 text-xs text-warning">Matched by similar name — confirm this is the right medicine.</p>
                      )}
                      {allergyHit && (
                        <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-destructive">
                          <AlertTriangle className="h-4 w-4" /> Matches recorded allergy "{allergyHit}" — do not dispense without checking with the doctor.
                        </p>
                      )}
                      {problem && <p className="mt-2 text-xs text-destructive">{problem}</p>}
                    </div>
                  );
                })}
                {prescription?.notes && (
                  <p className="rounded-md bg-secondary/50 p-3 text-sm">
                    <span className="text-xs text-muted-foreground">Doctor's note: </span>
                    {prescription.notes}
                  </p>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button disabled={!canSubmit || dispense.isPending} onClick={() => dispense.mutate()}>
                {dispense.isPending ? 'Dispensing…' : `Dispense ${included.length} line${included.length === 1 ? '' : 's'}`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
