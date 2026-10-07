import { StaffDashboardPage } from "./StaffDashboardPage";

export function LabDashboardPage() {
  return (
    <StaffDashboardPage
      title="Lab"
      subtitle="Test orders by status."
      stats={[
        { label: 'Pending', hint: 'Awaiting sample collection' },
        { label: 'In progress', hint: 'Sample collected, processing' },
        { label: 'Completed today', hint: 'Verified and released' },
      ]}
    />
  );
}
