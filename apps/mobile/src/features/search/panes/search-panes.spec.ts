/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

type WorkItem = { work: { id: string; title: string } };
type AuthorItem = {
  author: {
    slug: string;
    profilePhotoUrl: string | null;
    shortDescription: string | null;
  };
};

const worksState = vi.hoisted(() => ({
  items: [] as WorkItem[],
  hasNextPage: false,
  isFetchingNextPage: false,
  isPending: false,
  isError: false,
  fetchNextPage: vi.fn(async () => undefined),
  refetch: vi.fn(async () => undefined),
  lastState: null as { q?: string; sort: string } | null,
}));

const authorsState = vi.hoisted(() => ({
  items: [] as AuthorItem[],
  hasNextPage: false,
  isFetchingNextPage: false,
  isPending: false,
  isError: false,
  fetchNextPage: vi.fn(async () => undefined),
  refetch: vi.fn(async () => undefined),
  lastState: null as { q?: string; sort: string } | null,
}));

vi.mock('react-native', () => ({
  View: ({
    children,
    accessibilityRole,
  }: {
    children?: ReactNode;
    accessibilityRole?: string;
  }) => createElement('div', { role: accessibilityRole }, children),
}));

vi.mock('../../../components/figma/FigmaButton', () => ({
  FigmaButton: ({
    label,
    loading = false,
    onPress,
  }: {
    label: string;
    loading?: boolean;
    onPress: () => void;
  }) =>
    createElement(
      'button',
      {
        type: 'button',
        disabled: loading,
        onClick: onPress,
      },
      label,
    ),
}));

vi.mock('../../../components/figma/WorkCoverCardGrid', () => ({
  WorkCoverCardGrid: ({ items }: { items: WorkItem[] }) =>
    createElement(
      'ul',
      null,
      items.map((item) => createElement('li', { key: item.work.id }, item.work.title)),
    ),
}));

vi.mock('../AuthorSearchRow', () => ({
  AuthorSearchRow: ({ slug }: { slug: string }) =>
    createElement('article', null, slug),
}));

vi.mock('../../../components/shared/InfrastructureErrorState', () => ({
  InfrastructureErrorState: ({ onRetry }: { onRetry: () => void }) =>
    createElement('button', { type: 'button', onClick: onRetry }, 'Повторить'),
}));

vi.mock('../../../components/ui/PageState', () => ({
  PageState: ({ title }: { title: string }) => createElement('p', null, title),
}));

vi.mock('../../products/use-portfolio-works', () => ({
  usePortfolioWorks: (state: { q?: string; sort: string }) => {
    worksState.lastState = state;
    return worksState;
  },
}));

vi.mock('../../sellers/use-portfolio-authors', () => ({
  usePortfolioAuthors: (state: { q?: string; sort: string }) => {
    authorsState.lastState = state;
    return authorsState;
  },
}));

import { AuthorsSearchPane } from './AuthorsSearchPane';
import { WorksSearchPane } from './WorksSearchPane';

const workItem: WorkItem = { work: { id: 'work-1', title: 'Ваза' } };
const authorItem: AuthorItem = {
  author: {
    slug: 'ada',
    profilePhotoUrl: null,
    shortDescription: null,
  },
};

