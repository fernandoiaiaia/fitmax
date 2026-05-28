import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';

/**
 * Structured error shape returned to clients.
 */
interface ApiError {
  error: string;
  details?: unknown;
}

/**
 * Global error handler — must be registered LAST in Express middleware chain.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(422).json({
      error: 'Validation error',
      details: err.flatten().fieldErrors,
    } satisfies ApiError);
    return;
  }

  // Typed API errors with a status code
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message } satisfies ApiError);
    return;
  }

  // Express body-parser errors (e.g., PayloadTooLargeError)
  if (err && typeof err === 'object' && 'status' in err && (err as any).status === 413) {
    res.status(413).json({ error: 'Arquivo muito grande. O tamanho máximo permitido é 1 MB.' } satisfies ApiError);
    return;
  }

  // Unexpected errors
  logger.error(err, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' } satisfies ApiError);
}

/**
 * Custom application error class.
 * Throw this from services/controllers to produce clean HTTP responses.
 *
 * @example
 * throw new AppError('User not found', 404);
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
