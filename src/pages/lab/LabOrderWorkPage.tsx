import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, ArrowLeft, Check, Plus, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { PriorityBadge } from '@/components/clinical/PriorityBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  cancelLabOrder,
  collectSample,
  fetchLabOrder,
  saveLabResult,
  startProcessing,
  uploadLabReportFile,
  verifyLabOrder,
} from '@/features/lab/api';
import { ReportFileButton } from '@/features/lab/ReportFileButton';
import type { LabOrder, ResultParameter, ResultParameterInput } from '@/features/lab/types';
import { getErrorMessage } from '@/lib/api-client';
import { ageFromDob, formatDateTime, humanizeStatus, timeAgo } from '@/lib/format';
import { cn } from '@/lib/cn';

type Flag = NonNullable<ResultParameter['flag']>;

interface Row {
  name: string;
  unit: string;
  value: string;
  low?: number;
  high?: number;
  flag: Flag;
  // Once the technician sets a flag by hand, typing a new value must not
  // silently overwrite their judgement.
  flagManual: boolean;
  // Rows that came from the test's definition are mandatory to verify;
  // rows the technician added by hand are optional extras.
  fromDefinition: boolean;
}

// Suggests low/high from the reference range. "Critical" is a clinical call
// and is never suggested - the technician sets it deliberately.
function autoFlag(value: string, low?: number, high?: number): Flag {
  const n = Number(value);
  if (value.trim() === '' || Number.isNaN(n)) return 'normal';
  if (low != null && n < low) return 'low';
  if (high != null && n > high) return 'high';
  return 'normal';
}

const STEPS = [
  { key: 'ordered', label: 'Ordered' },
  { key: 'sample_collected', label: 'Sample collected' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Verified' },
];

function Stepper({ status }: { status: LabOrder['status'] }) {
  const current = STEPS.findIndex((s) => s.key === status);
  return (
    <ol className="flex items-center gap-2 text-xs">
      {STEPS.map((s, i) => (
        <li key={s.key} className="flex items-center gap-2">
          <span
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold',
              i < current || status === 'completed' ? 'border-primary bg-primary text-primary-foreground' : i === current ? 'border-primary text-primary' : 'text-muted-foreground',
            )}
          >
            {i < current || status === 'completed' ? <Check className="h-3 w-3" /> : i + 1}
          </span>
          <span className={cn(i === current ? 'font-medium' : 'text-muted-foreground')}>{s.label}</span>
          {i < STEPS.length - 1 && <span className="h-px w-4 bg-border" />}
        </li>
      ))}
    </ol>
  );
}

