import { type ZodType } from 'zod';

import {
  createNetworkError,
  createUnexpectedResponseError,
  throwApiClientResponseError,
} from './errors';

type FetchLike = typeof fetch;

export type ApiClientOptions = {
  baseUrl: string;
  getAccessToken?: () => string | null | undefined;
  fetchImpl?: FetchLike;
  credentials?: RequestCredentials;
};

export type RequestOptions = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  headers?: HeadersInit;
  asFormData?: boolean;
};

export type RequestContext = {
  baseUrl: string;
  getAccessToken?: () => string | null | undefined;
  fetchImpl: FetchLike;
  credentials?: RequestCredentials;
};

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

function normalizeQuery(
  query?: Record<string, string | number | boolean | null | undefined>,
): string {
  if (!query) {
    return '';
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined) {
      continue;
    }

    params.set(key, String(value));
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export function createRequestContext(
  options: ApiClientOptions,
): RequestContext {
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    baseUrl: normalizeBaseUrl(options.baseUrl),
    fetchImpl: (input, init) => fetchImpl(input, init),
    ...(options.getAccessToken
      ? { getAccessToken: options.getAccessToken }
      : {}),
    ...(options.credentials ? { credentials: options.credentials } : {}),
  };
}

export async function requestJson<T>(
  context: RequestContext,
  path: string,
  schema: ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  const url = new URL(`${context.baseUrl}${path}`);
  const queryString = normalizeQuery(options.query);

  if (queryString) {
    url.search = queryString.slice(1);
  }

  const headers = new Headers(options.headers);

  if (context.getAccessToken) {
    const accessToken = context.getAccessToken();

    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  let body: BodyInit | undefined;

  if (options.body !== undefined) {
    if (options.asFormData) {
      const formData = new FormData();
      const payload = options.body as Record<string, unknown>;

      for (const [key, value] of Object.entries(payload)) {
        if (value === null || value === undefined) {
          continue;
        }

        if (Array.isArray(value)) {
          for (const item of value) {
            if (item instanceof Blob) {
              formData.append(key, item, 'upload');
            } else {
              formData.append(key, String(item));
            }
          }
          continue;
        }

        if (value instanceof Blob) {
          formData.append(key, value, 'upload');
          continue;
        }

        formData.append(key, String(value));
      }

      body = formData;
    } else {
      headers.set('Content-Type', 'application/json');
      body = JSON.stringify(options.body);
    }
  }

  const init: RequestInit = {
    method: options.method ?? 'GET',
    headers,
  };

  if (context.credentials) {
    init.credentials = context.credentials;
  }

  if (body !== undefined) {
    init.body = body;
  }

  let response: Response;

  try {
    response = await context.fetchImpl(url.toString(), init);
  } catch {
    throw createNetworkError();
  }

  if (!response.ok) {
    await throwApiClientResponseError(response);
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    throw createUnexpectedResponseError(response.status);
  }

  try {
    const payload = (await response.json()) as unknown;
    return schema.parse(payload);
  } catch {
    throw createUnexpectedResponseError(response.status);
  }
}
