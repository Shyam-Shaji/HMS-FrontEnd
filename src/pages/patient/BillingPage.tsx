import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Receipt } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchMyInvoices } from "@/features/billing/api";
import type { InvoiceStatus } from "@/features/billing/types";
import { formatCurrency, formatDate } from "@/lib/format";

function statusBadge(status: InvoiceStatus) {
  if (status === 'paid') return <Badge variant="success">Paid</Badge>;
  if (status === 'partially_paid') return <Badge variant="warning">Partially paid</Badge>;
  if (status === 'cancelled') return <Badge variant="destructive">Cancelled</Badge>;
  return <Badge variant="secondary">Issued</Badge>;
}

export function BillingPage() {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['billing', 'me'],
    queryFn: fetchMyInvoices,
  });

  // Draft invoices aren't a patient's concern yet - they're still being
  // assembled by billing staff and may change before being issued.
  const visible = (invoices ?? []).filter((inv) => inv.status !== 'draft');

  return (
    <div>
      <PageHeader title="Billing" description="Your invoices, across every hospital." />

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <Receipt className="h-7 w-7 text-muted-foreground" />
            <p className="font-medium">No bills yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((inv) => (
            <Link key={inv._id} to={`/patient/billing/${inv._id}`}>
              <Card className="transition-colors hover:bg-accent">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{inv.invoiceNumber}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {formatDate(inv.issuedAt ?? inv.createdAt)} · {formatCurrency(inv.totalAmount)}
                      {inv.balanceDue > 0 ? ` · ${formatCurrency(inv.balanceDue)} due` : ''}
                    </p>
                  </div>
                  {statusBadge(inv.status)}
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
