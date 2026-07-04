import type { Response } from 'express';

export const ErrorCode = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_REQUEST: 'INVALID_REQUEST',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_LEDGER_QUERY: 'INVALID_LEDGER_QUERY',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface ApiErrorBody {
  error: true;
  code: ErrorCode;
  message: string;
  details?: unknown;
}

export function buildErrorResponse(
  code: ErrorCode,
  message: string,
  details?: unknown
): ApiErrorBody {
  const body: ApiErrorBody = { error: true, code, message };
  if (details !== undefined) {
    body.details = details;
  }
  return body;
}

export function sendError(
  res: Response,
  status: number,
  code: ErrorCode,
  message: string,
  details?: unknown
): void {
  res.status(status).json(buildErrorResponse(code, message, details));
}

export class ApiError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly httpStatus: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }

  toJSON(): ApiErrorBody {
    return buildErrorResponse(this.code, this.message, this.details);
  }
}

export function handleRouteError(res: Response, err: unknown, context: string): void {
  if (err instanceof ApiError) {
    res.status(err.httpStatus).json(err.toJSON());
    return;
  }
  console.error(`${context}:`, err);
  sendError(res, 500, ErrorCode.INTERNAL_ERROR, 'Internal server error');
}