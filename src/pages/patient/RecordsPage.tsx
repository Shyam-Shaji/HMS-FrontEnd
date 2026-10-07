import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, FileText, Stethoscope } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchMyRecordHistory } from "@/features/emr/api";
import { formatDate } from "@/lib/format";

// A timeline, not a table - this is a patient reading their own history,
// not a clinician scanning a worklist. Each entry leads with what a
// non-clinical reader actually recognizes (the date, the complaint),
// not the record's internal id.
export function RecordsPage() {
  const { data: records, isLoading } = useQuery({
    queryKey: ['emr', 'me', 'history'],
    queryFn: fetchMyRecordHistory,
  });

  return (
    <div>
      <PageHeader title="Health records" description="Your visit history, from every hospital you've seen." />

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : !records || records.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <FileText className="h-7 w-7 text-muted-foreground" />
            <div>
              <p className="font-medium">No records yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Visit summaries appear here after a consultation.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {records.map((record) => (
            <Link key={record._id} to={`/patient/records/${record.appointmentId}`}>
              <Card className="transition-colors hover:bg-accent">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                    <Stethoscope className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{record.chiefComplaint || 'Consultation'}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {formatDate(record.visitDate)}
                      {record.doctorId ? ` · Dr. ${record.doctorId.name}` : ''}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
