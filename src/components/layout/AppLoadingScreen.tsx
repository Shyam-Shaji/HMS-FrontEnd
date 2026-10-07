import { Loader2 } from "lucide-react";

// Shown once, at app boot, while we check localStorage for an existing
// session (see AuthProvider). Deliberately bare - this is on screen for
// milliseconds, not long enough to justify a skeleton layout.
export function AppLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
