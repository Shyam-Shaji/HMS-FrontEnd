import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, CreditCard } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchMyInvoiceById, initiateOnlinePayment, confirmOnlinePayment } from "@/features/billing/api";
import { formatCurrency, formatDate, humanizeStatus } from "@/lib/format";
import { getErrorMessage } from "@/lib/api-client";

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['billing', 'me', id],
    queryFn: () => fetchMyInvoiceById(id!),
    enabled: !!id,
  });

  // The backend's payment gateway is a mock (see hms-backend README) -
  // there's no real checkout widget to hand off to yet, so "Pay now"
  // initiates then immediately confirms in one step. Once a real gateway
  // is wired in, this becomes: initiate -> open the gateway's checkout ->
  // its callback calls confirm, not this button directly.
  const payMutation = useMutation({
    mutationFn: async () => {
      const { payment } = await initiateOnlinePayment(id!, invoice!.balanceDue);
      return confirmOnlinePayment(payment._id);
    },
    onSuccess: () => {
      toast.success('Payment successful');
      queryClient.invalidateQueries({ queryKey: ['billing', 'me'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-xl space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!invoice) return <p className="text-center text-sm text-muted-foreground">Invoice not found.</p>;

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/patient/billing')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={invoice.invoiceNumber}
          description={`${formatDate(invoice.issuedAt ?? invoice.createdAt)} · ${humanizeStatus(invoice.status)}`}
        />
      </div>

      <Card className="mb-4">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <tbody>
              {invoice.lineItems.map((item, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="p-3">
                    <p className="font-medium">{item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} × {formatCurrency(item.unitPrice)}
                    </p>
                  </td>
                  <td className="p-3 text-right font-medium">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex flex-col gap-1.5 border-t p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>-{formatCurrency(invoice.discount)}</span>
              </div>
            )}
            {invoice.tax > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(invoice.tax)}</span>
              </div>
            )}
            <Separator className="my-1" />
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>{formatCurrency(invoice.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Paid</span>
              <span>{formatCurrency(invoice.amountPaid)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span>Balance due</span>
              <span>{formatCurrency(invoice.balanceDue)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {invoice.balanceDue > 0 && (
        <Button className="w-full" disabled={payMutation.isPending} onClick={() => payMutation.mutate()}>
          <CreditCard className="h-4 w-4" />
          {payMutation.isPending ? 'Processing…' : `Pay ${formatCurrency(invoice.balanceDue)} now`}
        </Button>
      )}
    </div>
  );
}
