import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createPatient, searchPatients } from "@/features/patients/api";
import type { Gender } from "@/features/patients/types";
import { getErrorMessage } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { useDebounce } from "@/lib/use-debounce";

function RegisterPatientDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [allergies, setAllergies] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      createPatient({
        name,
        dob,
        gender: gender as Gender,
        phone,
        email: email || undefined,
        // Comma-separated in the form, an array on the wire. Allergies
        // are captured at registration because they drive the red banner
        // on every clinical screen later.
        allergies: allergies
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean),
      }),
    onSuccess: (p) => {
      toast.success(`Registered ${p.name} — UHID ${p.uhid}`);
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      onOpenChange(false);
      setName('');
      setDob('');
      setGender('');
      setPhone('');
      setEmail('');
      setAllergies('');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register a patient</DialogTitle>
          <DialogDescription>A UHID is generated automatically.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="p-name">Full name</Label>
            <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="p-dob">Date of birth</Label>
              <Input id="p-dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="p-phone">Phone</Label>
            <Input id="p-phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="p-email">Email (optional)</Label>
            <Input id="p-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="p-allergies">Known allergies (optional)</Label>
            <Input
              id="p-allergies"
              placeholder="e.g. Penicillin, Peanuts"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Separate with commas.</p>
          </div>
          <Button type="submit" disabled={mutation.isPending || !gender}>
            {mutation.isPending ? 'Registering…' : 'Register patient'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ReceptionPatientsPage() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [showRegister, setShowRegister] = useState(false);
  const debouncedQ = useDebounce(q);

  const { data, isLoading } = useQuery({
    queryKey: ['patients', 'list', debouncedQ, page],
    queryFn: () => searchPatients({ q: debouncedQ || undefined, page, limit: 20 }),
  });

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <PageHeader title="Patients" description="Find a patient or register a new one." />
        <Button onClick={() => setShowRegister(true)}>
          <UserPlus className="h-4 w-4" />
          Register patient
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name, phone or UHID"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          autoFocus
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (data?.items ?? []).length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              {debouncedQ ? 'No patient matches that search.' : 'No patients registered yet.'}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="p-3 font-medium">Name</th>
                  <th className="p-3 font-medium">UHID</th>
                  <th className="p-3 font-medium">Phone</th>
                  <th className="p-3 font-medium">Date of birth</th>
                </tr>
              </thead>
              <tbody>
                {data!.items.map((p) => (
                  <tr key={p._id} className="border-t hover:bg-accent">
                    <td className="p-3">
                      <Link to={`/reception/patients/${p._id}`} className="font-medium hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="p-3 text-muted-foreground">{p.uhid}</td>
                    <td className="p-3 text-muted-foreground">{p.phone}</td>
                    <td className="p-3 text-muted-foreground">{formatDate(p.dob)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {data.page} of {data.totalPages} · {data.total} patients
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <RegisterPatientDialog open={showRegister} onOpenChange={setShowRegister} />
    </div>
  );
}
