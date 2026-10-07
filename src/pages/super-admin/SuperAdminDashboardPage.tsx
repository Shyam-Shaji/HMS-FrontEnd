import { StaffDashboardPage } from "../staff/StaffDashboardPage";

export function SuperAdminDashboardPage() {
  return (
    <StaffDashboardPage
      title="Platform overview"
      subtitle="Hospitals, usage, and platform health at a glance."
      stats={[
        { label: 'Active hospitals', hint: 'On the platform' },
        { label: 'Total staff accounts', hint: 'Across all hospitals' },
        { label: 'Platform-wide appointments today', hint: 'All hospitals combined' },
      ]}
    />
  );
}