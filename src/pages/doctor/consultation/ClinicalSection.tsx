import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ClinicalForm } from './forms';

export function ClinicalSection({
  value,
  onChange,
  locked,
}: {
  value: ClinicalForm;
  onChange: (next: ClinicalForm) => void;
  locked: boolean;
}) {
  const set = <K extends keyof ClinicalForm>(key: K, v: ClinicalForm[K]) => onChange({ ...value, [key]: v });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Consultation notes</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="cc">Chief complaint</Label>
          <Input id="cc" disabled={locked} value={value.chiefComplaint} onChange={(e) => set('chiefComplaint', e.target.value)} />
        </div>

        <div className="grid gap-2">
          <Label>Diagnosis</Label>
          {value.diagnosis.map((d, i) => (
            <div key={i} className="flex gap-2">
              <Input
                className="flex-1"
                placeholder="Diagnosis"
                disabled={locked}
                value={d.description}
                onChange={(e) =>
                  set('diagnosis', value.diagnosis.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))
                }
              />
              <Input
                className="w-28"
                placeholder="ICD-10"
                disabled={locked}
                value={d.icd10Code}
                onChange={(e) =>
                  set('diagnosis', value.diagnosis.map((x, j) => (j === i ? { ...x, icd10Code: e.target.value } : x)))
                }
              />
              {!locked && (
                <Button type="button" variant="ghost" size="icon" onClick={() => set('diagnosis', value.diagnosis.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {!locked && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => set('diagnosis', [...value.diagnosis, { description: '', icd10Code: '' }])}
            >
              <Plus className="h-4 w-4" /> Add diagnosis
            </Button>
          )}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" rows={5} disabled={locked} value={value.doctorNotes} onChange={(e) => set('doctorNotes', e.target.value)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="fu">Follow-up date</Label>
            <Input id="fu" type="date" disabled={locked} value={value.followUpDate} onChange={(e) => set('followUpDate', e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ref">Referred to</Label>
            <Input id="ref" placeholder="Specialist / department" disabled={locked} value={value.referredTo} onChange={(e) => set('referredTo', e.target.value)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
