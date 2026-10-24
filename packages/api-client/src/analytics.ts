import {
  webAnalyticsRequestSchema,
  webAnalyticsResponseSchema,
  type WebAnalyticsRequest,
  analyticsIngestRequestSchema,
  analyticsIngestResponseSchema,
  type AnalyticsIngestRequest,
} from '@bidplace/contracts';

import { requestJson, type RequestContext } from './request';

export function createAnalyticsClient(context: RequestContext) {
  return {
    ingestWeb(input: WebAnalyticsRequest) {
      return requestJson(
        context,
        '/api/analytics/web-events',
        webAnalyticsResponseSchema,
        {
          method: 'POST',
          body: webAnalyticsRequestSchema.parse(input),
        },
      );
    },
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
