export type ApiClientOptions = {
  baseUrl: string;
};

export type ApiClient = {
  readonly baseUrl: string;
};

export function createApiClient(options: ApiClientOptions): ApiClient {
  return {
    baseUrl: options.baseUrl,
  };
}
