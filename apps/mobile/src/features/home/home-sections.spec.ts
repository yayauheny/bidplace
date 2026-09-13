import { describe, expect, it } from 'vitest';

import {
  homeSectionPlan,
  visibleCuratorSelection,
  type HomeAuthor,
  type HomeWorkItem,
} from './home-sections';

function workItem(
  publicId: string,
  slug: string,
  title = 'Работа',
): HomeWorkItem {
  return {
    work: {
      publicId,
      title,
      images: [{ url: `/api/images/${publicId}` }],
    },
    author: {
      slug,
      fullName: 'Автор',
      shortDescription: 'Практика автора',
      profilePhotoUrl: `/api/sellers/${slug}/photo`,
    },
  };
}

function author(slug: string): HomeAuthor {
  return {
    slug,
    fullName: 'Автор',
    profilePhotoUrl: `/api/sellers/${slug}/photo`,
    discipline: 'Живопись',
  };
}

describe('visibleCuratorSelection', () => {
  it('returns the server-owned work and does not invent a pick', () => {
    const selected = workItem('seedWork001', 'anna-morozova', 'Портрет');

    expect(visibleCuratorSelection(selected)).toEqual(selected);
  });

  it('omits null, undefined, and incomplete pointers', () => {
    expect(visibleCuratorSelection(null)).toBeNull();
    expect(visibleCuratorSelection(undefined)).toBeNull();
    expect(
      visibleCuratorSelection(
        workItem('', 'anna-morozova'),
      ),
    ).toBeNull();
    expect(visibleCuratorSelection(workItem('seedWork001', ''))).toBeNull();
  });
});

describe('homeSectionPlan', () => {
  it('does not fall back to newest work when selection is null', () => {
    const newest = workItem('newestWork01', 'mark-volkov');
    const plan = homeSectionPlan({
      curatorSelection: null,
      newWorks: [newest],
      newAuthors: [],
    });

    expect(plan.opening).toBeNull();
    expect(plan.showWorks).toBe(true);
    expect(plan.works).toEqual([newest]);
    expect(plan.showAuthorsLink).toBe(true);
    expect(plan.showEmpty).toBe(false);
  });

  it('keeps opening when lists are empty and does not invent catalog cards', () => {
    const selected = workItem('seedWork001', 'anna-morozova');
    const plan = homeSectionPlan({
      curatorSelection: selected,
      newWorks: [],
      newAuthors: [],
    });

    expect(plan.opening).toEqual(selected);
    expect(plan.showWorks).toBe(false);
    expect(plan.showAuthors).toBe(false);
    expect(plan.showAuthorsLink).toBe(true);
    expect(plan.showEmpty).toBe(false);
  });

  it('shows authors without a works block when only authors exist', () => {
    const plan = homeSectionPlan({
      curatorSelection: null,
      newWorks: [],
      newAuthors: [author('anna-morozova')],
    });

    expect(plan.opening).toBeNull();
    expect(plan.showWorks).toBe(false);
    expect(plan.showAuthors).toBe(true);
    expect(plan.showAuthorsLink).toBe(false);
    expect(plan.showEmpty).toBe(false);
  });

  it('shows the quiet empty state only when every home list is absent', () => {
    const plan = homeSectionPlan({
      curatorSelection: null,
      newWorks: [],
      newAuthors: [],
    });

    expect(plan.showEmpty).toBe(true);
    expect(plan.showAuthorsLink).toBe(false);
  });
});
