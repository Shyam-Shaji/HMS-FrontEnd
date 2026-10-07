import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from 'axios';
import { tokenStorage } from './token-storage';
import type { ApiError } from '@/types/api';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Attach access token to every request
apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();

  if (token) {
    if (!config.headers) {
      config.headers = new AxiosHeaders();
    }

    config.headers.set('Authorization', `Bearer ${token}`);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data?.data ?? response.data,

  async (error: AxiosError<ApiError>) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined;

    if (
      error.response?.status === 401 &&
      original &&
      !original._retried
    ) {
      original._retried = true;

      const refreshed = await tryRefresh();

      if (refreshed) {
        if (!original.headers) {
          original.headers = new AxiosHeaders();
        }

        original.headers.set(
          'Authorization',
          `Bearer ${refreshed}`,
        );

        return apiClient(original);
      }

      tokenStorage.clear();
      window.location.href = '/login';
    }

    const normalized: ApiError = error.response?.data ?? {
      success: false,
      statusCode: error.response?.status ?? 0,
      error: 'Network Error',
      message:
        error.message ||
        'Could not reach the server. Check your connection and try again.',
      path: original?.url ?? '',
      timestamp: new Date().toISOString(),
    };

    return Promise.reject(normalized);
  },
);

let refreshPromise: Promise<string | null> | null = null;

function tryRefresh(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function doRefresh(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  try {
    const res = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
    );

    const {
      accessToken,
      refreshToken: newRefreshToken,
    } = res.data.data;

    tokenStorage.setTokens(
      accessToken,
      newRefreshToken,
    );

    return accessToken;
  } catch {
    return null;
  }
}

export function getErrorMessage(error: unknown): string {
  const apiError = error as Partial<ApiError> | undefined;

  if (!apiError?.message) {
    return 'Something went wrong. Please try again.';
  }

  return Array.isArray(apiError.message)
    ? apiError.message.join(' ')
    : apiError.message;
}