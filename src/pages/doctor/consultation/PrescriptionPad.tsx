import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pill, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AllergyBanner } from '@/components/clinical/AllergyBanner';
import { createPrescription, fetchVisitPrescriptions } from '@/features/prescriptions/api';
import { searchMedicines } from '@/features/pharmacy/api';
import { getErrorMessage } from '@/lib/api-client';

interface Row {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: string;
  instructions: string;
}

const blankRow = (): Row => ({ name: '', dosage: '', frequency: '', duration: '', quantity: '', instructions: '' });
const isComplete = (r: Row) => r.name.trim() && r.dosage.trim() && r.frequency.trim() && r.duration.trim();

export function PrescriptionPad({ appointmentId, allergies }: { appointmentId: string; allergies: string[] }) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<Row[]>([blankRow()]);
  const [notes, setNotes] = useState('');

  const { data: issued } = useQuery({
    queryKey: ['prescriptions', 'visit', appointmentId],
    queryFn: () => fetchVisitPrescriptions(appointmentId),
  });

  // Feeds the name field's suggestions from the hospital's own medicine
  // catalogue, so a doctor picks "Amoxicillin 500mg" instead of retyping
  // it - and the pharmacist later matches it against real stock.
  const { data: catalogue } = useQuery({
    queryKey: ['pharmacy', 'medicines'],
    queryFn: () => searchMedicines(),
    staleTime: 5 * 60_000,
  });

  const update = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const complete = rows.filter(isComplete);

  const issue = useMutation({
    mutationFn: () =>
      createPrescription(appointmentId, {
        medicines: complete.map((r) => ({
          name: r.name.trim(),
          dosage: r.dosage.trim(),
          frequency: r.frequency.trim(),
          duration: r.duration.trim(),
          instructions: r.instructions.trim() || undefined,
          quantity: r.quantity ? Number(r.quantity) : undefined,
        })),
        notes: notes || undefined,
      }),
    onSuccess: () => {
      toast.success('Prescription issued');
      queryClient.invalidateQueries({ queryKey: ['prescriptions', 'visit', appointmentId] });
      setRows([blankRow()]);
      setNotes('');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Pill className="h-4 w-4" /> Prescription
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {/* Repeated here on purpose: the allergy alert has to be in view
            at the moment of prescribing, not just at the top of the page. */}
        <AllergyBanner allergies={allergies} />

        {(issued ?? []).map((rx) => (
          <div key={rx._id} className="rounded-md border bg-secondary/30 p-3 text-sm">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-medium">Issued prescription</span>
              <Badge variant={rx.status === 'cancelled' ? 'destructive' : 'secondary'}>{rx.status}</Badge>
            </div>
            <ul className="grid gap-0.5 text-muted-foreground">
              {rx.medicines.map((m) => (
                <li key={m.lineId}>
                  {m.name} — {m.dosage}, {m.frequency}, {m.duration}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <datalist id="medicine-catalogue">
          {(catalogue ?? []).map((m) => (
            <option key={m._id} value={m.name} />
          ))}
        </datalist>

        <div className="grid gap-3">
          {rows.map((r, i) => (
            <div key={i} className="grid gap-2 rounded-md border p-3">
              <div className="flex gap-2">
                <Input list="medicine-catalogue" placeholder="Medicine" value={r.name} onChange={(e) => update(i, { name: e.target.value })} />
                {rows.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Input placeholder="Dosage (500mg)" value={r.dosage} onChange={(e) => update(i, { dosage: e.target.value })} />
                <Input placeholder="Frequency (1-0-1)" value={r.frequency} onChange={(e) => update(i, { frequency: e.target.value })} />
                <Input placeholder="Duration (5 days)" value={r.duration} onChange={(e) => update(i, { duration: e.target.value })} />
                <Input type="number" min={1} placeholder="Qty" value={r.quantity} onChange={(e) => update(i, { quantity: e.target.value })} />
              </div>
              <Input placeholder="Instructions (after food…)" value={r.instructions} onChange={(e) => update(i, { instructions: e.target.value })} />
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setRows((rs) => [...rs, blankRow()])}>
            <Plus className="h-4 w-4" /> Add medicine
          </Button>
        </div>

        <Textarea placeholder="Notes for the pharmacist or patient (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />

        <Button disabled={complete.length === 0 || issue.isPending} onClick={() => issue.mutate()}>
          {issue.isPending ? 'Issuing…' : `Issue prescription${complete.length ? ` (${complete.length})` : ''}`}
        </Button>
        {rows.some((r) => !isComplete(r) && (r.name || r.dosage || r.frequency || r.duration)) && (
          <p className="-mt-2 text-xs text-muted-foreground">Rows need a name, dosage, frequency and duration to be included.</p>
        )}
      </CardContent>
    </Card>
  );
}
