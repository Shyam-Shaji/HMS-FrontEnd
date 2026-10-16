import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VITAL_FIELDS, type VitalsForm } from './forms';

export function VitalsSection({
  value,
  onChange,
  locked,
}: {
  value: VitalsForm;
  onChange: (next: VitalsForm) => void;
  locked: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Vitals</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {VITAL_FIELDS.map((f) => (
          <div key={f.key} className="grid gap-1.5">
            <Label htmlFor={`v-${f.key}`} className="text-xs text-muted-foreground">
              {f.label} ({f.unit})
            </Label>
            <Input
              id={`v-${f.key}`}
              type="number"
              step="any"
              inputMode="decimal"
              disabled={locked}
              value={value[f.key]}
              onChange={(e) => onChange({ ...value, [f.key]: e.target.value })}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
