// ========================================
// LOGGER UTILITY
// ========================================

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

interface LogContext {
  [key: string]: any;
}

class Logger {
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] [${this.serviceName}] ${message}${contextStr}`;
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const logContext = {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    };
    console.error(this.formatMessage(LogLevel.ERROR, message, logContext));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, context));
  }

  info(message: string, context?: LogContext): void {
    console.info(this.formatMessage(LogLevel.INFO, message, context));
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  // Specific log methods for common operations
  logDatabaseQuery(operation: string, table: string, duration: number): void {
    this.debug('Database query executed', {
      operation,
      table,
      duration: `${duration}ms`,
    });
  }

  logAPIRequest(method: string, path: string, userId?: string): void {
    this.info('API request received', {
      method,
      path,
      userId,
    });
  }

  logAPIResponse(method: string, path: string, statusCode: number, duration: number): void {
    this.info('API response sent', {
      method,
      path,
      statusCode,
      duration: `${duration}ms`,
    });
  }

  logExternalServiceCall(service: string, operation: string, duration: number): void {
    this.info('External service called', {
      service,
      operation,
      duration: `${duration}ms`,
    });
  }
}

// Factory function to create service-specific loggers
export const createLogger = (serviceName: string): Logger => {
  return new Logger(serviceName);
};

// Default logger instance
export const logger = createLogger('CourseService');
