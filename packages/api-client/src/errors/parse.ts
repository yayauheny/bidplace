import {
  apiErrorResponseSchema,
  type ApiErrorResponse,
} from '@bidplace/contracts';

import { ApiClientError } from './api-client-error';
import { classifyApiError } from './classify';

export function parseApiError(payload: unknown): ApiErrorResponse | null {
  const result = apiErrorResponseSchema.safeParse(payload);
  return result.success ? result.data : null;
}

async function readErrorPayload(
  response: Response,
): Promise<ApiErrorResponse | null> {
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    return null;
  }

  try {
    const payload = (await response.json()) as unknown;
    return parseApiError(payload);
  } catch {
    return null;
  }
}

function diagnosticMessage(
  payload: ApiErrorResponse | null,
  response: Response,
): string {
  if (payload?.message) {
    return payload.message;
  }

  const statusText = response.statusText.trim();
  return statusText || 'Request failed';
}

export async function throwApiClientResponseError(
  response: Response,
): Promise<never> {
  const payload = await readErrorPayload(response);
  const kind = classifyApiError(response.status, payload);
  const headerRequestId = response.headers.get('x-request-id');
  const requestId = payload?.requestId ?? headerRequestId ?? null;

  throw new ApiClientError(diagnosticMessage(payload, response), {
    kind,
    status: response.status,
    code: payload?.code ?? null,
    details: payload?.details ?? null,
    requestId,
  });
}

export function createNetworkError(cause?: unknown): ApiClientError {
  return new ApiClientError('Network request failed', {
    kind: 'network',
    status: 0,
    ...(cause !== undefined ? { cause } : {}),
  });
}

export function createUnexpectedResponseError(
  status: number,
  cause?: unknown,
): ApiClientError {
  return new ApiClientError('Unexpected response from server', {
    kind: 'unexpected_response',
    status,
    ...(cause !== undefined ? { cause } : {}),
  });
}
