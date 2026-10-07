import { StaffDashboardPage } from "./StaffDashboardPage";

export function PharmacyDashboardPage() {
  return (
    <StaffDashboardPage
      title="Pharmacy"
      subtitle="Dispensing queue and stock health."
      stats={[
        { label: 'Prescriptions to dispense', hint: 'Not yet fulfilled' },
        { label: 'Low stock items', hint: 'At or below reorder level' },
        { label: 'Expiring within 30 days', hint: 'Batches with stock left' },
      ]}
    />
  );
}