export function LabOrderWorkPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = id!;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [rows, setRows] = useState<Row[]>([]);
  const [notes, setNotes] = useState('');
  const [showVerify, setShowVerify] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [reason, setReason] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ['lab', 'orders', orderId],
    queryFn: () => fetchLabOrder(orderId),
  });

  // Seed once per order: saved draft values if there are any, otherwise the
  // test's own parameter definitions (so a CBC opens with Hb, WBC, etc.
  // already listed, units and reference ranges filled in).
  const seededFor = useRef<string | null>(null);
  useEffect(() => {
    if (!order || seededFor.current === order._id) return;
    seededFor.current = order._id;
    const test = typeof order.testId === 'object' ? order.testId : null;
    const defs = test?.parameters ?? [];
    if (order.resultParameters.length > 0) {
      setRows(
        order.resultParameters.map((p) => ({
          name: p.name,
          unit: p.unit ?? '',
          value: p.value,
          low: p.referenceRangeLow,
          high: p.referenceRangeHigh,
          flag: p.flag ?? autoFlag(p.value, p.referenceRangeLow, p.referenceRangeHigh),
          flagManual: p.flag != null,
          fromDefinition: defs.some((d) => d.name === p.name),
        })),
      );
    } else {
      setRows(
        defs.map((d) => ({
          name: d.name,
          unit: d.unit,
          value: '',
          low: d.referenceRangeLow,
          high: d.referenceRangeHigh,
          flag: 'normal',
          flagManual: false,
          fromDefinition: true,
        })),
      );
    }
    setNotes(order.resultNotes ?? '');
  }, [order]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['lab'] });
  const fail = (e: unknown) => toast.error(getErrorMessage(e));

  const collect = useMutation({ mutationFn: () => collectSample(orderId), onSuccess: () => (toast.success('Sample collected'), invalidate()), onError: fail });
  const start = useMutation({ mutationFn: () => startProcessing(orderId), onSuccess: () => (toast.success('Processing started'), invalidate()), onError: fail });

  const toInput = (): ResultParameterInput[] =>
    rows
      .filter((r) => r.value.trim() !== '')
      .map((r) => ({
        name: r.name.trim(),
        value: r.value.trim(),
        unit: r.unit.trim() || undefined,
        referenceRangeLow: r.low,
        referenceRangeHigh: r.high,
        flag: r.flag,
      }));

  const save = useMutation({
    mutationFn: () => saveLabResult(orderId, { resultParameters: toInput(), resultNotes: notes }),
    onSuccess: () => (toast.success('Draft saved'), invalidate()),
    onError: fail,
  });

  // Save what's on screen, then verify - so the signed-off result is
  // exactly what the technician was looking at when they clicked.
  const verify = useMutation({
    mutationFn: async () => {
      await saveLabResult(orderId, { resultParameters: toInput(), resultNotes: notes });
      await verifyLabOrder(orderId);
    },
    onSuccess: () => {
      toast.success('Result verified and released');
      invalidate();
      navigate('/lab/queue');
    },
    onError: (e) => (fail(e), invalidate()),
  });

  const upload = useMutation({
    mutationFn: (file: File) => uploadLabReportFile(orderId, file),
    onSuccess: () => (toast.success('Report file attached'), invalidate()),
    onError: fail,
  });

  const cancel = useMutation({
    mutationFn: () => cancelLabOrder(orderId, reason || undefined),
    onSuccess: () => (toast.success('Order cancelled'), invalidate(), navigate('/lab/queue')),
    onError: fail,
  });

  function onPickFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return toast.error('That file is over the 10 MB limit');
    upload.mutate(file);
    if (fileInput.current) fileInput.current.value = '';
  }

  const patch = (i: number, p: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...p } : r)));

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!order) return <p className="text-sm text-muted-foreground">Order not found.</p>;

  const patient = typeof order.patientId === 'object' ? order.patientId : null;
  const test = typeof order.testId === 'object' ? order.testId : null;
  const editable = order.status === 'sample_collected' || order.status === 'in_progress';
  const closed = order.status === 'completed' || order.status === 'cancelled';
  const hasFile = !!order.reportFileMime;
  const blankRequired = rows.filter((r) => r.fromDefinition && !r.value.trim()).length;
  const hasValues = rows.some((r) => r.value.trim());
  const canVerify = editable && blankRequired === 0 && (hasValues || hasFile);
  const hasCritical = rows.some((r) => r.value.trim() && r.flag === 'critical');
  const abnormal = rows.filter((r) => r.value.trim() && r.flag !== 'normal').length;

  return (
    <div className="max-w-4xl">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/lab/queue')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
              {order.testNameSnapshot} <PriorityBadge priority={order.priority} />
            </h1>
            <p className="text-sm text-muted-foreground">
              {test?.sampleType ? `${test.sampleType} · ` : ''}ordered {timeAgo(order.orderedAt)}
              {order.orderedBy ? ` by Dr. ${order.orderedBy.name}` : ''}
            </p>
          </div>
        </div>
        {!closed && (
          <Button variant="ghost" onClick={() => setShowCancel(true)}>
            Cancel order
          </Button>
        )}
        {order.status === 'cancelled' && <Badge variant="destructive">Cancelled</Badge>}
      </div>

      {order.status !== 'cancelled' && (
        <div className="mb-4">
          <Stepper status={order.status} />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid content-start gap-4 lg:col-span-2">
          {order.status === 'ordered' && (
            <Card>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">Collect the sample</p>
                  <p className="text-sm text-muted-foreground">Confirm the patient's identity against the label before collecting.</p>
                </div>
                <Button disabled={collect.isPending} onClick={() => collect.mutate()}>
                  Sample collected
                </Button>
              </CardContent>
            </Card>
          )}

          {order.status === 'sample_collected' && (
            <Card>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">Sample collected</p>
                  <p className="text-sm text-muted-foreground">Start processing when the sample is on the analyser or bench.</p>
                </div>
                <Button variant="outline" disabled={start.isPending} onClick={() => start.mutate()}>
                  Start processing
                </Button>
              </CardContent>
            </Card>
          )}

          {(editable || order.status === 'completed') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Results</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {rows.length === 0 && !editable && <p className="text-sm text-muted-foreground">No parameters were recorded for this test.</p>}

                {rows.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-muted-foreground">
                          <th className="py-2 pr-2 font-medium">Parameter</th>
                          <th className="py-2 pr-2 font-medium">Result</th>
                          <th className="py-2 pr-2 font-medium">Reference</th>
                          <th className="py-2 font-medium">Flag</th>
                          {editable && <th />}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, i) => (
                          <tr key={i} className="border-t align-middle">
                            <td className="py-2 pr-2">
                              {r.fromDefinition || !editable ? (
                                <span className="font-medium">{r.name}</span>
                              ) : (
                                <Input aria-label="Parameter name" value={r.name} onChange={(e) => patch(i, { name: e.target.value })} />
                              )}
                            </td>
                            <td className="py-2 pr-2">
                              {editable ? (
                                <div className="flex items-center gap-1.5">
                                  <Input
                                    aria-label={`${r.name} result`}
                                    className="w-24"
                                    value={r.value}
                                    onChange={(e) =>
                                      patch(i, {
                                        value: e.target.value,
                                        flag: r.flagManual ? r.flag : autoFlag(e.target.value, r.low, r.high),
                                      })
                                    }
                                  />
                                  <span className="text-xs text-muted-foreground">{r.unit}</span>
                                </div>
                              ) : (
                                <span className={cn('font-medium', r.flag !== 'normal' && 'text-destructive')}>
                                  {r.value} {r.unit}
                                </span>
                              )}
                            </td>
                            <td className="py-2 pr-2 text-muted-foreground">
                              {r.low != null && r.high != null ? `${r.low} – ${r.high}` : '—'}
                            </td>
                            <td className="py-2">
                              {editable ? (
                                <Select value={r.flag} onValueChange={(v) => patch(i, { flag: v as Flag, flagManual: true })}>
                                  <SelectTrigger className="h-9 w-28" aria-label={`${r.name} flag`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                r.flag !== 'normal' && <Badge variant={r.flag === 'critical' ? 'destructive' : 'warning'}>{r.flag}</Badge>
                              )}
                            </td>
                            {editable && (
                              <td className="py-2 pl-1 text-right">
                                {!r.fromDefinition && (
                                  <Button type="button" variant="ghost" size="icon" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {editable && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() => setRows((rs) => [...rs, { name: '', unit: '', value: '', flag: 'normal', flagManual: false, fromDefinition: false }])}
                  >
                    <Plus className="h-4 w-4" /> Add parameter
                  </Button>
                )}

                {editable ? (
                  <Textarea placeholder="Result notes / interpretation (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
                ) : (
                  order.resultNotes && <p className="whitespace-pre-wrap rounded-md bg-secondary/50 p-3 text-sm">{order.resultNotes}</p>
                )}
              </CardContent>
            </Card>
          )}

          {(editable || (order.status === 'completed' && hasFile)) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Report file</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-3">
                {hasFile && <ReportFileButton path={`/lab/orders/${order._id}/report-file`} mime={order.reportFileMime} size={order.reportFileSize} label="View attached report" />}
                {editable && (
                  <>
                    <input
                      ref={fileInput}
                      type="file"
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                      onChange={(e) => onPickFile(e.target.files?.[0])}
                    />
                    <Button type="button" variant="outline" size="sm" disabled={upload.isPending} onClick={() => fileInput.current?.click()}>
                      <Upload className="h-4 w-4" />
                      {upload.isPending ? 'Uploading…' : hasFile ? 'Replace file' : 'Attach PDF or image'}
                    </Button>
                    <span className="text-xs text-muted-foreground">PDF, PNG or JPEG, up to 10 MB. Useful for scans and imaging reports.</span>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {editable && (
            <Card>
              <CardContent className="grid gap-3 p-4">
                {blankRequired > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {blankRequired} required parameter{blankRequired === 1 ? ' is' : 's are'} still blank — fill {blankRequired === 1 ? 'it' : 'them'} in to verify.
                  </p>
                )}
                {hasCritical && (
                  <p className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    This result includes a CRITICAL value. Contact the ordering doctor directly — don't rely on the automatic notification alone.
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" disabled={save.isPending || verify.isPending} onClick={() => save.mutate()}>
                    {save.isPending ? 'Saving…' : 'Save draft'}
                  </Button>
                  <Button disabled={!canVerify || verify.isPending} onClick={() => setShowVerify(true)}>
                    <ShieldCheck className="h-4 w-4" /> Verify & release
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {order.status === 'completed' && (
            <p className="text-sm text-muted-foreground">
              Verified {formatDateTime(order.verifiedAt)}. A verified result is locked and can't be edited.
            </p>
          )}
        </div>

        <div className="grid content-start gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Patient</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-1 text-sm">
              <p className="font-medium">{patient?.name}</p>
              <p className="text-muted-foreground">
                {patient?.uhid}
                {patient?.dob ? ` · ${ageFromDob(patient.dob)}` : ''}
                {patient?.gender ? ` · ${patient.gender}` : ''}
              </p>
              {patient?.phone && <p className="text-muted-foreground">{patient.phone}</p>}
            </CardContent>
          </Card>

          {order.clinicalNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Clinical notes from the doctor</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">{order.clinicalNotes}</CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="grid gap-1 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">{humanizeStatus(order.status)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ordered</span>
                <span>{formatDateTime(order.orderedAt)}</span>
              </div>
              {order.sampleCollectedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sample taken</span>
                  <span>{formatDateTime(order.sampleCollectedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showVerify} onOpenChange={setShowVerify}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify and release this result?</DialogTitle>
            <DialogDescription>
              The result is locked, and the ordering doctor and the patient are notified. {abnormal > 0 ? `${abnormal} value${abnormal === 1 ? ' is' : 's are'} flagged abnormal.` : ''} It can't be edited after this.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVerify(false)}>
              Keep editing
            </Button>
            <Button
              disabled={verify.isPending}
              onClick={() => {
                setShowVerify(false);
                verify.mutate();
              }}
            >
              {verify.isPending ? 'Releasing…' : 'Verify & release'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCancel} onOpenChange={setShowCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this order?</DialogTitle>
            <DialogDescription>Use this for a rejected sample or a duplicate order. The reason is kept on the record.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Reason (e.g. haemolysed sample, recollect needed)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancel(false)}>
              Keep order
            </Button>
            <Button variant="destructive" disabled={cancel.isPending} onClick={() => cancel.mutate()}>
              {cancel.isPending ? 'Cancelling…' : 'Cancel order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
