import { apiClient } from "@/lib/api-client";
import type { Invoice, InitiatePaymentResult } from "./types";

export function fetchMyInvoices() {
  return apiClient.get<never, Invoice[]>('/billing/me');
}

export function fetchMyInvoiceById(id: string) {
  return apiClient.get<never, Invoice>(`/billing/me/${id}`);
}

export function initiateOnlinePayment(invoiceId: string, amount: number) {
  return apiClient.post<never, InitiatePaymentResult>(`/billing/me/invoices/${invoiceId}/pay/initiate`, { amount });
}

// The backend's PaymentGatewayService is a MOCK (see hms-backend README) -
// there is no real checkout widget to redirect to yet, so this simulates
// the gateway's own confirmation callback with placeholder values. Swap
// this for the real gateway's client-side checkout flow (e.g. Razorpay
// Checkout) once PaymentGatewayService is backed by a real provider.
export function confirmOnlinePayment(paymentId: string) {
  return apiClient.post<never, { _id: string }>(`/billing/payments/${paymentId}/confirm`, {
    gatewayPaymentId: `mock_payment_${Date.now()}`,
    signature: 'mock_signature',
  });
}
