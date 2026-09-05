export const ORDER_CONTACT_WINDOW_HOURS = 48;
export const ORDER_CONTACT_WINDOW_MS =
  ORDER_CONTACT_WINDOW_HOURS * 60 * 60 * 1000;

export function computeOrderContactDueAt(now: Date): Date {
  return new Date(now.getTime() + ORDER_CONTACT_WINDOW_MS);
}

export function orderContactSchedule(now: Date): {
  createdAt: Date;
  contactDueAt: Date;
} {
  return { createdAt: now, contactDueAt: computeOrderContactDueAt(now) };
}
