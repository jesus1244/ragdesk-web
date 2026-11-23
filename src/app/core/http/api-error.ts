import { HttpErrorResponse } from '@angular/common/http';

/** Error body returned by the API (see ragdesk/core/schemas.py). */
export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

interface ValidationDetail {
  loc: (string | number)[];
  msg: string;
}

/** Turns any HTTP error into a short, human-readable message. */
export function errorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }
  if (error.status === 0) {
    return 'Cannot reach the server. Check your connection.';
  }
  const body = error.error as Partial<ApiErrorBody> | null;
  if (body?.code === 'validation_error' && Array.isArray(body.details)) {
    const first = body.details[0] as ValidationDetail | undefined;
    if (first) {
      const field = first.loc.filter((part) => part !== 'body').join('.');
      return field ? `${field}: ${first.msg}` : first.msg;
    }
  }
  return body?.message ?? fallback;
}
