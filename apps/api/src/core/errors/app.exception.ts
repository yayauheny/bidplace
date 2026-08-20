import {
  type ApiErrorCode,
  type ApiErrorResponse,
} from '@bidplace/contracts';
import { HttpException, type HttpStatus } from '@nestjs/common';

export type AppExceptionOptions = {
  status: HttpStatus | number;
  code: ApiErrorCode;
  message: string;
  details?: unknown;
};

export class AppException extends HttpException {
  readonly apiCode: ApiErrorCode;
  readonly apiDetails: unknown;

  constructor(options: AppExceptionOptions) {
    const body: Omit<ApiErrorResponse, 'status'> & { status?: number } = {
      code: options.code,
      message: options.message,
    };

    if (options.details !== undefined) {
      body.details = options.details;
    }

    super(body, options.status);
    this.apiCode = options.code;
    this.apiDetails = options.details;
  }
}
