import { StaffDashboardPage } from "./StaffDashboardPage";

export function NurseDashboardPage() {
  return (
    <StaffDashboardPage
      title="Dashboard"
      subtitle="Your ward at a glance."
      stats={[
        { label: 'Patients under your care', hint: 'Currently admitted' },
        { label: 'Vitals due', hint: 'In the next hour' },
        { label: 'Medications due', hint: 'In the next hour' },
      ]}
    />
  );
}
