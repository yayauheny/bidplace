import {
  analyticsIngestRequestSchema,
  analyticsIngestResponseSchema,
  type AnalyticsIngestRequest,
} from '@bidplace/contracts';

import { requestJson, type RequestContext } from './request';

export function createAnalyticsClient(context: RequestContext) {
  return {
    ingest(input: AnalyticsIngestRequest) {
      return requestJson(
        context,
        '/api/analytics/events',
        analyticsIngestResponseSchema,
        {
          method: 'POST',
          body: analyticsIngestRequestSchema.parse(input),
        },
      );
    },
  };
}
