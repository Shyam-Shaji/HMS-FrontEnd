import { useState } from "react";
import { toast } from "sonner";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFileSize, openProtectedFile } from "@/lib/files";

// `path` is the role-appropriate authenticated download route, e.g.
// /lab/me/:id/report-file for a patient, /lab/orders/:id/report-file for staff.
export function ReportFileButton({ path, mime, size, label = 'View report' }: { path: string; mime?: string; size?: number; label?: string }) {
  const [busy, setBusy] = useState(false);
  const kind = mime === 'application/pdf' ? 'PDF' : mime?.startsWith('image/') ? 'Image' : 'File';

  async function open() {
    setBusy(true);
    try {
      await openProtectedFile(path);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={busy} onClick={open}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
      {label}
      <span className="text-xs text-muted-foreground">
        {kind}
        {size ? ` · ${formatFileSize(size)}` : ''}
      </span>
    </Button>
  );
}
