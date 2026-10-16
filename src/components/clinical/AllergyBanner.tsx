import { AlertTriangle } from "lucide-react";

// Red is reserved for safety-critical alerts (UI/UX spec) - this is the
// canonical one. Always rendered at the top of any screen where a clinician
// could prescribe or order something, never tucked into a details list.
export function AllergyBanner({allergies, className = ''}: {allergies: string[]; className?: string}){
    if(allergies.length === 0) return null;
    return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive ${className}`}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-semibold">Allergies</p>
        <p>{allergies.join(', ')}</p>
      </div>
    </div>
  );
}
