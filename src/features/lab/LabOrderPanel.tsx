import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FlaskConical, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PriorityBadge } from "@/components/clinical/PriorityBadge";
import { searchLabTests } from "./api";
import type { LabOrder, LabOrderPriority, LabTest } from "./types";
import { getErrorMessage } from "@/lib/api-client";
import { formatCurrency, humanizeStatus } from "@/lib/format";
import { useDebounce } from "@/lib/use-debounce";

// Order a lab test and see what's already been ordered. Shared by the
// consultation screen (OPD) and the ward-round screen (IPD) - the only
// difference is which endpoint `onOrder` calls, so that's injected.
export function LabOrderPanel({
  existingOrders,
  onOrder,
  invalidateKey,
  disabled,
}: {
  existingOrders: LabOrder[];
  onOrder: (input: { testId: string; priority: LabOrderPriority; clinicalNotes?: string }) => Promise<unknown>;
  invalidateKey: unknown[];
  disabled?: boolean;
}) {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [test, setTest] = useState<LabTest | null>(null);
  const [priority, setPriority] = useState<LabOrderPriority>('routine');
  const [notes, setNotes] = useState('');
  const debounced = useDebounce(q);

  const { data: tests } = useQuery({
    queryKey: ['lab', 'tests', debounced],
    queryFn: () => searchLabTests(debounced),
    enabled: !test,
  });

  const order = useMutation({
    mutationFn: () => onOrder({ testId: test!._id, priority, clinicalNotes: notes || undefined }),
    onSuccess: () => {
      toast.success(`Ordered ${test!.name}`);
      queryClient.invalidateQueries({ queryKey: invalidateKey });
      setTest(null);
      setQ('');
      setNotes('');
      setPriority('routine');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FlaskConical className="h-4 w-4" /> Lab orders
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {existingOrders.length > 0 && (
          <div className="grid gap-2">
            {existingOrders.map((o) => (
              <div key={o._id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span className="font-medium">{o.testNameSnapshot}</span>
                <span className="flex items-center gap-2">
                  <PriorityBadge priority={o.priority} />
                  <Badge variant={o.status === 'completed' ? 'success' : 'secondary'}>{humanizeStatus(o.status)}</Badge>
                </span>
              </div>
            ))}
          </div>
        )}

        {!disabled && (
          <div className="grid gap-3">
            {test ? (
              <div className="flex items-center justify-between rounded-md border bg-secondary/40 px-3 py-2 text-sm">
                <span>
                  <span className="font-medium">{test.name}</span>
                  <span className="ml-2 text-muted-foreground">
                    {test.sampleType} · {formatCurrency(test.price)}
                  </span>
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={() => setTest(null)}>
                  Change
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Search tests (e.g. CBC)" value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
                <div className="grid max-h-40 gap-1 overflow-y-auto">
                  {(tests ?? []).slice(0, 8).map((t) => (
                    <button
                      key={t._id}
                      type="button"
                      className="flex items-center justify-between rounded-md px-3 py-1.5 text-left text-sm hover:bg-accent"
                      onClick={() => setTest(t)}
                    >
                      <span>{t.name}</span>
                      <span className="text-muted-foreground">{t.category}</span>
                    </button>
                  ))}
                  {tests && tests.length === 0 && <p className="px-3 text-sm text-muted-foreground">No matching test.</p>}
                </div>
              </>
            )}

            {test && (
              <>
                <Select value={priority} onValueChange={(v) => setPriority(v as LabOrderPriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="stat">STAT — immediate</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea placeholder="Clinical notes for the lab (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
                <Button disabled={order.isPending} onClick={() => order.mutate()}>
                  {order.isPending ? 'Ordering…' : 'Order test'}
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
