import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCard {
  label: string;
  hint: string;
}

// One reusable dashboard shell for every staff role, parameterized by
// copy - the actual stats (today's appointments, pending lab orders,
// low-stock count, etc.) get wired to real queries per role in the next
// build pass. Skeleton placeholders here are deliberate: they're what
// these cards will look like while loading real data, not just filler.
export function StaffDashboardPage({ title, subtitle, stats }: { title: string; subtitle: string; stats: StatCard[] }) {
  return (
    <div>
      <PageHeader title={title} description={subtitle} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <p className="mt-2 text-xs text-muted-foreground">{stat.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
