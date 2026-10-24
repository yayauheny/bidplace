import {
  achievementOccurredDateSchema,
  type StoryBlock,
  type AdminProduct,
  type AdminSellerProfile,
} from '@bidplace/contracts';
import { formatAchievementDate } from '../sellers/achievement-date';

export type ModerationFilter =
  | 'ALL'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'CHANGES_REQUESTED';

export function moderationListQueryKey(
  resource: 'seller-profiles' | 'products',
  filter: ModerationFilter,
  search: string,
) {
  return ['admin', resource, filter, search.trim()] as const;
}

export function displayedSeller(seller: AdminSellerProfile) {
  return seller.reviewTarget?.content ?? seller.parent;
}

export function displayedProduct(product: AdminProduct) {
  return product.reviewTarget?.content ?? product.parent;
}

export function revisionTarget(input: { id: string; updatedAt: string }) {
  return {
    kind: 'revision' as const,
    id: input.id,
    updatedAt: input.updatedAt,
  };
}

export function parentTarget<Status extends string>(input: {
  status: Status;
  updatedAt: string;
}) {
  return {
    kind: 'parent' as const,
    status: input.status,
    updatedAt: input.updatedAt,
  };
}

export function pendingRevision(status: string | undefined) {
  return status === 'PENDING_REVIEW';
}

const reviewLabels: Record<string, string> = {
  title: 'Название',
  story: 'Описание',
  technique: 'Техника',
  materials: 'Материалы',
  dimensions: 'Размеры',
  weight: 'Вес',
  year: 'Год',
  condition: 'Состояние',
  uniqueness: 'Тираж и уникальность',
  provenance: 'Происхождение',
  city: 'Город',
  creationIntro: 'О создании',
  fullName: 'Имя',
  slug: 'Публичный адрес',
  discipline: 'Деятельность',
  country: 'Страна',
  practice: 'Практика и подход',
  biography: 'Биография',
  shortDescription: 'Краткое описание',
  socialLink: 'Ссылка',
  telegramUrl: 'Telegram',
  instagramUrl: 'Instagram',
  websiteUrl: 'Сайт',
  publicEmail: 'Публичный email',
  directions: 'Направления',
  achievements: 'Достижения',
};
function reviewValue(value: unknown): string {
  if (value == null || value === '') return 'Не указано';
  if (Array.isArray(value))
    return value.length
      ? value
          .map((item: unknown) => {
            if (typeof item === 'object' && item !== null) {
              if ('name' in item) return String(item.name);
              if ('body' in item) {
                const date = achievementOccurredDateSchema
                  .nullable()
                  .safeParse('occurredDate' in item ? item.occurredDate : null);
                const image =
                  'image' in item &&
                  item.image &&
                  typeof item.image === 'object' &&
                  'checksum' in item.image
                    ? String(item.image.checksum)
                    : '';
                return `${date.success ? formatAchievementDate(date.data) : 'Дата неизвестна'} · ${item.body}${image ? ` · Фото: ${image}` : ''}`;
              }
            }
            return String(item);
          })
          .join('\n')
      : 'Не указано';
  return String(value);
}
export function moderationComparison(before: object | null, after: object) {
  const oldValues = new Map(Object.entries(before ?? {}));
  const newValues = new Map(Object.entries(after));
  return Object.entries(reviewLabels)
    .filter(([key]) => oldValues.has(key) || newValues.has(key))
    .map(([key, label]) => {
      const oldValue = reviewValue(oldValues.get(key));
      const newValue = reviewValue(newValues.get(key));
      return {
        key,
        label,
        before: oldValue,
        after: newValue,
        changed: before === null || oldValue !== newValue,
      };
    });
}

export function moderationPhotoChanges<T extends { id: string }>(
  before: readonly T[],
  after: readonly T[],
) {
  const oldIds = before.map((image) => image.id);
  const newIds = after.map((image) => image.id);
  return {
    added: after.filter((image) => !oldIds.includes(image.id)),
    removed: before.filter((image) => !newIds.includes(image.id)),
    reordered:
      oldIds.filter((id) => newIds.includes(id)).join(',') !==
      newIds.filter((id) => oldIds.includes(id)).join(','),
  };
}

export function moderationStoryChanged(
  before: readonly StoryBlock[],
  after: readonly StoryBlock[],
) {
  const values = (blocks: readonly StoryBlock[]) =>
    blocks.map((block) =>
      block.type === 'IMAGE'
        ? {
            type: block.type,
            mediaAssetId: block.mediaAssetId,
            altText: block.altText ?? null,
          }
        : { type: block.type, text: block.text },
    );
  return JSON.stringify(values(before)) !== JSON.stringify(values(after));
}
