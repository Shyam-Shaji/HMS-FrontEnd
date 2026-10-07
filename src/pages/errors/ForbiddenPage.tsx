import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <p className="text-sm font-medium text-muted-foreground">403</p>
      <h1 className="text-2xl font-semibold tracking-tight">You don't have access to this page</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Your account doesn't have permission to view this. If this seems wrong, check with your hospital admin.
      </p>
      <Button asChild className="mt-2">
        <Link to="/">Go home</Link>
      </Button>
    </div>
  );
}