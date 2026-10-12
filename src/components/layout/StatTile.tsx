import { Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton';

export function StatTile({
    label,
    value,
    hint,
    isLoading,
}:{
    label: string;
    value: number | string;
    hint?: string;
    isLoading?: boolean;
}) {
    return(
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-3xl font-semibold tracking-tight">{value}</p>}
        {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
    );
}
