import {
  countryListResponseSchema,
  type CountryOption,
} from '@bidplace/contracts';

import {
  requestJson,
  signalRequestOptions,
  type ReadCallOptions,
  type RequestContext,
} from './request';

export type { CountryOption };

export function createCountriesClient(context: RequestContext) {
  return {
    list(query?: string, options?: ReadCallOptions) {
      const search = query?.trim();
      return requestJson(context, '/api/countries', countryListResponseSchema, {
        ...(search ? { query: { q: search } } : {}),
        ...signalRequestOptions(options),
      });
    },
  };
}
