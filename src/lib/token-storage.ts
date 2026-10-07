// Centralized so there's exactly one place that knows the storage keys and
// mechanism - swapping this for httpOnly cookies later (the more secure
// option for production, but requires backend cookie support this
// foundation doesn't have yet) only means editing this one file.
const ACCESS_TOKEN_KEY = 'mediflow.accessToken';
const REFRESH_TOKEN_KEY = 'mediflow.refreshToken';

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
