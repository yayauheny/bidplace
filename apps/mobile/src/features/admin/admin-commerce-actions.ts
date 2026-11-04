import { ApiClientError, type ApiClient } from '@bidplace/api-client';
import {
  FAULT_SIDES,
  ORDER_FAIL_REASONS,
  adminOrderOutcomeRequestSchema,
  adminOrderReasonRequestSchema,
  adminReleaseHoldRequestSchema,
  adminRemoveListingRequestSchema,
  resolveReportRequestSchema,
  type AdminOrderOutcomeRequest,
  type ResolveReportRequest,
} from '@bidplace/contracts';

export const FAULT_CHOICES = FAULT_SIDES;
export const FAIL_CHOICES = ORDER_FAIL_REASONS;

export function requiredReason(value: string): string | null {
  const parsed = adminOrderReasonRequestSchema.safeParse({ reason: value });
  return parsed.success ? parsed.data.reason : null;
}

export function releaseHoldBody(note: string): { note: string } | null {
  const parsed = adminReleaseHoldRequestSchema.safeParse({ note });
  return parsed.success ? parsed.data : null;
}

export function removeListingBody(reason: string): { reason: string } | null {
  const parsed = adminRemoveListingRequestSchema.safeParse({ reason });
  return parsed.success ? parsed.data : null;
}

export function resolveReportBody(input: {
  status: 'UPHELD' | 'REJECTED';
  faultSide: '' | (typeof FAULT_SIDES)[number];
  adminNote: string;
}): ResolveReportRequest | null {
  const body =
    input.status === 'REJECTED'
      ? { status: 'REJECTED' as const, adminNote: input.adminNote }
      : {
          status: 'UPHELD' as const,
          faultSide: input.faultSide === '' ? undefined : input.faultSide,
          adminNote: input.adminNote,
        };
  const parsed = resolveReportRequestSchema.safeParse(body);
  return parsed.success ? parsed.data : null;
}

export function orderOutcomeBody(input: {
  to: 'COMPLETED' | 'FAILED';
  failReason: string;
  reason: string;
}): AdminOrderOutcomeRequest | null {
  const body =
    input.to === 'COMPLETED'
      ? { to: 'COMPLETED' as const, reason: input.reason }
      : {
          to: 'FAILED' as const,
          failReason: input.failReason,
          reason: input.reason,
        };
  const parsed = adminOrderOutcomeRequestSchema.safeParse(body);
  return parsed.success ? parsed.data : null;
}

export function reportQueueItem(report: {
  id: string;
  orderPublicId: string;
  reason: string;
  status: string;
  buyerUserId: string;
  sellerUserId: string;
  text: string | null;
}) {
  return {
    id: report.id,
    orderPublicId: report.orderPublicId,
    reason: report.reason,
    status: report.status,
    buyerUserId: report.buyerUserId,
    sellerUserId: report.sellerUserId,
    text: report.text,
  };
}

export function commerceActionMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 401) return 'Войдите снова.';
    if (error.status === 403) return 'Недостаточно прав.';
    if (error.status === 409) return 'Запись уже изменилась. Список обновлён.';
  }
  return 'Не удалось выполнить действие.';
}


export async function banUserByEmail(
  api: { admin: Pick<ApiClient['admin'], 'lookupUsers'>; commerce: Pick<ApiClient['commerce'], 'banUser'> },
  email: string,
  reason: string,
  isCurrent: () => boolean,
): Promise<boolean | null> {
  if (!isCurrent()) return null;
  const found = await api.admin.lookupUsers({ email });
  if (!isCurrent()) return null;
  const user = found.users.length === 1 ? found.users[0] : null;
  if (!user) return false;
  await api.commerce.banUser(user.id, { reason });
  return true;
}
