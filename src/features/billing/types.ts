export type LineItemCategory = 'consultation' | 'admission' | 'pharmacy' | 'lab' | 'procedure' | 'other';
export type InvoiceStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'cancelled';

export interface LineItem {
  description: string;
  category: LineItemCategory;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  lineItems: LineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: InvoiceStatus;
  issuedAt?: string;
  createdAt: string;
}

export interface InitiatePaymentResult {
  payment: { _id: string };
  gatewayOrderId: string;
}
