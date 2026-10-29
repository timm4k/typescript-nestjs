import { STATUS_CODES } from 'node:http';
import {
  Catch,
  HttpException,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';

export interface ErrorResponse {
  success: false;
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  error: string;
  message: string[];
}

@Catch(HttpException)
export class GlobalExceptionFilter implements ExceptionFilter<HttpException> {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const statusCode = exception.getStatus();
    const details = exception.getResponse();
    const rawMessage: unknown =
      typeof details === 'string'
        ? details
        : 'message' in details
          ? details.message
          : exception.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.filter(
          (entry: unknown): entry is string => typeof entry === 'string',
        )
      : [typeof rawMessage === 'string' ? rawMessage : exception.message];
    const error =
      typeof details === 'object' &&
      'error' in details &&
      typeof details.error === 'string'
        ? details.error
        : (STATUS_CODES[statusCode] ?? 'Error');
    const body: ErrorResponse = {
      success: false,
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
      method: request.method,
      error,
      message,
    };
    response.status(statusCode).json(body);
  }
}
