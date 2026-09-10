export type AchievementRecord = {
  id: string;
  body: string;
  occurredAt: string | null;
  imageUrl: string | null;
};

const achievementMonthFormatter = new Intl.DateTimeFormat('ru-RU', {
  month: '2-digit',
  year: 'numeric',
});

export const ACHIEVEMENTS_TITLE = 'Выставки и достижения';
export const ACHIEVEMENT_CARD_WIDTH = 266;
export const ACHIEVEMENT_IMAGE_HEIGHT = 355;
export const ACHIEVEMENT_CAROUSEL_GAP = 20;

export function visibleAchievementRecords(
  records: readonly AchievementRecord[],
) {
  return records.filter((record) => record.body.trim().length > 0);
}

export function achievementDateLabel(occurredAt: string | null) {
  if (!occurredAt) return null;
  const date = new Date(occurredAt);
  if (Number.isNaN(date.getTime())) return null;
  return achievementMonthFormatter.format(date);
}
