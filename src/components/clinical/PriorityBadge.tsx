import { Badge } from "../ui/badge";
import type { LabOrderPriority } from "@/features/lab/types";

export function PriorityBadge({ priority }: { priority: LabOrderPriority }) {
  if (priority === 'stat') return <Badge variant="destructive">STAT</Badge>;
  if (priority === 'urgent') return <Badge variant="warning">Urgent</Badge>;
  return <Badge variant="secondary">Routine</Badge>;
}
