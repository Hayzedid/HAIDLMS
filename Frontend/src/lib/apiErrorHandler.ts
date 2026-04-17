import axios, { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export class ApiException extends Error {
  public status: number;
  public code?: string;
  public details?: any;

  constructor(message: string, status: number, code?: string, details?: any) {
    super(message);
    this.name = 'ApiException';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function handleApiError(error: unknown): ApiError {
  // Axios error
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;

    // Network error
    if (!axiosError.response) {
      return {
        message: 'Network error. Please check your connection and try again.',
        code: 'NETWORK_ERROR',
        status: 0,
      };
    }

    // Server error
    const { status, data } = axiosError.response;

    // Handle specific status codes
    switch (status) {
      case 400:
        return {
          message: data?.message || 'Invalid request. Please check your input.',
          code: data?.code || 'BAD_REQUEST',
          status,
          details: data?.errors || data?.details,
        };

      case 401:
        return {
          message: data?.message || 'You are not authenticated. Please log in.',
          code: data?.code || 'UNAUTHORIZED',
          status,
        };

      case 403:
        return {
          message: data?.message || 'You do not have permission to perform this action.',
          code: data?.code || 'FORBIDDEN',
          status,
        };

      case 404:
        return {
          message: data?.message || 'The requested resource was not found.',
          code: data?.code || 'NOT_FOUND',
          status,
        };

      case 409:
        return {
          message: data?.message || 'A conflict occurred. The resource may already exist.',
          code: data?.code || 'CONFLICT',
          status,
        };

      case 422:
        return {
          message: data?.message || 'Validation failed. Please check your input.',
          code: data?.code || 'VALIDATION_ERROR',
          status,
          details: data?.errors || data?.details,
        };

      case 429:
        return {
          message: data?.message || 'Too many requests. Please try again later.',
          code: data?.code || 'RATE_LIMIT',
          status,
        };

      case 500:
        return {
          message: data?.message || 'An internal server error occurred. Please try again later.',
          code: data?.code || 'INTERNAL_ERROR',
          status,
        };

      case 503:
        return {
          message: data?.message || 'Service temporarily unavailable. Please try again later.',
          code: data?.code || 'SERVICE_UNAVAILABLE',
          status,
        };

      default:
        return {
          message: data?.message || `An error occurred (${status}). Please try again.`,
          code: data?.code || 'UNKNOWN_ERROR',
          status,
        };
    }
  }

  // Generic error
  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR',
    };
  }

  // Unknown error
  return {
    message: 'An unexpected error occurred. Please try again.',
    code: 'UNKNOWN_ERROR',
  };
}

export function getErrorMessage(error: unknown): string {
  return handleApiError(error).message;
}

export function isNetworkError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return !error.response;
  }
  return false;
}

export function isAuthError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    return status === 401 || status === 403;
  }
  return false;
}

export function isValidationError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return error.response?.status === 422 || error.response?.status === 400;
  }
  return false;
}
