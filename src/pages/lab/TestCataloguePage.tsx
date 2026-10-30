import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Search, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createLabTest, searchLabTests, updateLabTest } from '@/features/lab/api';
import type { LabTest } from '@/features/lab/types';
import { getErrorMessage } from '@/lib/api-client';
import { formatCurrency } from '@/lib/format';
import { useDebounce } from '@/lib/use-debounce';

interface ParamRow {
  name: string;
  unit: string;
  low: string;
  high: string;
}
const blankParam = (): ParamRow => ({ name: '', unit: '', low: '', high: '' });

function TestDialog({ open, test, onClose }: { open: boolean; test: LabTest | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [f, setF] = useState({ name: '', code: '', category: '', sampleType: '', price: '', tat: '24' });
  const [resultType, setResultType] = useState<'structured' | 'report'>('structured');
  const [params, setParams] = useState<ParamRow[]>([blankParam()]);

  useEffect(() => {
    if (!open) return;
    if (test) {
      setF({
        name: test.name,
        code: test.code ?? '',
        category: test.category ?? '',
        sampleType: test.sampleType,
        price: String(test.price),
        tat: String(test.turnaroundTimeHours),
      });
      setResultType(test.resultType);
      setParams(
        (test.parameters ?? []).length
          ? test.parameters!.map((p) => ({ name: p.name, unit: p.unit, low: p.referenceRangeLow?.toString() ?? '', high: p.referenceRangeHigh?.toString() ?? '' }))
          : [blankParam()],
      );
    } else {
      setF({ name: '', code: '', category: '', sampleType: '', price: '', tat: '24' });
      setResultType('structured');
      setParams([blankParam()]);
    }
  }, [open, test]);

  const set = (k: keyof typeof f, v: string) => setF((c) => ({ ...c, [k]: v }));
  const upd = (i: number, p: Partial<ParamRow>) => setParams((ps) => ps.map((r, j) => (j === i ? { ...r, ...p } : r)));

  const filled = params.filter((p) => p.name.trim());
  const rangeBad = filled.some((p) => p.low !== '' && p.high !== '' && Number(p.low) > Number(p.high));
  const structuredOk = resultType === 'report' || (filled.length > 0 && filled.every((p) => p.unit.trim()) && !rangeBad);
  const valid = f.name.trim() && f.sampleType.trim() && structuredOk;

  const save = useMutation({
    mutationFn: () => {
      const body = {
        name: f.name.trim(),
        code: f.code.trim() || undefined,
        category: f.category.trim() || undefined,
        sampleType: f.sampleType.trim(),
        resultType,
        price: Number(f.price) || 0,
        turnaroundTimeHours: Number(f.tat) || 24,
        ...(resultType === 'structured'
          ? {
              parameters: filled.map((p) => ({
                name: p.name.trim(),
                unit: p.unit.trim(),
                referenceRangeLow: p.low !== '' ? Number(p.low) : undefined,
                referenceRangeHigh: p.high !== '' ? Number(p.high) : undefined,
              })),
            }
          : {}),
      };
      return test ? updateLabTest(test._id, body) : createLabTest(body);
    },
    onSuccess: () => {
      toast.success(test ? 'Test updated' : 'Test added');
      queryClient.invalidateQueries({ queryKey: ['lab', 'tests'] });
      onClose();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{test ? 'Edit test' : 'Add a test'}</DialogTitle>
          <DialogDescription>
            Parameters and reference ranges defined here pre-fill the result form and drive the automatic low/high flags. Changes apply to
            future orders; existing orders keep the name and price they were ordered with.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="t-name">Test name</Label>
              <Input id="t-name" placeholder="Complete Blood Count" value={f.name} onChange={(e) => set('name', e.target.value)} autoFocus />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="t-code">Code (optional)</Label>
              <Input id="t-code" value={f.code} onChange={(e) => set('code', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="grid gap-1.5">
              <Label htmlFor="t-cat">Category</Label>
              <Input id="t-cat" placeholder="Haematology" value={f.category} onChange={(e) => set('category', e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="t-sample">Sample</Label>
              <Input id="t-sample" placeholder="blood" value={f.sampleType} onChange={(e) => set('sampleType', e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="t-price">Price</Label>
              <Input id="t-price" type="number" min={0} value={f.price} onChange={(e) => set('price', e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="t-tat">Turnaround (hrs)</Label>
              <Input id="t-tat" type="number" min={1} value={f.tat} onChange={(e) => set('tat', e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Result type</Label>
            <Select value={resultType} onValueChange={(v) => setResultType(v as typeof resultType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="structured">Structured — numeric parameters with reference ranges</SelectItem>
                <SelectItem value="report">Report — imaging / biopsy, delivered as a file</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {resultType === 'structured' && (
            <div className="grid gap-2">
              <Label>Parameters</Label>
              {params.map((p, i) => (
                <div key={i} className="grid grid-cols-[1fr_90px_90px_90px_auto] items-center gap-2">
                  <Input placeholder="Hemoglobin" aria-label="Parameter name" value={p.name} onChange={(e) => upd(i, { name: e.target.value })} />
                  <Input placeholder="g/dL" aria-label="Unit" value={p.unit} onChange={(e) => upd(i, { unit: e.target.value })} />
                  <Input type="number" step="any" placeholder="Low" aria-label="Reference low" value={p.low} onChange={(e) => upd(i, { low: e.target.value })} />
                  <Input type="number" step="any" placeholder="High" aria-label="Reference high" value={p.high} onChange={(e) => upd(i, { high: e.target.value })} />
                  <Button type="button" variant="ghost" size="icon" disabled={params.length === 1} onClick={() => setParams((ps) => ps.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setParams((ps) => [...ps, blankParam()])}>
                <Plus className="h-4 w-4" /> Add parameter
              </Button>
              {rangeBad && <p className="text-sm text-destructive">A reference "low" is above its "high".</p>}
              {filled.some((p) => !p.unit.trim()) && <p className="text-xs text-muted-foreground">Every parameter needs a unit.</p>}
            </div>
          )}

          <Button disabled={!valid || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? 'Saving…' : test ? 'Save changes' : 'Add test'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TestCataloguePage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<LabTest | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const debounced = useDebounce(q);

  // includeInactive: a manager must be able to see - and re-enable - tests
  // that were switched off, which doctors ordering never see.
  const { data, isLoading } = useQuery({
    queryKey: ['lab', 'tests', 'manage', debounced],
    queryFn: () => searchLabTests(debounced || undefined, true),
  });

  const toggle = useMutation({
    mutationFn: (t: LabTest) => updateLabTest(t._id, { isActive: !t.isActive }),
    onSuccess: (t) => {
      toast.success(t.isActive ? 'Test re-enabled' : 'Test deactivated — doctors can no longer order it');
      queryClient.invalidateQueries({ queryKey: ['lab', 'tests'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <PageHeader title="Test catalogue" description="The tests your lab offers, with their parameters and reference ranges." />
        <Button
          onClick={() => {
            setEditing(null);
            setShowDialog(true);
          }}
        >
          <Plus className="h-4 w-4" /> Add test
        </Button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search tests" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (data ?? []).length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">{debounced ? 'No test matches.' : 'No tests yet — add your first.'}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="p-3 font-medium">Test</th>
                  <th className="p-3 font-medium">Sample</th>
                  <th className="p-3 font-medium">Result</th>
                  <th className="p-3 font-medium">Price</th>
                  <th className="p-3 font-medium">Turnaround</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {data!.map((t) => (
                  <tr key={t._id} className={`border-t ${t.isActive === false ? 'opacity-60' : ''}`}>
                    <td className="p-3">
                      <p className="font-medium">
                        {t.name}
                        {t.isActive === false && (
                          <Badge variant="secondary" className="ml-2">
                            Inactive
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{[t.category, t.code].filter(Boolean).join(' · ')}</p>
                    </td>
                    <td className="p-3 text-muted-foreground">{t.sampleType}</td>
                    <td className="p-3 text-muted-foreground">
                      {t.resultType === 'structured' ? `${t.parameters?.length ?? 0} parameters` : 'Report file'}
                    </td>
                    <td className="p-3">{formatCurrency(t.price)}</td>
                    <td className="p-3 text-muted-foreground">{t.turnaroundTimeHours} h</td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditing(t);
                            setShowDialog(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" disabled={toggle.isPending} onClick={() => toggle.mutate(t)}>
                          {t.isActive === false ? 'Re-enable' : 'Deactivate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <TestDialog open={showDialog} test={editing} onClose={() => setShowDialog(false)} />
    </div>
  );
}
