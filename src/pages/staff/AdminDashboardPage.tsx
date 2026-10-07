import { StaffDashboardPage } from "./StaffDashboardPage";

export function AdminDashboardPage() {
  return (
    <StaffDashboardPage
      title="Hospital overview"
      subtitle="Occupancy, staff, and today's activity."
      stats={[
        { label: 'Bed occupancy', hint: 'Occupied vs. total beds' },
        { label: 'Active staff', hint: 'Across all departments' },
        { label: "Today's revenue", hint: 'Payments collected today' },
      ]}
    />
  );
}
