import type { AchievementRecord } from '../../components/figma/achievements-timeline';

export function authorDisciplineTags(discipline: string | null | undefined) {
  if (!discipline) return [];
  return discipline
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

export function toAchievementRecords(
  achievements: ReadonlyArray<{
    id: string;
    body: string;
    occurredAt: string | null;
    image: { url: string } | null;
  }>,
): AchievementRecord[] {
  return achievements.map((item) => ({
    id: item.id,
    body: item.body,
    occurredAt: item.occurredAt,
    imageUrl: item.image?.url ?? null,
  }));
}
