import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
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
import { 
    cancelPurchaseOrder, 
    createPurchaseOrder,
    createSupplier,
    fetchPurchaseOrders,
    fetchSuppliers,
    receivePurchaseOrder,
    searchMedicines,
} from "@/features/pharmacy/api";
import type { PurchaseOrder } from "@/features/pharmacy/types";
import { getErrorMessage } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/format";

const supplierName = (po: PurchaseOrder) => (typeof po.supplierId === 'object' ? po.supplierId.name : '—');
const poTotal = (po: PurchaseOrder) => po.items.reduce((s, i) => s + i.quantity * i.estimatedUnitPrice, 0);

function NewOrderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const [supplierId, setSupplierId] = useState('');
  const [expected, setExpected] = useState('');
  const [rows, setRows] = useState([{ medicineId: '', qty: '', price: '' }]);

  useEffect(() => {
    if (open) {
      setSupplierId('');
      setExpected('');
      setRows([{ medicineId: '', qty: '', price: '' }]);
    }
  }, [open]);

  const { data: suppliers } = useQuery({ queryKey: ['pharmacy', 'suppliers'], queryFn: fetchSuppliers, enabled: open });
  const { data: medicines } = useQuery({ queryKey: ['pharmacy', 'medicines', ''], queryFn: () => searchMedicines(), enabled: open });

  const update = (i: number, p: Partial<(typeof rows)[number]>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...p } : r)));
  const complete = rows.filter((r) => r.medicineId && Number(r.qty) >= 1 && r.price !== '' && Number(r.price) >= 0);
  const total = complete.reduce((s, r) => s + Number(r.qty) * Number(r.price), 0);

  const save = useMutation({
    mutationFn: () =>
      createPurchaseOrder({
        supplierId,
        expectedDeliveryDate: expected || undefined,
        items: complete.map((r) => ({ medicineId: r.medicineId, quantity: Number(r.qty), estimatedUnitPrice: Number(r.price) })),
      }),
    onSuccess: () => {
      toast.success('Purchase order placed');
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'purchase-orders'] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New purchase order</DialogTitle>
          <DialogDescription>Placing an order doesn't add stock — stock is added when you receive the delivery.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Supplier</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder={(suppliers ?? []).length === 0 ? 'Add a supplier first' : 'Select supplier'} />
                </SelectTrigger>
                <SelectContent>
                  {(suppliers ?? []).map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="po-exp">Expected delivery (optional)</Label>
              <Input id="po-exp" type="date" value={expected} onChange={(e) => setExpected(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-2">
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-[1fr_90px_110px_auto] items-center gap-2">
                <Select value={r.medicineId} onValueChange={(v) => update(i, { medicineId: v })}>
                  <SelectTrigger aria-label={`Medicine ${i + 1}`}>
                    <SelectValue placeholder="Medicine" />
                  </SelectTrigger>
                  <SelectContent>
                    {(medicines ?? []).map((m) => (
                      <SelectItem key={m._id} value={m._id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="number" min={1} placeholder="Qty" value={r.qty} onChange={(e) => update(i, { qty: e.target.value })} />
                <Input type="number" min={0} step="any" placeholder="Est. price" value={r.price} onChange={(e) => update(i, { price: e.target.value })} />
                <Button type="button" variant="ghost" size="icon" disabled={rows.length === 1} onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setRows((rs) => [...rs, { medicineId: '', qty: '', price: '' }])}>
              <Plus className="h-4 w-4" /> Add line
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Estimated total: {formatCurrency(total)}</span>
            <Button disabled={!supplierId || complete.length === 0 || save.isPending} onClick={() => save.mutate()}>
              {save.isPending ? 'Placing…' : 'Place order'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReceiveDialog({ po, onClose }: { po: PurchaseOrder | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<{ batchNumber: string; expiryDate: string; qty: string; price: string }[]>([]);
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

  // Defaults come from the order (ordered qty / estimated price) so the
  // common case - delivery matches the order - only needs batch + expiry typed.
  useEffect(() => {
    if (po) setRows(po.items.map((i) => ({ batchNumber: '', expiryDate: '', qty: String(i.quantity), price: String(i.estimatedUnitPrice) })));
  }, [po]);

  const update = (i: number, p: Partial<(typeof rows)[number]>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...p } : r)));
  const valid = rows.length > 0 && rows.every((r) => r.batchNumber.trim() && r.expiryDate && Number(r.qty) >= 1 && r.price !== '' && Number(r.price) >= 0);

  const receive = useMutation({
    mutationFn: () =>
      receivePurchaseOrder(po!._id, {
        items: po!.items.map((it, i) => ({
          medicineId: typeof it.medicineId === 'object' ? it.medicineId._id : it.medicineId,
          batchNumber: rows[i].batchNumber.trim(),
          expiryDate: rows[i].expiryDate,
          quantityReceived: Number(rows[i].qty),
          pricePerUnit: Number(rows[i].price),
        })),
      }),
    onSuccess: () => {
      toast.success('Delivery received — stock updated');
      queryClient.invalidateQueries({ queryKey: ['pharmacy'] });
      onClose();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <Dialog open={!!po} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receive delivery — {po && supplierName(po)}</DialogTitle>
          <DialogDescription>Enter the batch number and expiry printed on each item. All lines are received together.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          {po?.items.map((it, i) => {
            const med = typeof it.medicineId === 'object' ? it.medicineId : null;
            const r = rows[i];
            if (!r) return null;
            return (
              <div key={i} className="grid gap-2 rounded-md border p-3">
                <p className="text-sm font-medium">
                  {med?.name} <span className="font-normal text-muted-foreground">— ordered {it.quantity} {med?.unit}</span>
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Input placeholder="Batch no." aria-label="Batch number" value={r.batchNumber} onChange={(e) => update(i, { batchNumber: e.target.value })} />
                  <Input type="date" min={tomorrow} aria-label="Expiry date" value={r.expiryDate} onChange={(e) => update(i, { expiryDate: e.target.value })} />
                  <Input type="number" min={1} aria-label="Quantity received" value={r.qty} onChange={(e) => update(i, { qty: e.target.value })} />
                  <Input type="number" min={0} step="any" aria-label="Price per unit" value={r.price} onChange={(e) => update(i, { price: e.target.value })} />
                </div>
              </div>
            );
          })}
          <Button disabled={!valid || receive.isPending} onClick={() => receive.mutate()}>
            {receive.isPending ? 'Receiving…' : 'Receive and add to stock'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddSupplierDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const [f, setF] = useState({ name: '', contactPerson: '', phone: '', email: '', address: '' });
  const set = (k: keyof typeof f, v: string) => setF((c) => ({ ...c, [k]: v }));
  const save = useMutation({
    mutationFn: () =>
      createSupplier({
        name: f.name.trim(),
        contactPerson: f.contactPerson.trim() || undefined,
        phone: f.phone.trim() || undefined,
        email: f.email.trim() || undefined,
        address: f.address.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Supplier added');
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'suppliers'] });
      setF({ name: '', contactPerson: '', phone: '', email: '', address: '' });
      onOpenChange(false);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a supplier</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="s-name">Company name</Label>
            <Input id="s-name" value={f.name} onChange={(e) => set('name', e.target.value)} required autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="s-contact">Contact person</Label>
              <Input id="s-contact" value={f.contactPerson} onChange={(e) => set('contactPerson', e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="s-phone">Phone</Label>
              <Input id="s-phone" value={f.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="s-email">Email</Label>
            <Input id="s-email" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="s-addr">Address</Label>
            <Input id="s-addr" value={f.address} onChange={(e) => set('address', e.target.value)} />
          </div>
          <Button type="submit" disabled={!f.name.trim() || save.isPending}>
            {save.isPending ? 'Adding…' : 'Add supplier'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PurchaseOrdersPage() {
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [showSupplier, setShowSupplier] = useState(false);
  const [receiving, setReceiving] = useState<PurchaseOrder | null>(null);

  const { data: orders, isLoading } = useQuery({ queryKey: ['pharmacy', 'purchase-orders'], queryFn: fetchPurchaseOrders });
  const { data: suppliers } = useQuery({ queryKey: ['pharmacy', 'suppliers'], queryFn: fetchSuppliers });

  const cancel = useMutation({
    mutationFn: (id: string) => cancelPurchaseOrder(id),
    onSuccess: () => {
      toast.success('Order cancelled');
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'purchase-orders'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div>
      <PageHeader title="Purchase orders" description="Order from suppliers and receive deliveries into stock." />

      <Tabs defaultValue="orders">
        <div className="mb-2 flex items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers ({suppliers?.length ?? 0})</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="orders">
          <div className="mb-3 flex justify-end">
            <Button onClick={() => setShowNew(true)}>
              <Plus className="h-4 w-4" /> New order
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-2 p-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (orders ?? []).length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">No purchase orders yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="p-3 font-medium">Placed</th>
                      <th className="p-3 font-medium">Supplier</th>
                      <th className="p-3 font-medium">Items</th>
                      <th className="p-3 font-medium">Est. total</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="p-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {orders!.map((po) => (
                      <tr key={po._id} className="border-t">
                        <td className="p-3">{formatDate(po.createdAt)}</td>
                        <td className="p-3 font-medium">{supplierName(po)}</td>
                        <td className="p-3 text-muted-foreground">{po.items.length}</td>
                        <td className="p-3">{formatCurrency(poTotal(po))}</td>
                        <td className="p-3">
                          <Badge variant={po.status === 'received' ? 'success' : po.status === 'cancelled' ? 'destructive' : 'warning'}>
                            {po.status === 'pending' ? 'Awaiting delivery' : po.status === 'received' ? 'Received' : 'Cancelled'}
                          </Badge>
                          {po.status === 'pending' && po.expectedDeliveryDate && (
                            <span className="ml-2 text-xs text-muted-foreground">due {formatDate(po.expectedDeliveryDate)}</span>
                          )}
                        </td>
                        <td className="p-3">
                          {po.status === 'pending' && (
                            <div className="flex justify-end gap-1">
                              <Button size="sm" onClick={() => setReceiving(po)}>
                                Receive
                              </Button>
                              <Button size="sm" variant="ghost" disabled={cancel.isPending} onClick={() => cancel.mutate(po._id)}>
                                Cancel
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers">
          <div className="mb-3 flex justify-end">
            <Button onClick={() => setShowSupplier(true)}>
              <Plus className="h-4 w-4" /> Add supplier
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {(suppliers ?? []).length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">No suppliers yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {suppliers!.map((s) => (
                      <tr key={s._id} className="border-t first:border-0">
                        <td className="p-3 font-medium">{s.name}</td>
                        <td className="p-3 text-muted-foreground">{s.contactPerson}</td>
                        <td className="p-3 text-muted-foreground">{s.phone}</td>
                        <td className="p-3 text-muted-foreground">{s.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <NewOrderDialog open={showNew} onOpenChange={setShowNew} />
      <AddSupplierDialog open={showSupplier} onOpenChange={setShowSupplier} />
      <ReceiveDialog po={receiving} onClose={() => setReceiving(null)} />
    </div>
  );
}
