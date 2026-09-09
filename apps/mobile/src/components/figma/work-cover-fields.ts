export const workCoverCommerceFields = ['price', 'timer', 'status'] as const;

export type WorkCoverCommerceField = (typeof workCoverCommerceFields)[number];

export type WorkCoverStatus = 'live' | 'announce' | 'ended';

export type WorkCoverInput = {
  title: string;
  authorSlug: string;
  price?: string | null;
  timer?: string | null;
  status?: WorkCoverStatus | null;
};

export type WorkCoverMode = 'portfolio' | 'commerce';

export function getWorkCoverOverlay(input: WorkCoverInput, mode: WorkCoverMode) {
  const commerce = mode === 'commerce';

  return {
    title: input.title,
    authorSlug: input.authorSlug,
    price: commerce ? input.price ?? null : null,
    timer: commerce ? input.timer ?? null : null,
    status: commerce ? input.status ?? null : null,
  };
}

export function workCoverStatusLabel(status: WorkCoverStatus) {
  switch (status) {
    case 'live':
      return 'Торги';
    case 'announce':
      return 'Анонс';
    case 'ended':
      return 'Завершено';
  }
}

export function workCoverAccessibilityLabel(
  overlay: ReturnType<typeof getWorkCoverOverlay>,
) {
  const parts = [overlay.title, `@${overlay.authorSlug}`];
  if (overlay.price) parts.push(overlay.price);
  if (overlay.timer) parts.push(overlay.timer);
  if (overlay.status) parts.push(workCoverStatusLabel(overlay.status));
  return parts.join(' — ');
}
