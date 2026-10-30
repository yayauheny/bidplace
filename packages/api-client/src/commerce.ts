import { z } from 'zod';

import {
  type AdminOrderOutcomeRequest,
  type AdminRemoveListingRequest,
  type CreateListingRequest,
  type CreateReportRequest,
  type FailOrderRequest,
  type NotificationSettings,
  type OrdersListQuery,
  type PaginationQueryInput,
  type PlaceBidRequest,
  type PurchaseRequest,
  type ResolveReportRequest,
  type UserContactsRequest,
  COMMERCE_CURRENCIES,
  COMMERCE_LIMITS,
  ORDER_SOURCES,
  adminAttentionResponseSchema,
  adminOrderOutcomeRequestSchema,
  adminOrderReasonRequestSchema,
  adminRemoveListingRequestSchema,
  adminReportsQuerySchema,
  adminReportsResponseSchema,
  adminUserStatusResponseSchema,
  attentionResponseSchema,
  bidHistoryResponseSchema,
  createListingRequestSchema,
  createReportRequestSchema,
  failOrderRequestSchema,
  isoDateTimeSchema,
  listingStatusSchema,
  listingTypeSchema,
  notificationSettingsSchema,
  orderDetailSchema,
  orderNoteRequestSchema,
  orderStatusSchema,
  ordersListQuerySchema,
  ordersListResponseSchema,
  paginationQuerySchema,
  placeBidRequestSchema,
  portfolioWorksResponseSchema,
  publicLotSchema,
  purchaseRequestSchema,
  reportSchema,
  resolveReportRequestSchema,
  userContactsRequestSchema,
  userContactsResponseSchema,
  uuidSchema,
} from '@bidplace/contracts';

import { parseRequest } from './errors/parse-request';
import {
  requestEmpty,
  requestJson,
  signalRequestOptions,
  type ReadCallOptions,
  type RequestContext,
} from './request';

const currencySchema = z.enum(COMMERCE_CURRENCIES);
const amountMinorSchema = z
  .number()
  .int()
  .positive()
  .max(COMMERCE_LIMITS.maxAmountMinor);
const publicIdSchema = z.string().regex(/^[A-Za-z0-9_-]{11}$/);
const contactWindowHoursSchema = z
  .number()
  .int()
  .refine((value): value is (typeof COMMERCE_LIMITS.contactWindowHours)[number] =>
    (COMMERCE_LIMITS.contactWindowHours as readonly number[]).includes(value),
  );

const createdListingSchema = z
  .object({
    id: uuidSchema,
    status: listingStatusSchema,
    type: listingTypeSchema,
    contactWindowHours: contactWindowHoursSchema,
    startsAt: isoDateTimeSchema,
    endsAt: isoDateTimeSchema.nullable(),
  })
  .strict();

const authorCancelledListingSchema = z
  .object({
    id: uuidSchema,
    status: z.literal('CANCELLED'),
    cancelReason: z.literal('AUTHOR_WITHDREW'),
  })
  .strict();

const adminRemovedListingSchema = z
  .object({
    id: uuidSchema,
    status: z.literal('CANCELLED'),
    cancelReason: z.literal('ADMIN_REMOVED'),
  })
  .strict();

const placeBidResponseSchema = z
  .object({
    bid: z
      .object({
        id: uuidSchema,
        amountMinor: z.number().int().positive(),
        createdAt: isoDateTimeSchema,
        participantLabel: z.string().regex(/^Участник \d+$/),
      })
      .strict(),
    lot: publicLotSchema,
  })
  .strict();

const purchaseResponseSchema = z
  .object({
    order: z
      .object({
        publicId: publicIdSchema,
        dealCode: z.string().regex(/^\d{6}$/),
        status: orderStatusSchema,
        source: z.enum(ORDER_SOURCES),
        amountMinor: amountMinorSchema,
        currency: currencySchema,
        activatedAt: isoDateTimeSchema,
        contactDeadlineAt: isoDateTimeSchema,
        buyerComment: z.string().max(500).nullable(),
      })
      .strict(),
    lot: publicLotSchema,
  })
  .strict();

