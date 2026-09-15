import { type HomeAuthor } from './home-sections';

export const homeAuthorFanLayout = {
  sectionWidth: 366,
  fanHeight: 430,
  rear: { width: 308, height: 410 },
  front: { width: 322, height: 430 },
  rearRight: { x: 55.6, y: 17.34, rotate: '1deg' },
  rearLeft: { x: 2.45, y: 22.72, rotate: '-1deg' },
  frontPos: { x: 22, y: 0 },
  // Frame 47 HTML rotates rear cards around the top-left of the 308×410 box.
  // RN/web defaults to center (154×205), which pulls the visible peeks inward.
  rearTransformOrigin: '0px 0px',
  rearOpacity: 0.5,
  cardRadius: 24,
  frontShadow: '0 6px 20px rgba(58, 58, 58, 0.40)',
} as const;

export type HomeAuthorFanSlot = 'front' | 'rearLeft' | 'rearRight';

export type HomeAuthorFanItem = {
  slot: HomeAuthorFanSlot;
  author: HomeAuthor;
};

export function authorsWithFanPhotos(authors: HomeAuthor[]): HomeAuthor[] {
  const seen = new Set<string>();
  const unique: HomeAuthor[] = [];
  for (const author of authors) {
    if (!author.profilePhotoUrl || seen.has(author.slug)) continue;
    seen.add(author.slug);
    unique.push(author);
  }
  return unique;
}

export function homeAuthorFanSlots(authors: HomeAuthor[]): HomeAuthorFanItem[] {
  const photos = authorsWithFanPhotos(authors);
  if (photos.length === 0) return [];
  if (photos.length === 1) {
    return [{ slot: 'front', author: photos[0] }];
  }
  if (photos.length === 2) {
    return [
      { slot: 'rearRight', author: photos[1] },
      { slot: 'front', author: photos[0] },
    ];
  }
  return [
    { slot: 'rearRight', author: photos[2] },
    { slot: 'rearLeft', author: photos[1] },
    { slot: 'front', author: photos[0] },
  ];
}
