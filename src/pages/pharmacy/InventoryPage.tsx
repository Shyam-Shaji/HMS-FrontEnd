import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PackagePlus, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { addBatch, createMedicine, fetchBatches, fetchExpiring, fetchLowStock, searchMedicines } from "@/features/pharmacy/api";
import type { Medicine } from "@/features/pharmacy/types";
import { getErrorMessage } from "@/lib/api-client";
import { daysUntil, formatCurrency, formatDate } from "@/lib/format";
import { useDebounce } from "@/lib/use-debounce";

function AddMedicineDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const [f, setF] = useState({ name: '', genericName: '', manufacturer: '', category: '', unit: '', reorderLevel: '10' });
  const set = (k: keyof typeof f, v: string) => setF((cur) => ({ ...cur, [k]: v }));

  const save = useMutation({
    mutationFn: () =>
      createMedicine({
        name: f.name.trim(),
        genericName: f.genericName.trim() || undefined,
        manufacturer: f.manufacturer.trim() || undefined,
        category: f.category.trim() || undefined,
        unit: f.unit.trim(),
        reorderLevel: Number(f.reorderLevel) || 0,
      }),
    onSuccess: (m) => {
      toast.success(`${m.name} added to the catalogue`);
      queryClient.invalidateQueries({ queryKey: ['pharmacy'] });
      setF({ name: '', genericName: '', manufacturer: '', category: '', unit: '', reorderLevel: '10' });
      onOpenChange(false);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a medicine</DialogTitle>
          <DialogDescription>Add it to the catalogue first, then receive stock against it.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="m-name">Name (with strength)</Label>
            <Input id="m-name" placeholder="Amoxicillin 500mg" value={f.name} onChange={(e) => set('name', e.target.value)} required autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="m-generic">Generic name</Label>
              <Input id="m-generic" value={f.genericName} onChange={(e) => set('genericName', e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="m-cat">Category</Label>
              <Input id="m-cat" placeholder="Antibiotic" value={f.category} onChange={(e) => set('category', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="m-unit">Unit</Label>
              <Input id="m-unit" placeholder="tablet" value={f.unit} onChange={(e) => set('unit', e.target.value)} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="m-reorder">Reorder level</Label>
              <Input id="m-reorder" type="number" min={0} value={f.reorderLevel} onChange={(e) => set('reorderLevel', e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="m-mfr">Manufacturer</Label>
              <Input id="m-mfr" value={f.manufacturer} onChange={(e) => set('manufacturer', e.target.value)} />
            </div>
          </div>
          <Button type="submit" disabled={save.isPending || !f.name.trim() || !f.unit.trim()}>
            {save.isPending ? 'Adding…' : 'Add medicine'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddStockDialog({ medicine, onClose }: { medicine: Medicine | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [f, setF] = useState({ batchNumber: '', expiryDate: '', qty: '', price: '', supplier: '' });
  const set = (k: keyof typeof f, v: string) => setF((cur) => ({ ...cur, [k]: v }));
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

  const save = useMutation({
    mutationFn: () =>
      addBatch(medicine!._id, {
        batchNumber: f.batchNumber.trim(),
        expiryDate: f.expiryDate,
        quantityReceived: Number(f.qty),
        pricePerUnit: Number(f.price),
        supplier: f.supplier.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success(`Stock added to ${medicine!.name}`);
      queryClient.invalidateQueries({ queryKey: ['pharmacy'] });
      setF({ batchNumber: '', expiryDate: '', qty: '', price: '', supplier: '' });
      onClose();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const valid = f.batchNumber.trim() && f.expiryDate && Number(f.qty) >= 1 && f.price !== '' && Number(f.price) >= 0;

  return (
    <Dialog open={!!medicine} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add stock — {medicine?.name}</DialogTitle>
          <DialogDescription>Receiving against a purchase order? Use the Purchase orders screen instead, so the order is closed off.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="b-no">Batch number</Label>
              <Input id="b-no" value={f.batchNumber} onChange={(e) => set('batchNumber', e.target.value)} required autoFocus />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="b-exp">Expiry date</Label>
              <Input id="b-exp" type="date" min={tomorrow} value={f.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="b-qty">Quantity received</Label>
              <Input id="b-qty" type="number" min={1} value={f.qty} onChange={(e) => set('qty', e.target.value)} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="b-price">Price per {medicine?.unit ?? 'unit'}</Label>
              <Input id="b-price" type="number" min={0} step="any" value={f.price} onChange={(e) => set('price', e.target.value)} required />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="b-sup">Supplier (optional)</Label>
            <Input id="b-sup" value={f.supplier} onChange={(e) => set('supplier', e.target.value)} />
          </div>
          <Button type="submit" disabled={!valid || save.isPending}>
            {save.isPending ? 'Adding…' : 'Add stock'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BatchesDialog({ medicine, onClose }: { medicine: Medicine | null; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['pharmacy', 'batches', medicine?._id],
    queryFn: () => fetchBatches(medicine!._id),
    enabled: !!medicine,
  });
  return (
    <Dialog open={!!medicine} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Batches — {medicine?.name}</DialogTitle>
          <DialogDescription>Earliest expiry first — the order stock is dispensed in.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No batches received yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="py-2 font-medium">Batch</th>
                <th className="py-2 font-medium">Expires</th>
                <th className="py-2 text-right font-medium">Left / received</th>
                <th className="py-2 text-right font-medium">Price</th>
              </tr>
            </thead>
            <tbody>
              {data!.map((b) => {
                const expired = daysUntil(b.expiryDate) <= 0;
                return (
                  <tr key={b._id} className="border-t">
                    <td className="py-2 font-medium">{b.batchNumber}</td>
                    <td className="py-2">
                      {formatDate(b.expiryDate)}
                      {expired && (
                        <Badge variant="destructive" className="ml-2">
                          Expired
                        </Badge>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      {b.quantityAvailable} / {b.quantityReceived}
                    </td>
                    <td className="py-2 text-right">{formatCurrency(b.pricePerUnit)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function InventoryPage() {
  const [q, setQ] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [stockFor, setStockFor] = useState<Medicine | null>(null);
  const [batchesFor, setBatchesFor] = useState<Medicine | null>(null);
  const [days, setDays] = useState('30');
  const debouncedQ = useDebounce(q);

  const { data: medicines, isLoading } = useQuery({
    queryKey: ['pharmacy', 'medicines', debouncedQ],
    queryFn: () => searchMedicines(debouncedQ || undefined),
  });
  const { data: low } = useQuery({ queryKey: ['pharmacy', 'low-stock'], queryFn: fetchLowStock });
  const { data: expiring } = useQuery({ queryKey: ['pharmacy', 'expiring', days], queryFn: () => fetchExpiring(Number(days)) });

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <PageHeader title="Inventory" description="What's on the shelf, what's running low, what's about to expire." />
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" /> Add medicine
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All stock</TabsTrigger>
          <TabsTrigger value="low">Low stock ({low?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="expiring">Expiring ({expiring?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="relative mb-3 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by name or generic" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-2 p-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (medicines ?? []).length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">{debouncedQ ? 'No medicine matches.' : 'The catalogue is empty — add your first medicine.'}</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="p-3 font-medium">Medicine</th>
                      <th className="p-3 font-medium">In stock</th>
                      <th className="p-3 font-medium">Next expiry</th>
                      <th className="p-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {medicines!.map((m) => {
                      const outOfStock = m.totalAvailable === 0;
                      const lowStock = !outOfStock && m.totalAvailable <= m.reorderLevel;
                      const soon = m.nextExpiry != null && daysUntil(m.nextExpiry) <= 30;
                      return (
                        <tr key={m._id} className="border-t">
                          <td className="p-3">
                            <p className="font-medium">{m.name}</p>
                            <p className="text-xs text-muted-foreground">{[m.genericName, m.category].filter(Boolean).join(' · ')}</p>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold tabular-nums">{m.totalAvailable}</span>
                            <span className="ml-1 text-muted-foreground">{m.unit}</span>
                            {outOfStock && <Badge variant="destructive" className="ml-2">Out of stock</Badge>}
                            {lowStock && <Badge variant="warning" className="ml-2">Low</Badge>}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {m.nextExpiry ? formatDate(m.nextExpiry) : '—'}
                            {soon && <Badge variant="warning" className="ml-2">Soon</Badge>}
                          </td>
                          <td className="p-3">
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="outline" onClick={() => setStockFor(m)}>
                                <PackagePlus className="h-4 w-4" /> Add stock
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setBatchesFor(m)}>
                                Batches
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low">
          <Card>
            <CardContent className="p-0">
              {(low ?? []).length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">Everything is above its reorder level.</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {low!.map((l) => (
                      <tr key={l.medicine._id} className="border-t first:border-0">
                        <td className="p-3 font-medium">{l.medicine.name}</td>
                        <td className="p-3">
                          <span className="font-semibold">{l.totalAvailable}</span>
                          <span className="text-muted-foreground"> left · reorder at {l.medicine.reorderLevel}</span>
                        </td>
                        <td className="p-3 text-right">
                          {l.totalAvailable === 0 && <Badge variant="destructive">Out of stock</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiring">
          <div className="mb-3 max-w-[200px]">
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Within 30 days</SelectItem>
                <SelectItem value="60">Within 60 days</SelectItem>
                <SelectItem value="90">Within 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card>
            <CardContent className="p-0">
              {(expiring ?? []).length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">Nothing expiring in this window.</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {expiring!.map((b) => {
                      const expired = daysUntil(b.expiryDate) <= 0;
                      const med = typeof b.medicineId === 'object' ? b.medicineId : null;
                      return (
                        <tr key={b._id} className="border-t first:border-0">
                          <td className="p-3">
                            <p className="font-medium">{med?.name}</p>
                            <p className="text-xs text-muted-foreground">Batch {b.batchNumber}</p>
                          </td>
                          <td className="p-3">
                            {b.quantityAvailable} {med?.unit}
                          </td>
                          <td className="p-3">
                            {formatDate(b.expiryDate)}
                            {expired ? (
                              <Badge variant="destructive" className="ml-2">Expired — do not dispense</Badge>
                            ) : (
                              <span className="ml-2 text-xs text-muted-foreground">{daysUntil(b.expiryDate)} days</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
          <p className="mt-2 text-xs text-muted-foreground">
            Expired stock is automatically excluded from dispensing. Writing it off or returning it isn't tracked yet.
          </p>
        </TabsContent>
      </Tabs>

      <AddMedicineDialog open={showAdd} onOpenChange={setShowAdd} />
      <AddStockDialog medicine={stockFor} onClose={() => setStockFor(null)} />
      <BatchesDialog medicine={batchesFor} onClose={() => setBatchesFor(null)} />
    </div>
  );
}
