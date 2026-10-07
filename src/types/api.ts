// Mirrors the backend's response envelope exactly (see
// common/interceptors/transform.interceptor.ts and
// common/filters/http-exception.filter.ts in hms-backend).
export interface ApiSuccess<T>{
    success: true,
    data: T;
    timestamp: string;
}

export interface ApiError {
  success: false;
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