describe('search panes', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    worksState.items = [workItem];
    worksState.hasNextPage = false;
    worksState.isFetchingNextPage = false;
    worksState.isPending = false;
    worksState.isError = false;
    worksState.lastState = null;
    worksState.fetchNextPage.mockClear();
    worksState.refetch.mockClear();

    authorsState.items = [authorItem];
    authorsState.hasNextPage = false;
    authorsState.isFetchingNextPage = false;
    authorsState.isPending = false;
    authorsState.isError = false;
    authorsState.lastState = null;
    authorsState.fetchNextPage.mockClear();
    authorsState.refetch.mockClear();

    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  function render(node: ReactNode) {
    act(() => {
      root.render(node);
    });
  }

  function loadMoreButton() {
    return [...container.querySelectorAll('button')].find(
      (button) => button.textContent === 'Показать ещё',
    );
  }

  it('renders work items and keeps the newest query identity', () => {
    render(createElement(WorksSearchPane, { query: 'ми' }));

    expect(container.querySelector('li')?.textContent).toBe('Ваза');
    expect(worksState.lastState).toEqual({ q: 'ми', sort: 'newest' });
    expect(loadMoreButton()).toBeUndefined();
    expect(worksState.fetchNextPage).not.toHaveBeenCalled();
  });

  it('loads the next works page once and hides the action when no page remains', () => {
    worksState.hasNextPage = true;
    render(createElement(WorksSearchPane, { query: 'ми' }));
    const button = loadMoreButton();
    expect(button?.textContent).toBe('Показать ещё');

    act(() => {
      button?.click();
    });
    expect(worksState.fetchNextPage).toHaveBeenCalledTimes(1);

    worksState.hasNextPage = false;
    render(createElement(WorksSearchPane, { query: 'ми' }));
    expect(loadMoreButton()).toBeUndefined();
  });

  it('does not fetch another works page while the next page is already loading', () => {
    worksState.hasNextPage = true;
    worksState.isFetchingNextPage = true;
    render(createElement(WorksSearchPane));
    const button = loadMoreButton() as HTMLButtonElement | undefined;

    expect(button?.disabled).toBe(true);
    act(() => {
      button?.click();
    });
    expect(worksState.fetchNextPage).not.toHaveBeenCalled();
    expect(worksState.lastState).toEqual({ sort: 'newest' });
  });

  it('keeps works loading, empty, and error states ahead of the result list', () => {
    worksState.isPending = true;
    render(createElement(WorksSearchPane, { query: 'ми' }));
    expect(container.querySelector('[role="progressbar"]')).not.toBeNull();
    expect(container.textContent).not.toContain('Ваза');

    worksState.isPending = false;
    worksState.items = [];
    render(createElement(WorksSearchPane, { query: 'ми' }));
    expect(container.textContent).toContain('Работы не найдены');

    worksState.isError = true;
    render(createElement(WorksSearchPane, { query: 'ми' }));
    const retry = [...container.querySelectorAll('button')].find(
      (button) => button.textContent === 'Повторить',
    );
    act(() => {
      retry?.click();
    });
    expect(worksState.refetch).toHaveBeenCalledTimes(1);
    expect(loadMoreButton()).toBeUndefined();
  });

  it('renders author items and keeps the added query identity', () => {
    render(createElement(AuthorsSearchPane, { query: 'ми' }));

    expect(container.querySelector('article')?.textContent).toBe('ada');
    expect(authorsState.lastState).toEqual({ q: 'ми', sort: 'added' });
    expect(loadMoreButton()).toBeUndefined();
    expect(authorsState.fetchNextPage).not.toHaveBeenCalled();
  });

  it('loads the next authors page and skips it while that page is loading', () => {
    authorsState.hasNextPage = true;
    render(createElement(AuthorsSearchPane));
    const button = loadMoreButton();
    act(() => {
      button?.click();
    });
    expect(authorsState.fetchNextPage).toHaveBeenCalledTimes(1);
    expect(authorsState.lastState).toEqual({ sort: 'added' });

    authorsState.isFetchingNextPage = true;
    authorsState.fetchNextPage.mockClear();
    render(createElement(AuthorsSearchPane));
    const loadingButton = loadMoreButton() as HTMLButtonElement | undefined;
    expect(loadingButton?.disabled).toBe(true);
    act(() => {
      loadingButton?.click();
    });
    expect(authorsState.fetchNextPage).not.toHaveBeenCalled();

    authorsState.hasNextPage = false;
    authorsState.isFetchingNextPage = false;
    render(createElement(AuthorsSearchPane, { query: 'ми' }));
    expect(loadMoreButton()).toBeUndefined();
  });

  it('keeps author loading, empty, and error states ahead of the result list', () => {
    authorsState.isPending = true;
    render(createElement(AuthorsSearchPane, { query: 'ми' }));
    expect(container.querySelector('[role="progressbar"]')).not.toBeNull();
    expect(container.textContent).not.toContain('ada');

    authorsState.isPending = false;
    authorsState.items = [];
    render(createElement(AuthorsSearchPane, { query: 'ми' }));
    expect(container.textContent).toContain('Авторы не найдены');

    authorsState.isError = true;
    render(createElement(AuthorsSearchPane, { query: 'ми' }));
    const retry = [...container.querySelectorAll('button')].find(
      (button) => button.textContent === 'Повторить',
    );
    act(() => {
      retry?.click();
    });
    expect(authorsState.refetch).toHaveBeenCalledTimes(1);
  });
});
