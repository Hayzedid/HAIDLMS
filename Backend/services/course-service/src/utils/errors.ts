// ========================================
// CUSTOM ERROR CLASSES
// ========================================

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public errors?: any) {
    super(400, message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(404, message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
    this.name = 'ConflictError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(403, message);
    this.name = 'ForbiddenError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, public originalError?: any) {
    super(500, message);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    super(502, `External service '${service}' error: ${message}`);
    this.name = 'ExternalServiceError';
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(429, message);
    this.name = 'RateLimitError';
  }
}

export class BusinessLogicError extends AppError {
  constructor(message: string) {
    super(422, message);
    this.name = 'BusinessLogicError';
  }
}

// ========================================
// ERROR HANDLER UTILITY
// ========================================

export const handleError = (error: any): AppError => {
  // Zod validation errors
  if (error.name === 'ZodError') {
    const validationErrors = error.errors.map((err: any) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    return new ValidationError('Validation failed', validationErrors);
  }

  // PostgreSQL errors
  if (error.code) {
    switch (error.code) {
      case '23505': // unique_violation
        return new ConflictError('Resource already exists');
      case '23503': // foreign_key_violation
        return new ValidationError('Referenced resource does not exist');
      case '23502': // not_null_violation
        return new ValidationError('Required field is missing');
      case '22P02': // invalid_text_representation
        return new ValidationError('Invalid data format');
      default:
        return new DatabaseError('Database operation failed', error);
    }
  }

  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }

  // Unknown error
  return new AppError(500, error.message || 'An unexpected error occurred', false);
};