const adminHealthSchema = z
  .object({
    lastTickAt: isoDateTimeSchema.nullable(),
    cronConfigured: z.boolean(),
    liveAuctions: z.number().int().nonnegative(),
    failedNotifications: z.number().int().nonnegative(),
    openReports: z.number().int().nonnegative(),
    oldestOpenReportAt: isoDateTimeSchema.nullable(),
  })
  .strict();

const tickResultSchema = z
  .object({
    skipped: z.boolean(),
    jobs: z.array(
      z
        .object({
          name: z.string(),
          processed: z.number().int().nonnegative(),
          failed: z.boolean(),
        })
        .strict(),
    ),
  })
  .strict();

const notificationRetryResponseSchema = z
  .object({
    retried: z.number().int().nonnegative(),
  })
  .strict();

type OrderNoteRequest = z.infer<typeof orderNoteRequestSchema>;
type AdminReasonRequest = z.infer<typeof adminOrderReasonRequestSchema>;
type AdminReportsQuery = z.input<typeof adminReportsQuerySchema>;

export function createCommerceClient(context: RequestContext) {
  return {
    createListing(productId: string, input: CreateListingRequest) {
      return requestJson(
        context,
        `/api/works/${productId}/listings`,
        createdListingSchema,
        {
          method: 'POST',
          body: parseRequest(createListingRequestSchema, input),
        },
      );
    },
    cancelListing(id: string) {
      return requestJson(
        context,
        `/api/listings/${id}/cancel`,
        authorCancelledListingSchema,
        { method: 'POST' },
      );
    },
    removeListing(id: string, input: AdminRemoveListingRequest) {
      return requestJson(
        context,
        `/api/admin/listings/${id}/remove`,
        adminRemovedListingSchema,
        {
          method: 'POST',
          body: parseRequest(adminRemoveListingRequestSchema, input),
        },
      );
    },
    getLot(publicId: string, options?: ReadCallOptions) {
      return requestJson(
        context,
        `/api/works/${publicId}/lot`,
        publicLotSchema.nullable(),
        signalRequestOptions(options),
      );
    },
    listBids(id: string, options?: ReadCallOptions) {
      return requestJson(
        context,
        `/api/listings/${id}/bids`,
        bidHistoryResponseSchema,
        signalRequestOptions(options),
      );
    },
    placeBid(id: string, input: PlaceBidRequest) {
      return requestJson(
        context,
        `/api/listings/${id}/bids`,
        placeBidResponseSchema,
        {
          method: 'POST',
          body: parseRequest(placeBidRequestSchema, input),
        },
      );
    },
    purchase(id: string, input: PurchaseRequest) {
      return requestJson(
        context,
        `/api/listings/${id}/purchase`,
        purchaseResponseSchema,
        {
          method: 'POST',
          body: parseRequest(purchaseRequestSchema, input),
        },
      );
    },
    listOrders(query: OrdersListQuery, options?: ReadCallOptions) {
      return requestJson(
        context,
        '/api/me/orders',
        ordersListResponseSchema,
        {
          query: parseRequest(ordersListQuerySchema, query),
          ...signalRequestOptions(options),
        },
      );
    },
    getOrder(publicId: string, options?: ReadCallOptions) {
      return requestJson(
        context,
        `/api/orders/${publicId}`,
        orderDetailSchema,
        signalRequestOptions(options),
      );
    },
    acceptOrder(publicId: string) {
      return requestJson(
        context,
        `/api/orders/${publicId}/accept`,
        orderDetailSchema,
        { method: 'POST' },
      );
    },
    declineOrder(publicId: string) {
      return requestJson(
        context,
        `/api/orders/${publicId}/decline`,
        orderDetailSchema,
        { method: 'POST' },
      );
    },
    completeOrder(publicId: string) {
      return requestJson(
        context,
        `/api/orders/${publicId}/complete`,
        orderDetailSchema,
        { method: 'POST' },
      );
    },
    failOrder(publicId: string, input: FailOrderRequest) {
      return requestJson(
        context,
        `/api/orders/${publicId}/fail`,
        orderDetailSchema,
        {
          method: 'POST',
          body: parseRequest(failOrderRequestSchema, input),
        },
      );
    },
    updateOrderNote(publicId: string, input: OrderNoteRequest) {
      return requestJson(
        context,
        `/api/orders/${publicId}/note`,
        orderDetailSchema,
        {
          method: 'PUT',
          body: parseRequest(orderNoteRequestSchema, input),
        },
      );
    },
    offerNextOrder(publicId: string) {
      return requestJson(
        context,
        `/api/orders/${publicId}/offer-next`,
        orderDetailSchema,
        { method: 'POST' },
      );
    },
    voidOrderStrike(publicId: string, input: AdminReasonRequest) {
      return requestJson(
        context,
        `/api/admin/orders/${publicId}/void-strike`,
        orderDetailSchema,
        {
          method: 'POST',
          body: parseRequest(adminOrderReasonRequestSchema, input),
        },
      );
    },
    setOrderOutcome(publicId: string, input: AdminOrderOutcomeRequest) {
      return requestJson(
        context,
        `/api/admin/orders/${publicId}/outcome`,
        orderDetailSchema,
        {
          method: 'POST',
          body: parseRequest(adminOrderOutcomeRequestSchema, input),
        },
      );
    },
    createOrderReport(publicId: string, input: CreateReportRequest) {
      return requestJson(
        context,
        `/api/orders/${publicId}/reports`,
        reportSchema,
        {
          method: 'POST',
          body: parseRequest(createReportRequestSchema, input),
        },
      );
    },
    listReports(query: AdminReportsQuery = {}, options?: ReadCallOptions) {
      return requestJson(
        context,
        '/api/admin/reports',
        adminReportsResponseSchema,
        {
          query: parseRequest(adminReportsQuerySchema, query),
          ...signalRequestOptions(options),
        },
      );
    },
    resolveReport(id: string, input: ResolveReportRequest) {
      return requestJson(
        context,
        `/api/admin/reports/${id}/resolve`,
        reportSchema,
        {
          method: 'POST',
          body: parseRequest(resolveReportRequestSchema, input),
        },
      );
    },
    getAttention(options?: ReadCallOptions) {
      return requestJson(
        context,
        '/api/me/attention',
        attentionResponseSchema,
        signalRequestOptions(options),
      );
    },
    getAdminAttention(options?: ReadCallOptions) {
      return requestJson(
        context,
        '/api/admin/attention',
        adminAttentionResponseSchema,
        signalRequestOptions(options),
      );
    },
    getNotificationSettings(options?: ReadCallOptions) {
      return requestJson(
        context,
        '/api/me/notification-settings',
        notificationSettingsSchema,
        signalRequestOptions(options),
      );
    },
    updateNotificationSettings(input: NotificationSettings) {
      return requestJson(
        context,
        '/api/me/notification-settings',
        notificationSettingsSchema,
        {
          method: 'PUT',
          body: parseRequest(notificationSettingsSchema, input),
        },
      );
    },
    updateContacts(input: UserContactsRequest) {
      return requestJson(
        context,
        '/api/me/contacts',
        userContactsResponseSchema,
        {
          method: 'PUT',
          body: parseRequest(userContactsRequestSchema, input),
        },
      );
    },
    listFavorites(query: PaginationQueryInput = {}, options?: ReadCallOptions) {
      return requestJson(
        context,
        '/api/me/favorites',
        portfolioWorksResponseSchema,
        {
          query: parseRequest(paginationQuerySchema, query),
          ...signalRequestOptions(options),
        },
      );
    },
    addFavorite(productId: string) {
      return requestEmpty(context, `/api/works/${productId}/favorite`, {
        method: 'PUT',
      });
    },
    removeFavorite(productId: string) {
      return requestEmpty(context, `/api/works/${productId}/favorite`, {
        method: 'DELETE',
      });
    },
    banUser(id: string, input: AdminReasonRequest) {
      return requestJson(
        context,
        `/api/admin/users/${id}/ban`,
        adminUserStatusResponseSchema,
        {
          method: 'POST',
          body: parseRequest(adminOrderReasonRequestSchema, input),
        },
      );
    },
    getAdminHealth(options?: ReadCallOptions) {
      return requestJson(
        context,
        '/api/admin/health',
        adminHealthSchema,
        signalRequestOptions(options),
      );
    },
    retryFailedNotifications() {
      return requestJson(
        context,
        '/api/admin/notifications/retry-failed',
        notificationRetryResponseSchema,
        { method: 'POST' },
      );
    },
    runTick() {
      return requestJson(context, '/api/internal/tick', tickResultSchema, {
        method: 'POST',
      });
    },
  };
}
