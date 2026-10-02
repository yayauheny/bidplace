import type { APIRequestContext } from '@playwright/test';

import { e2eApiBaseURL } from './e2e-env';

const revisionReviewStatuses = new Set([
  'APPROVED',
  'CHANGES_REQUESTED',
  'REJECTED',
]);

type AdminSeller = {
  id: string;
  parentStatus: string;
  parentUpdatedAt: string;
  reviewTarget: { id: string; status: string; updatedAt: string } | null;
};

export async function moderateSeller(
  request: APIRequestContext,
  profileId: string,
  status = 'APPROVED',
  reason?: string,
) {
  let cursor: string | null = null;
  let item: AdminSeller | undefined;
  for (let page = 0; page < 20 && !item; page += 1) {
    const url = new URL(`${e2eApiBaseURL}/api/admin/seller-profiles`);
    url.searchParams.set('filter', 'ALL');
    url.searchParams.set('limit', '100');
    if (cursor) url.searchParams.set('cursor', cursor);
    const listed = await request.get(url.toString());
    if (!listed.ok()) {
      throw new Error(await listed.text());
    }
    const body = (await listed.json()) as {
      sellerProfiles: AdminSeller[];
      nextCursor: string | null;
    };
    item = body.sellerProfiles.find((profile) => profile.id === profileId);
    cursor = body.nextCursor;
    if (!cursor) break;
  }
  if (!item) {
    throw new Error(`Seller ${profileId} is not in the admin queue`);
  }
  const review = item.reviewTarget;
  const target =
    review &&
    review.status === 'PENDING_REVIEW' &&
    revisionReviewStatuses.has(status)
      ? {
          kind: 'revision' as const,
          id: review.id,
          updatedAt: review.updatedAt,
        }
      : {
          kind: 'parent' as const,
          status: item.parentStatus,
          updatedAt: item.parentUpdatedAt,
        };
  return request.patch(
    `${e2eApiBaseURL}/api/admin/seller-profiles/${profileId}/status`,
    {
      data: {
        status,
        ...(reason === undefined ? {} : { reason }),
        target,
      },
    },
  );
}
