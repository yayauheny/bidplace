export type WorkCoverInput = {
  title: string;
  authorSlug: string;
};

export function getWorkCoverOverlay(input: WorkCoverInput) {
  return {
    title: input.title,
    authorSlug: input.authorSlug,
  };
}

export function workCoverAccessibilityLabel(
  overlay: ReturnType<typeof getWorkCoverOverlay>,
) {
  return `${overlay.title} — @${overlay.authorSlug}`;
}
