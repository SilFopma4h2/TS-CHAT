/**
 * Operational error with an HTTP status code attached.
 * Throw (or pass to next()) from route handlers; the central error handler
 * turns it into the matching JSON response.
 */
export class ApiError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}