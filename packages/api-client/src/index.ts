import {
  adminAuctionResponseSchema,
  adminAuctionsResponseSchema,
  adminUserResponseSchema,
  adminUsersResponseSchema,
  authResponseSchema,
  auctionCreateRequestSchema,
  auctionListResponseSchema,
  auctionResponseSchema,
  auctionPublishRequestSchema,
  bidCreateRequestSchema,
  bidHistoryResponseSchema,
  bidPlacementResponseSchema,
  categoryListResponseSchema,
  loginRequestSchema,
  lotCreateRequestSchema,
  lotResponseSchema,
  meResponseSchema,
  paginationQuerySchema,
  publicAuctionDetailResponseSchema,
  registerRequestSchema,
  sellerProfileCreateRequestSchema,
  sellerProfileResponseSchema,
  sellerProfileUpdateRequestSchema,
  sellerAuctionListResponseSchema,
  sellerLotListResponseSchema,
  type AdminAuctionResponse,
  type AdminAuctionsResponse,
  type AdminUserResponse,
  type AdminUsersResponse,
  type AuthResponse,
  type AuctionCreateRequest,
  type AuctionResponse,
  type AuctionListResponse,
  type BidCreateRequest,
  type BidHistoryResponse,
  type BidPlacementResponse,
  type LoginRequest,
  type LotCreateRequest,
  type LotResponse,
  type MeResponse,
  type PaginationQuery,
  type PublicAuctionDetailResponse,
  type RegisterRequest,
  type CategoryListResponse,
  type SellerProfileCreateRequest,
  type SellerProfileResponse,
  type SellerProfileUpdateRequest,
  type SellerAuctionListResponse,
  type SellerLotListResponse,
} from '@bidplace/contracts';
import { z, type ZodType } from 'zod';

type FetchLike = typeof fetch;

export class ApiClientError extends Error {
  readonly status: number;

  readonly code: string | null;

  readonly details: unknown;

  constructor(message: string, options: { status: number; code?: string | null; details?: unknown }) {
    super(message);
    this.name = 'ApiClientError';
    this.status = options.status;
    this.code = options.code ?? null;
    this.details = options.details;
  }
}

export type ApiClientOptions = {
  baseUrl: string;
  getAccessToken?: () => string | null | undefined;
  fetchImpl?: FetchLike;
  credentials?: RequestCredentials;
};

type RequestOptions = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  headers?: HeadersInit;
  asFormData?: boolean;
};

type ErrorPayload = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
  code?: string;
  details?: unknown;
};

export type ApiClient = {
  readonly baseUrl: string;
  readonly request: <T>(
    path: string,
    schema: ZodType<T>,
    options?: RequestOptions,
  ) => Promise<T>;
  readonly auth: {
    register: (input: RegisterRequest) => Promise<AuthResponse>;
    login: (input: LoginRequest) => Promise<AuthResponse>;
    me: () => Promise<MeResponse>;
    logout: () => Promise<{ ok: true }>;
  };
  readonly auctions: {
    list: (query?: PaginationQuery) => Promise<AuctionListResponse>;
    getPublic: (
      slug: string,
      query?: PaginationQuery,
    ) => Promise<PublicAuctionDetailResponse>;
    placeBid: (
      auctionId: string,
      input: BidCreateRequest,
    ) => Promise<BidPlacementResponse>;
    create: (input: AuctionCreateRequest) => Promise<AuctionResponse>;
    publish: (auctionId: string) => Promise<AuctionResponse>;
  };
  readonly lots: {
    create: (
      input: LotCreateRequest,
      images: Array<Blob | File>,
    ) => Promise<LotResponse>;
  };
  readonly sellers: {
    getMyProfile: () => Promise<SellerProfileResponse>;
    getPublic: (slug: string) => Promise<SellerProfileResponse>;
    createProfile: (
      input: SellerProfileCreateRequest,
    ) => Promise<SellerProfileResponse>;
    updateProfile: (
      input: SellerProfileUpdateRequest,
    ) => Promise<SellerProfileResponse>;
    listLots: (query?: PaginationQuery) => Promise<SellerLotListResponse>;
    listAuctions: (
      query?: PaginationQuery,
    ) => Promise<SellerAuctionListResponse>;
    listAuctionBids: (
      auctionId: string,
      query?: PaginationQuery,
    ) => Promise<BidHistoryResponse>;
  };
  readonly admin: {
    listUsers: (query?: PaginationQuery) => Promise<AdminUsersResponse>;
    banUser: (userId: string) => Promise<AdminUserResponse>;
    listAuctions: (query?: PaginationQuery) => Promise<AdminAuctionsResponse>;
    hideAuction: (auctionId: string) => Promise<AdminAuctionResponse>;
    listAuctionBids: (
      auctionId: string,
      query?: PaginationQuery,
    ) => Promise<BidHistoryResponse>;
  };
  readonly categories: {
    list: () => Promise<CategoryListResponse>;
  };
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

function joinMessage(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(joinMessage).filter(Boolean).join(', ');
  }

  if (typeof value === 'string') {
    return value;
  }

  return '';
}

