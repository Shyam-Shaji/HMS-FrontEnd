import * as React from 'react';
import {useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import {z} from 'zod'
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { HOME_PATH_BY_ROLE } from '@/config/nav-config';
import { getErrorMessage } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const schema = z.object({
  identifier: z.string().min(3, 'Enter your email or phone number'),
  password: z.string().min(1, 'Enter your password'),
});
type FormValues = z.infer<typeof schema>;

// Password login - the primary path for staff accounts. Patients mostly
// use OTP (see OtpRequestPage) but can set a password too, so this screen
// serves both; the "Use a one-time code instead" link is the fork.
export function LoginPage() {
  const { loginWithPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const user = await loginWithPassword(values.identifier, values.password);
      const redirectTo = (location.state as { from?: Location })?.from?.pathname || HOME_PATH_BY_ROLE[user.role];
      navigate(redirectTo, { replace: true });
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
          <h1 className="text-xl font-semibold tracking-tight">Sign in to MediFlow</h1>
          <p className="text-sm text-muted-foreground">Hospital operations, from booking to discharge.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Welcome back</CardTitle>
            <CardDescription>Enter your details to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="identifier">Email or phone</Label>
                <Input id="identifier" autoComplete="username" {...register('identifier')} aria-invalid={!!errors.identifier} />
                {errors.identifier && <p className="text-sm text-destructive">{errors.identifier.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete="current-password" {...register('password')} aria-invalid={!!errors.password} />
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>
              <Button type="submit" className="mt-1" disabled={submitting}>
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-5 flex flex-col items-center gap-2 text-sm">
              <Link to="/otp" className="text-primary hover:underline">
                Use a one-time code instead
              </Link>
              <span className="text-muted-foreground">
                New patient?{' '}
                <Link to="/otp" className="text-primary hover:underline">
                  Create an account
                </Link>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
