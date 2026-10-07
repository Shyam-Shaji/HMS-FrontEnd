import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { HOME_PATH_BY_ROLE } from '@/config/nav-config';
import { getErrorMessage } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const RESEND_COOLDOWN_SECONDS = 30;

// Patient-primary login path: phone/email + OTP, no password to remember.
// Also doubles as signup - the backend creates a patient account on first
// verified OTP for a new identifier, so there's no separate "register"
// screen to build or for a first-time patient to find.
export function OtpPage() {
  const { requestOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = React.useState<'request' | 'verify'>('request');
  const [identifier, setIdentifier] = React.useState('');
  const [code, setCode] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(0);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error('Enter your phone number or email');
      return;
    }
    setSubmitting(true);
    try {
      await requestOtp(identifier.trim());
      setStep('verify');
      setCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success('Code sent. It expires in a few minutes.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length < 4) {
      toast.error('Enter the code we sent you');
      return;
    }
    setSubmitting(true);
    try {
      const user = await verifyOtp(identifier.trim(), code.trim());
      navigate(HOME_PATH_BY_ROLE[user.role], { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground">
            M
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Sign in with a code</h1>
          <p className="text-sm text-muted-foreground">No password needed.</p>
        </div>

        <Card>
          {step === 'request' ? (
            <>
              <CardHeader>
                <CardTitle className="text-base">Enter your phone or email</CardTitle>
                <CardDescription>We'll text or email you a one-time code.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRequest} className="flex flex-col gap-4" noValidate>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="identifier">Phone or email</Label>
                    <Input
                      id="identifier"
                      autoComplete="username"
                      placeholder="you@example.com or 9876543210"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Sending…' : 'Send code'}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="text-base">Enter the code</CardTitle>
                <CardDescription>Sent to {identifier}.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerify} className="flex flex-col gap-4" noValidate>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="code">6-digit code</Label>
                    <Input
                      id="code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={8}
                      className="text-center text-lg tracking-[0.5em]"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      autoFocus
                    />
                  </div>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Verifying…' : 'Verify and continue'}
                  </Button>
                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setStep('request');
                        setCode('');
                      }}
                    >
                      Change number
                    </button>
                    <button
                      type="button"
                      disabled={cooldown > 0}
                      className="text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                      onClick={handleRequest}
                    >
                      {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                    </button>
                  </div>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
