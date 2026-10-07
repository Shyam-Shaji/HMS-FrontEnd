import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Building2, Check, Search, Stethoscope } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchHospitalDirectory } from "@/features/hospitals/api";
import { fetchMyPatientRecords, selfRegisterPatient } from "@/features/patients/api";
import type { MyPatientRecord } from "@/features/patients/types";
import { searchDoctors, fetchDoctorSlots } from "@/features/doctors/api";
import { bookMyAppointment } from "@/features/appointments/api";
import { getErrorMessage } from "@/lib/api-client";
import { formatTime12h } from "@/lib/format";

type Step = 'hospital' | 'register' | 'doctor' | 'slot' | 'confirm';

const todayStr = new Date().toISOString().slice(0, 10);

export function BookAppointmentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>('hospital');
  const [patient, setPatient] = useState<MyPatientRecord | null>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<{ _id: string; name: string; department?: string } | null>(
    null,
  );
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  // ---- Step 1: which hospital (an existing patient record, or register fresh) ----
  const { data: myRecords, isLoading: loadingRecords } = useQuery({
    queryKey: ['patients', 'me'],
    queryFn: fetchMyPatientRecords,
  });
  const { data: hospitals, isLoading: loadingHospitals } = useQuery({
    queryKey: ['hospitals', 'directory'],
    queryFn: fetchHospitalDirectory,
  });

  const hospitalNameById = useMemo(() => {
    const map = new Map<string, string>();
    (hospitals ?? []).forEach((h) => map.set(h._id, h.name));
    return map;
  }, [hospitals]);

  const registeredHospitalIds = new Set((myRecords ?? []).map((r) => r.hospitalId));
  const newHospitalOptions = (hospitals ?? []).filter((h) => !registeredHospitalIds.has(h._id));

  // ---- Step "register": mini self-registration form ----
  const [regName, setRegName] = useState('');
  const [regDob, setRegDob] = useState('');
  const [regGender, setRegGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [regPhone, setRegPhone] = useState('');

  const registerMutation = useMutation({
    mutationFn: () =>
      selfRegisterPatient({
        hospitalId: selectedHospitalId!,
        name: regName,
        dob: regDob,
        gender: regGender as 'male' | 'female' | 'other',
        phone: regPhone,
      }),
    onSuccess: (newPatient) => {
      queryClient.invalidateQueries({ queryKey: ['patients', 'me'] });
      setPatient(newPatient);
      setStep('doctor');
      toast.success(`Registered at ${hospitalNameById.get(newPatient.hospitalId) ?? 'the hospital'}`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  // ---- Step 2: doctor search ----
  const { data: doctors, isLoading: loadingDoctors } = useQuery({
    queryKey: ['doctors', selectedHospitalId, doctorSearch],
    queryFn: () => searchDoctors({ hospitalId: selectedHospitalId!, q: doctorSearch || undefined }),
    enabled: step === 'doctor' && !!selectedHospitalId,
  });

  // ---- Step 3: slots ----
  const { data: slots, isLoading: loadingSlots } = useQuery({
    queryKey: ['doctors', selectedDoctor?._id, 'slots', date],
    queryFn: () => fetchDoctorSlots(selectedDoctor!._id, date),
    enabled: step === 'slot' && !!selectedDoctor,
  });

  // ---- Step 4: confirm & book ----
  const bookMutation = useMutation({
    mutationFn: () =>
      bookMyAppointment({
        patientId: patient!._id,
        doctorId: selectedDoctor!._id,
        date,
        time: time!,
        reason: reason || undefined,
      }),
    onSuccess: (appt) => {
      toast.success('Appointment booked');
      queryClient.invalidateQueries({ queryKey: ['appointments', 'me'] });
      navigate(`/patient/appointments/${appt._id}`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  function back() {
    if (step === 'register') setStep('hospital');
    else if (step === 'doctor') setStep('hospital');
    else if (step === 'slot') setStep('doctor');
    else if (step === 'confirm') setStep('slot');
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center gap-2">
        {step !== 'hospital' && (
          <Button variant="ghost" size="icon" onClick={back}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <PageHeader title="Book an appointment" />
      </div>

      {step === 'hospital' && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">Choose where you'd like to be seen.</p>

          {loadingRecords ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            (myRecords ?? []).map((record) => (
              <Card
                key={record._id}
                className="cursor-pointer transition-colors hover:bg-accent"
                onClick={() => {
                  setPatient(record);
                  setSelectedHospitalId(record.hospitalId);
                  setStep('doctor');
                }}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{hospitalNameById.get(record.hospitalId) ?? 'Hospital'}</p>
                    <p className="text-sm text-muted-foreground">UHID {record.uhid}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          <div>
            <p className="mb-2 text-sm font-medium">Register at a new hospital</p>
            {loadingHospitals ? (
              <Skeleton className="h-16 w-full" />
            ) : newHospitalOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">You're already registered everywhere available.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {newHospitalOptions.map((h) => (
                  <Card
                    key={h._id}
                    className="cursor-pointer transition-colors hover:bg-accent"
                    onClick={() => {
                      setSelectedHospitalId(h._id);
                      setStep('register');
                    }}
                  >
                    <CardContent className="flex items-center gap-3 p-4">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{h.name}</p>
                        {h.address && <p className="text-sm text-muted-foreground">{h.address}</p>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {step === 'register' && (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            registerMutation.mutate();
          }}
        >
          <p className="text-sm text-muted-foreground">
            First time at {hospitalNameById.get(selectedHospitalId ?? '') ?? 'this hospital'} — a few details to set
            up your record there.
          </p>
          <div className="grid gap-2">
            <Label htmlFor="reg-name">Full name</Label>
            <Input id="reg-name" value={regName} onChange={(e) => setRegName(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reg-dob">Date of birth</Label>
            <Input id="reg-dob" type="date" value={regDob} onChange={(e) => setRegDob(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label>Gender</Label>
            <Select value={regGender} onValueChange={(v) => setRegGender(v as typeof regGender)}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reg-phone">Phone</Label>
            <Input id="reg-phone" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} required />
          </div>
          <Button type="submit" disabled={registerMutation.isPending || !regGender}>
            {registerMutation.isPending ? 'Registering…' : 'Continue'}
          </Button>
        </form>
      )}

      {step === 'doctor' && (
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search doctors by name or department"
              className="pl-9"
              value={doctorSearch}
              onChange={(e) => setDoctorSearch(e.target.value)}
            />
          </div>

          {loadingDoctors ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (doctors ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No doctors found. Try a different search.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {(doctors ?? []).map((doc) => (
                <Card
                  key={doc._id}
                  className="cursor-pointer transition-colors hover:bg-accent"
                  onClick={() => {
                    setSelectedDoctor(doc);
                    setStep('slot');
                  }}
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <Stethoscope className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Dr. {doc.name}</p>
                      {doc.department && <p className="text-sm text-muted-foreground">{doc.department}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 'slot' && selectedDoctor && (
        <div className="flex flex-col gap-4">
          <div>
            <p className="font-medium">Dr. {selectedDoctor.name}</p>
            {selectedDoctor.department && <p className="text-sm text-muted-foreground">{selectedDoctor.department}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              min={todayStr}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setTime(null);
              }}
            />
          </div>

          {loadingSlots ? (
            <Skeleton className="h-24 w-full" />
          ) : (slots ?? []).length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No slots available this day. Try a different date.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {(slots ?? []).map((slot) => (
                <Button
                  key={slot.time}
                  type="button"
                  variant={time === slot.time ? 'default' : 'outline'}
                  disabled={!slot.available}
                  onClick={() => setTime(slot.time)}
                >
                  {formatTime12h(slot.time)}
                </Button>
              ))}
            </div>
          )}

          <Button disabled={!time} onClick={() => setStep('confirm')}>
            Continue
          </Button>
        </div>
      )}

      {step === 'confirm' && selectedDoctor && time && (
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-2 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hospital</span>
                <span className="font-medium">{hospitalNameById.get(selectedHospitalId ?? '')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Doctor</span>
                <span className="font-medium">Dr. {selectedDoctor.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">When</span>
                <span className="font-medium">
                  {date} · {formatTime12h(time)}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-2">
            <Label htmlFor="reason">Reason for visit (optional)</Label>
            <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>

          <Button disabled={bookMutation.isPending} onClick={() => bookMutation.mutate()}>
            <Check className="h-4 w-4" />
            {bookMutation.isPending ? 'Booking…' : 'Confirm booking'}
          </Button>
        </div>
      )}
    </div>
  );
}
