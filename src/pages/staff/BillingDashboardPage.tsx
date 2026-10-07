import { StaffDashboardPage } from "./StaffDashboardPage";

export function BillingDashboardPage() {
  return (
    <StaffDashboardPage
      title="Billing"
      subtitle="Today's collections and outstanding balances."
      stats={[
        { label: "Today's collections", hint: 'Payments recorded today' },
        { label: 'Outstanding balance', hint: 'Across all issued invoices' },
        { label: 'Pending insurance claims', hint: 'Submitted, not yet settled' },
      ]}
    />
  );
}
