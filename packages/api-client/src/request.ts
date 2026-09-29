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
  query?: Record<
    string,
    | string
    | number
    | boolean
    | readonly (string | number | boolean)[]
    | null
    | undefined
  >;
  headers?: HeadersInit;
  asFormData?: boolean;
  signal?: AbortSignal;
};

export type ReadCallOptions = {
  signal?: AbortSignal;
};

export function signalRequestOptions(
  options?: ReadCallOptions,
): { signal: AbortSignal } | Record<string, never> {
  return options?.signal ? { signal: options.signal } : {};
}

export type RequestContext = {
  baseUrl: string;
  getAccessToken?: () => string | null | undefined;
  fetchImpl: FetchLike;
  credentials?: RequestCredentials;
};

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

function isAbortError(cause: unknown): boolean {
  return cause instanceof Error && cause.name === 'AbortError';
}

function requestUrl(
  context: RequestContext,
  path: string,
  query?: RequestOptions['query'],
): string {
  const url = new URL(`${context.baseUrl}${path}`);
  const queryString = normalizeQuery(query);

  if (queryString) {
    url.search = queryString.slice(1);
  }

  return url.toString();
}

function requestHeaders(
  context: RequestContext,
  headersInit?: HeadersInit,
): Headers {
  const headers = new Headers(headersInit);

  if (context.getAccessToken) {
    const accessToken = context.getAccessToken();

    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  return headers;
}

async function fetchApi(
  context: RequestContext,
  url: string,
  init: RequestInit,
): Promise<Response> {
  try {
    return await context.fetchImpl(url, init);
  } catch (cause) {
    if (isAbortError(cause)) {
      throw cause;
    }

    throw createNetworkError(cause);
  }
}

function normalizeQuery(
  query?: RequestOptions['query'],
): string {
  if (!query) {
    return '';
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined) {
      continue;
    }

    params.set(key, Array.isArray(value) ? value.join(',') : String(value));
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
  const url = requestUrl(context, path, options.query);
  const headers = requestHeaders(context, options.headers);

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

        formData.append(
          key,
          typeof value === 'object' ? JSON.stringify(value) : String(value),
        );
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

  if (options.signal) {
    init.signal = options.signal;
  }

  if (context.credentials) {
    init.credentials = context.credentials;
  }

  if (body !== undefined) {
    init.body = body;
  }

  const response = await fetchApi(context, url, init);

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
  } catch (cause) {
    throw createUnexpectedResponseError(response.status, cause);
  }
}

export async function requestBlob(
  context: RequestContext,
  path: string,
  options: RequestOptions = {},
): Promise<Blob> {
  const url = requestUrl(context, path, options.query);
  const headers = requestHeaders(context, options.headers);
  const init: RequestInit = {
    method: options.method ?? 'GET',
    headers,
  };

  if (options.signal) {
    init.signal = options.signal;
  }

  if (context.credentials) {
    init.credentials = context.credentials;
  }

  const response = await fetchApi(context, url, init);

  if (!response.ok) {
    await throwApiClientResponseError(response);
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.startsWith('image/')) {
    throw createUnexpectedResponseError(response.status);
  }

  return response.blob();
}