async function readErrorPayload(response: Response): Promise<ErrorPayload | null> {
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    return null;
  }

  try {
    return (await response.json()) as ErrorPayload;
  } catch {
    return null;
  }
}

async function requestJson<T>(
  fetchImpl: FetchLike,
  baseUrl: string,
  getAccessToken: (() => string | null | undefined) | undefined,
  credentials: RequestCredentials | undefined,
  path: string,
  schema: ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  const url = new URL(`${baseUrl}${path}`);
  const queryString = normalizeQuery(options.query);

  if (queryString) {
    url.search = queryString.slice(1);
  }

  const headers = new Headers(options.headers);

  if (getAccessToken) {
    const accessToken = getAccessToken();

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

  if (credentials) {
    init.credentials = credentials;
  }

  if (body !== undefined) {
    init.body = body;
  }

  const response = await fetchImpl(url, init);

  if (!response.ok) {
    const payload = await readErrorPayload(response);
    const message = joinMessage(payload?.message) || payload?.error || response.statusText || 'Request failed';

    throw new ApiClientError(message, {
      status: response.status,
      code: payload?.code ?? null,
      details: payload?.details ?? payload ?? null,
    });
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    return undefined as T;
  }

  const payload = (await response.json()) as unknown;
  return schema.parse(payload);
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const fetchImpl = options.fetchImpl ?? fetch;
  const getAccessToken = options.getAccessToken;
  const credentials = options.credentials;
  const logoutResponseSchema = z.object({
    ok: z.literal(true),
  });

  return {
    baseUrl,
    request(path, schema, options) {
      return requestJson(
        fetchImpl,
        baseUrl,
        getAccessToken,
        credentials,
        path,
        schema,
        options,
      );
    },
    auth: {
      register(input: RegisterRequest) {
        return requestJson(
          fetchImpl,
          baseUrl,
          getAccessToken,
          credentials,
          '/api/auth/register',
          authResponseSchema,
          {
            method: 'POST',
            body: registerRequestSchema.parse(input),
          },
        );
      },
      login(input: LoginRequest) {
        return requestJson(
          fetchImpl,
          baseUrl,
          getAccessToken,
          credentials,
          '/api/auth/login',
          authResponseSchema,
          {
            method: 'POST',
            body: loginRequestSchema.parse(input),
          },
        );
      },
      me() {
        return requestJson(
          fetchImpl,
          baseUrl,
          getAccessToken,
          credentials,
          '/api/auth/me',
          meResponseSchema,
        );
      },
      logout() {
        return requestJson(
          fetchImpl,
          baseUrl,
          getAccessToken,
          credentials,
          '/api/auth/logout',
          logoutResponseSchema,
          {
            method: 'POST',
          },
        );
      },
    },
    auctions: {
      list(query?: PaginationQuery) {
        return requestJson(
          fetchImpl,
          baseUrl,
          getAccessToken,
          credentials,
          '/api/auctions',
          auctionListResponseSchema,
          {
            query: paginationQuerySchema.parse(query ?? {}),
          },
        );
      },
      getPublic(slug: string, query?: PaginationQuery) {
        return requestJson(
          fetchImpl,
          baseUrl,
          getAccessToken,
          credentials,
          `/api/auctions/${slug}`,
          publicAuctionDetailResponseSchema,
          {
            query: paginationQuerySchema.parse(query ?? {}),
          },
        );
      },
      placeBid(auctionId: string, input: BidCreateRequest) {
        return requestJson(
          fetchImpl,
          baseUrl,
          getAccessToken,
          credentials,
          `/api/auctions/${auctionId}/bids`,
          bidPlacementResponseSchema,
          {
            method: 'POST',
            body: bidCreateRequestSchema.parse(input),
          },
        );
      },
      create(input: AuctionCreateRequest) {
        return requestJson(
          fetchImpl,
          baseUrl,
          getAccessToken,
          credentials,
          '/api/seller/auctions',
          auctionResponseSchema,
          {
            method: 'POST',
            body: auctionCreateRequestSchema.parse(input),
          },
        );
      },
      publish(auctionId: string) {
        return requestJson(
          fetchImpl,
          baseUrl,
          getAccessToken,
          credentials,
          `/api/seller/auctions/${auctionId}/publish`,
          auctionResponseSchema,
          {
            method: 'POST',
            body: auctionPublishRequestSchema.parse({}),
          },
        );
      },
    },
    lots: {
      create(input: LotCreateRequest, images: Array<Blob | File>) {
        const parsed = lotCreateRequestSchema.parse(input);

        return requestJson(
          fetchImpl,
          baseUrl,
          getAccessToken,
          credentials,
          '/api/lots',
          lotResponseSchema,
          {
            method: 'POST',
            body: { ...parsed, images },
            asFormData: true,
          },
        );
      },
    },
    categories: {
      list() {
        return requestJson(
          fetchImpl,
          baseUrl,
          getAccessToken,
          credentials,
          '/api/categories',
          categoryListResponseSchema,
        );
      },
    },
    sellers: {
      getMyProfile() {
        return requestJson(
          fetchImpl,
          baseUrl,
          getAccessToken,
          credentials,
          '/api/seller/profile',
          sellerProfileResponseSchema,
        );
      },
      getPublic(slug: string) {
        return requestJson(
          fetchImpl,
          baseUrl,
          getAccessToken,
          credentials,
          `/api/sellers/${slug}`,
          sellerProfileResponseSchema,
        );
      },
      createProfile(input: SellerProfileCreateRequest) {
        return requestJson(
          fetchImpl,
          baseUrl,
          getAccessToken,
          credentials,
          '/api/seller/profile',
          sellerProfileResponseSchema,
          {
            method: 'POST',
            body: sellerProfileCreateRequestSchema.parse(input),
          },
        );
      },
      updateProfile(input: SellerProfileUpdateRequest) {
        return requestJson(
          fetchImpl,
          baseUrl,
          getAccessToken,
          credentials,
          '/api/seller/profile',
          sellerProfileResponseSchema,
          {
            method: 'PATCH',
            body: sellerProfileUpdateRequestSchema.parse(input),
          },
        );
      },
      listLots(query?: PaginationQuery) {
        return requestJson(
          fetchImpl,
          baseUrl,
          getAccessToken,
          credentials,
          '/api/seller/lots',
          sellerLotListResponseSchema,
          {
            query: paginationQuerySchema.parse(query ?? {}),
          },
        );
      },
      listAuctions(query?: PaginationQuery) {
        return requestJson(
          fetchImpl,
          baseUrl,
          getAccessToken,
          credentials,
          '/api/seller/auctions',
          sellerAuctionListResponseSchema,
          {
            query: paginationQuerySchema.parse(query ?? {}),
          },
        );
      },
      listAuctionBids(auctionId: string, query?: PaginationQuery) {
        return requestJson(
          fetchImpl,
          baseUrl,
          getAccessToken,
          credentials,
          `/api/seller/auctions/${auctionId}/bids`,
          bidHistoryResponseSchema,
          {
            query: paginationQuerySchema.parse(query ?? {}),
          },
        );
      },
    },
    admin: {
      listUsers(query?: PaginationQuery) {
        return requestJson(
          fetchImpl,
          baseUrl,
          getAccessToken,
          credentials,
          '/api/admin/users',
          adminUsersResponseSchema,
          {
            query: paginationQuerySchema.parse(query ?? {}),
          },
        );
      },
      banUser(userId: string) {
        return requestJson(
          fetchImpl,
          baseUrl,
          getAccessToken,
          credentials,
          `/api/admin/users/${userId}/ban`,
          adminUserResponseSchema,
          {
            method: 'PATCH',
          },
        );
      },
      listAuctions(query?: PaginationQuery) {
        return requestJson(
          fetchImpl,
          baseUrl,
          getAccessToken,
          credentials,
          '/api/admin/auctions',
          adminAuctionsResponseSchema,
          {
            query: paginationQuerySchema.parse(query ?? {}),
          },
        );
      },
      hideAuction(auctionId: string) {
        return requestJson(
          fetchImpl,
          baseUrl,
          getAccessToken,
          credentials,
          `/api/admin/auctions/${auctionId}/hide`,
          adminAuctionResponseSchema,
          {
            method: 'PATCH',
          },
        );
      },
      listAuctionBids(auctionId: string, query?: PaginationQuery) {
        return requestJson(
          fetchImpl,
          baseUrl,
          getAccessToken,
          credentials,
          `/api/admin/auctions/${auctionId}/bids`,
          bidHistoryResponseSchema,
          {
            query: paginationQuerySchema.parse(query ?? {}),
          },
        );
      },
    },
  };
}
