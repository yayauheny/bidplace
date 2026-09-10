import type { CuratorSelection } from '../../components/figma/curator-feature';

export function shouldRenderCuratorFeature(
  selection: CuratorSelection | null | undefined,
): selection is CuratorSelection {
  return selection != null;
}

export function isHomeEmpty({
  curatorSelection,
  newWorksCount,
  newAuthorsCount,
}: {
  curatorSelection: CuratorSelection | null | undefined;
  newWorksCount: number;
  newAuthorsCount: number;
}) {
  return (
    !shouldRenderCuratorFeature(curatorSelection) &&
    newWorksCount === 0 &&
    newAuthorsCount === 0
  );
}

export function authorDisciplineTags(discipline: string | null | undefined) {
  if (!discipline) return [];
  return discipline
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}
