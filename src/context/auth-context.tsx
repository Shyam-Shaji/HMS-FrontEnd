import * as React from 'react';
import { apiClient } from '@/lib/api-client';
import { tokenStorage } from '@/lib/token-storage';
import { Role, type AuthUser, type LoginResponse } from '@/types/auth';


interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  loginWithPassword: (identifier: string, password: string) => Promise<AuthUser>;
  requestOtp: (identifier: string) => Promise<void>;
  verifyOtp: (identifier: string, code: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

// Decodes just enough of the JWT payload to know who's logged in on page
// load, without a round trip - the access token already carries
// {sub, role, hospitalId}. This is read-only trust of our own
// server-issued token, not a security boundary (every API call is still
// independently authorized server-side).
function userFromToken(token: string): AuthUser | null {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {id: payload.sub, role: payload.role, hospitalId: payload.hospitalId ?? null, email: payload.email};
    } catch {
        return null;
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const token = tokenStorage.getAccessToken();
    if (token) setUser(userFromToken(token));
    setIsLoading(false);
  }, []);

  const applySession = (res: LoginResponse): AuthUser => {
    tokenStorage.setTokens(res.accessToken, res.refreshToken);
    const authUser: AuthUser = { id: res.user.id, role: res.user.role, hospitalId: res.user.hospitalId };
    setUser(authUser);
    return authUser;
  };

  const loginWithPassword = async (identifier: string, password: string) => {
    const res = await apiClient.post<never, LoginResponse>('/auth/login', { identifier, password });
    return applySession(res);
  };

  const requestOtp = async (identifier: string) => {
    await apiClient.post('/auth/otp/request', { identifier });
  };

  const verifyOtp = async (identifier: string, code: string) => {
    const res = await apiClient.post<never, LoginResponse>('/auth/otp/verify', { identifier, code });
    return applySession(res);
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      tokenStorage.clear();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, loginWithPassword, requestOtp, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { Role };