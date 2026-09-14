import { describe, expect, it } from 'vitest';

import {
  homeSectionPlan,
  visibleCuratorSelection,
  type HomeAuthor,
  type HomeCuratorSelection,
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

function selection(
  publicId: string,
  slug: string,
  note: string | null = null,
): HomeCuratorSelection {
  return {
    ...workItem(publicId, slug),
    note,
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
    const selected = selection('seedWork001', 'anna-morozova', null);

    expect(visibleCuratorSelection(selected)).toEqual(selected);
  });

  it('keeps a curator note on the selection pointer', () => {
    const selected = selection(
      'seedWork001',
      'anna-morozova',
      'Главная визуальная находка этой недели.',
    );

    expect(visibleCuratorSelection(selected)?.note).toBe(
      'Главная визуальная находка этой недели.',
    );
  });

  it('omits null, undefined, and incomplete pointers', () => {
    expect(visibleCuratorSelection(null)).toBeNull();
    expect(visibleCuratorSelection(undefined)).toBeNull();
    expect(visibleCuratorSelection(selection('', 'anna-morozova'))).toBeNull();
    expect(visibleCuratorSelection(selection('seedWork001', ''))).toBeNull();
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
    const selected = selection('seedWork001', 'anna-morozova');
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
