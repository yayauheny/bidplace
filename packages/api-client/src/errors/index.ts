import { ApiClientError } from './api-client-error';

export { ApiClientError, type ApiClientErrorKind } from './api-client-error';
export { classifyApiError } from './classify';
export {
  createNetworkError,
  createUnexpectedResponseError,
  parseApiError,
  throwApiClientResponseError,
} from './parse';
export { parseRequest, validationDetailsFromZod } from './parse-request';

export function getApiErrorCode(error: unknown) {
  return error instanceof ApiClientError ? error.code : null;
}
