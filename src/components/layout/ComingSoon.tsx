import { Construction } from "lucide-react";
import { PageHeader } from "./PageHeader";

// Placeholder for nav items whose full screen hasn't been built yet in
// this phase - keeps every role's navigation shell complete and
// clickable now, with real pages swapped in module-by-module next,
// mirroring how the backend itself was built one module at a time.
export function ComingSoon({ title }: { title: string }) {
  return (
    <div>
      <PageHeader title={title} />
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
        <Construction className="h-8 w-8 text-muted-foreground" />
        <div>
          <p className="font-medium">This screen is next up</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            The backend API for this is already built — this screen gets wired up to it in the next build pass.
          </p>
        </div>
      </div>
    </div>
  );
}