/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';

import { createApiClient } from '@bidplace/api-client';

import { ApiProvider } from '../../providers/api-provider';
import {
  AUTHORS_PAGE_SIZE,
  toPortfolioAuthorsListQuery,
  type PortfolioAuthorsRouteState,
} from '../sellers/portfolio-authors-query';
import { usePortfolioAuthors } from '../sellers/use-portfolio-authors';
import {
  toPortfolioWorksListQuery,
  WORKS_PAGE_SIZE,
  type PortfolioWorksRouteState,
} from './portfolio-works-query';
import { usePortfolioWorks } from './use-portfolio-works';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

notifyManager.setNotifyFunction((callback) => {
  act(() => {
    callback();
  });
});

afterAll(() => {
  notifyManager.setNotifyFunction((callback) => {
    callback();
  });
});

const harness = vi.hoisted(() => {
  const state: {
    fetchImpl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  } = {
    fetchImpl: () => Promise.reject(new Error('catalog fetch was not installed')),
  };
  return { state };
});

vi.mock('../../lib/api', () => ({
  createMobileApiClient: () => {
    const fetchImpl = harness.state.fetchImpl;
    return createApiClient({
      baseUrl: 'https://catalog.example.test',
      fetchImpl,
    });
  },
}));

const CHECKSUM = 'ab'.repeat(32);
const worksCategory = '3c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1';
const nextWorksCategory = '3c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d2';

const worksState: PortfolioWorksRouteState = {
  q: 'glass bowl',
  category: worksCategory,
  material: 'Glass',
  sort: 'oldest',
};

const authorsState: PortfolioAuthorsRouteState = {
  q: 'pixel',
  tag: 'ceramic',
  city: 'Minsk',
  sort: 'name',
};

type StartedRequest = {
  url: URL;
  signal: AbortSignal | undefined;
  respond: (response: Response) => void;
};

type HookSnapshot = {
  itemIds: string[];
  listQuery: object;
  hasNextPage: boolean;
  isError: boolean;
  isFetchNextPageError: boolean;
  status: string;
  fetchStatus: string;
  fetchNextPage: () => Promise<unknown>;
};

type ResultMatcher = (snapshot: HookSnapshot) => boolean;

type CatalogView = {
  transport: ReturnType<typeof deferredTransport>;
  queryClient: QueryClient;
  read: () => HookSnapshot;
  unmount: () => void;
  currentResult: (matches: ResultMatcher) => Promise<void>;
  nextResult: (matches: ResultMatcher) => Promise<void>;
};

function uuid(prefix: string, index: number) {
  return `${prefix}-0000-4000-8000-${index.toString(16).padStart(12, '0')}`;
}

function deferredTransport() {
  const queue: StartedRequest[] = [];
  let waiter: ((request: StartedRequest) => void) | null = null;

  const fetchImpl: typeof fetch = (input, init) => {
    let respond: (response: Response) => void = () => undefined;
    const promise = new Promise<Response>((resolve) => {
      respond = resolve;
    });
    const request: StartedRequest = {
      url: new URL(String(input)),
      signal: init?.signal ?? undefined,
      respond,
    };
    if (waiter) {
      const notify = waiter;
      waiter = null;
      notify(request);
    } else {
      queue.push(request);
    }
    return promise;
  };

  return {
    fetchImpl,
    pendingCount: () => queue.length,
    started() {
      const existing = queue.shift();
      if (existing) return Promise.resolve(existing);
      return new Promise<StartedRequest>((resolve) => {
        waiter = resolve;
      });
    },
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function notFoundResponse() {
  return jsonResponse(
    {
      status: 404,
      code: 'not_found',
      message: 'Catalog page was not found',
    },
    404,
  );
}

function authorRecord(index: number) {
  const slug = `maker-${index}`;
  return {
    id: uuid('22222222', index),
    slug,
    fullName: `Maker ${index}`,
    country: 'Belarus',
    city: 'Minsk',
    discipline: 'Ceramics',
    practice: null,
    biography: null,
    profilePhotoUrl: `/api/sellers/${slug}/photo`,
    telegramUrl: null,
    instagramUrl: null,
    websiteUrl: null,
    shortDescription: `Practice ${index}`,
    achievements: [],
    sharePath: `/authors/${slug}`,
  };
}

function workRecord(index: number) {
  const publicId = `w${index.toString().padStart(10, '0')}`;
  return {
    id: uuid('11111111', index),
    publicId,
    title: `Work ${index}`,
    story: null,
    categoryId: worksCategory,
    technique: null,
    materials: 'Glass',
    dimensions: null,
    year: null,
    uniqueness: null,
    images: [
      {
        id: uuid('33333333', index),
        position: 0,
        url: `/api/images/${uuid('33333333', index)}`,
        mimeType: 'image/png',
        byteLength: 128,
        checksum: CHECKSUM,
        width: null,
        height: null,
      },
    ],
    publishedAt: '2026-04-01T00:00:00.000Z',
    sharePath: `/works/${publicId}`,
  };
}

function worksPage(indexes: number[], page: number, total: number) {
  return {
    works: indexes.map((index) => ({
      work: workRecord(index),
      author: authorRecord(1),
    })),
    pagination: { page, limit: WORKS_PAGE_SIZE, total },
  };
}

function authorsPage(indexes: number[], page: number, total: number) {
  return {
    authors: indexes.map((index) => ({
      author: authorRecord(index),
      workCount: 1,
    })),
    pagination: { page, limit: AUTHORS_PAGE_SIZE, total },
  };
}

function paramsOf(url: URL) {
  return Object.fromEntries(url.searchParams.entries());
}

function expectedParams(
  mapped: object,
  page: number,
  limit: number,
) {
  const params: Record<string, string> = {
    page: String(page),
    limit: String(limit),
  };
  for (const [key, value] of Object.entries(mapped)) {
    if (Array.isArray(value)) params[key] = value.join(',');
    else if (value !== undefined) params[key] = String(value);
  }
  return params;
}

function worksListQuery(state: PortfolioWorksRouteState) {
  return {
    ...toPortfolioWorksListQuery(state),
    limit: WORKS_PAGE_SIZE,
  };
}

function authorsListQuery(state: PortfolioAuthorsRouteState) {
  return {
    ...toPortfolioAuthorsListQuery(state),
    limit: AUTHORS_PAGE_SIZE,
  };
}

function sameQuery(actual: object, expected: object) {
  const left = actual as Record<string, unknown>;
  const right = expected as Record<string, unknown>;
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of keys) {
    const leftValue = left[key];
    const rightValue = right[key];
    if (Array.isArray(leftValue) || Array.isArray(rightValue)) {
      if (!Array.isArray(leftValue) || !Array.isArray(rightValue)) return false;
      if (leftValue.length !== rightValue.length) return false;
      if (leftValue.some((value, index) => value !== rightValue[index])) return false;
      continue;
    }
    if (leftValue !== rightValue) return false;
  }
  return true;
}

function isPublishedSuccess(listQuery: object): ResultMatcher {
  return (snapshot) =>
    snapshot.status === 'success' &&
    snapshot.fetchStatus === 'idle' &&
    snapshot.isError === false &&
    sameQuery(snapshot.listQuery, listQuery);
}

function isPublishedError(listQuery: object): ResultMatcher {
  return (snapshot) =>
    snapshot.status === 'error' &&
    snapshot.fetchStatus === 'idle' &&
    snapshot.isError === true &&
    snapshot.isFetchNextPageError === true &&
    sameQuery(snapshot.listQuery, listQuery);
}

function isPublishedPending(listQuery: object): ResultMatcher {
  return (snapshot) =>
    snapshot.status === 'pending' &&
    sameQuery(snapshot.listQuery, listQuery);
}

type MountedView = {
  unmount: () => void;
  queryClient: QueryClient;
  releaseTransport: () => void;
};

const mounted: MountedView[] = [];

function WorksProbe({
  state,
  report,
}: {
  state: PortfolioWorksRouteState;
  report: (snapshot: HookSnapshot) => void;
}) {
  const query = usePortfolioWorks(state);
  report({
    itemIds: query.items.map((item) => item.work.id),
    listQuery: query.listQuery,
    hasNextPage: Boolean(query.hasNextPage),
    isError: query.isError,
    isFetchNextPageError: query.isFetchNextPageError,
    status: query.status,
    fetchStatus: query.fetchStatus,
    fetchNextPage: () => query.fetchNextPage(),
  });
  return null;
}

function AuthorsProbe({
  state,
  report,
}: {
  state: PortfolioAuthorsRouteState;
  report: (snapshot: HookSnapshot) => void;
}) {
  const query = usePortfolioAuthors(state);
  report({
    itemIds: query.items.map((item) => item.author.id),
    listQuery: query.listQuery,
    hasNextPage: Boolean(query.hasNextPage),
    isError: query.isError,
    isFetchNextPageError: query.isFetchNextPageError,
    status: query.status,
    fetchStatus: query.fetchStatus,
    fetchNextPage: () => query.fetchNextPage(),
  });
  return null;
}

function createCatalogView() {
  const transport = deferredTransport();
  harness.state.fetchImpl = transport.fetchImpl;
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { refetchOnWindowFocus: false },
    },
  });
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  const snapshot: { current: HookSnapshot | null } = { current: null };
  let revision = 0;
  let unmounted = false;
  let waiter: { matches: ResultMatcher; resolve: () => void } | null = null;
  let resolveTimer: ReturnType<typeof setTimeout> | null = null;

  function report(next: HookSnapshot) {
    revision += 1;
    snapshot.current = next;
    const current = waiter;
    if (!current?.matches(next)) return;
    waiter = null;
    resolveTimer = setTimeout(() => {
      resolveTimer = null;
      current.resolve();
    }, 0);
  }

  function render(node: ReactNode) {
    act(() => {
      root.render(
        createElement(
          QueryClientProvider,
          { client: queryClient },
          createElement(ApiProvider, null, node),
        ),
      );
    });
  }

  const view: CatalogView = {
    transport,
    queryClient,
    read() {
      const current = snapshot.current;
      if (!current) throw new Error('catalog hook did not render');
      return current;
    },
    unmount() {
      if (unmounted) return;
      unmounted = true;
      waiter = null;
      if (resolveTimer) {
        clearTimeout(resolveTimer);
        resolveTimer = null;
      }
      act(() => root.unmount());
      container.remove();
    },
    currentResult(matches) {
      if (snapshot.current && matches(snapshot.current)) return Promise.resolve();
      return new Promise<void>((resolve) => {
        waiter = { matches, resolve };
      });
    },
    nextResult(matches) {
      const after = revision;
      return new Promise<void>((resolve) => {
        waiter = {
          matches: (next) => revision > after && matches(next),
          resolve,
        };
      });
    },
  };

  mounted.push({
    unmount: () => view.unmount(),
    queryClient,
    releaseTransport() {
      if (harness.state.fetchImpl === transport.fetchImpl) {
        harness.state.fetchImpl = () => Promise.reject(new Error('catalog fetch was not installed'));
      }
    },
  });

  return { view, report, render };
}

function mountWorks(state: PortfolioWorksRouteState) {
  const catalog = createCatalogView();
  const show = (next: PortfolioWorksRouteState) => {
    catalog.render(createElement(WorksProbe, { state: next, report: catalog.report }));
  };
  show(state);
  return { ...catalog.view, show };
}

function mountAuthors(state: PortfolioAuthorsRouteState) {
  const catalog = createCatalogView();
  const show = (next: PortfolioAuthorsRouteState) => {
    catalog.render(createElement(AuthorsProbe, { state: next, report: catalog.report }));
  };
  show(state);
  return { ...catalog.view, show };
}

async function publishSuccess(
  view: CatalogView,
  request: StartedRequest,
  body: unknown,
  listQuery: object,
) {
  await act(async () => {
    const done = view.nextResult(isPublishedSuccess(listQuery));
    request.respond(jsonResponse(body));
    await done;
  });
}

async function publishError(
  view: CatalogView,
  request: StartedRequest,
  listQuery: object,
) {
  await act(async () => {
    const done = view.nextResult(isPublishedError(listQuery));
    request.respond(notFoundResponse());
    await done;
  });
}

async function deliverLateResponse(request: StartedRequest, body: unknown) {
  await act(async () => {
    request.respond(jsonResponse(body));
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        setTimeout(resolve, 0);
      }, 0);
    });
  });
}

afterEach(() => {
  const entries = mounted.splice(0);
  for (const entry of entries) entry.unmount();
  for (const entry of entries) {
    entry.queryClient.clear();
    entry.releaseTransport();
  }
  document.body.replaceChildren();
});

describe('portfolio catalog hooks', () => {
  it('H01 requests the passed works route state on the first page', async () => {
    const view = mountWorks(worksState);
    const listQuery = worksListQuery(worksState);
    const request = await view.transport.started();
    expect(request.signal?.aborted).toBe(false);
    const indexes = [1, 2];
    await publishSuccess(view, request, worksPage(indexes, 1, 2), listQuery);

    const snapshot = view.read();
    expect(request.url.pathname).toBe('/api/works');
    expect(paramsOf(request.url)).toEqual(
      expectedParams(
        toPortfolioWorksListQuery(worksState),
        1,
        WORKS_PAGE_SIZE,
      ),
    );
    expect(snapshot.listQuery).toEqual(listQuery);
    expect(snapshot.itemIds).toEqual(indexes.map((index) => uuid('11111111', index)));
    expect(
      view.queryClient.getQueryCache().findAll({
        queryKey: ['portfolio-works', snapshot.listQuery],
      }),
    ).toHaveLength(1);
    view.unmount();
  });

  it('H01 requests the passed authors route state on the first page', async () => {
    const view = mountAuthors(authorsState);
    const listQuery = authorsListQuery(authorsState);
    const request = await view.transport.started();
    const indexes = [1, 2];
    await publishSuccess(view, request, authorsPage(indexes, 1, 2), listQuery);

    const snapshot = view.read();
    expect(request.url.pathname).toBe('/api/authors');
    expect(paramsOf(request.url)).toEqual(
      expectedParams(
        toPortfolioAuthorsListQuery(authorsState),
        1,
        AUTHORS_PAGE_SIZE,
      ),
    );
    expect(snapshot.listQuery).toEqual(listQuery);
    expect(snapshot.itemIds).toEqual(indexes.map((index) => uuid('22222222', index)));
    expect(
      view.queryClient.getQueryCache().findAll({
        queryKey: ['portfolio-authors', snapshot.listQuery],
      }),
    ).toHaveLength(1);
    view.unmount();
  });

  it('H02 appends one new works id when page 2 overlaps the first page', async () => {
    const view = mountWorks(worksState);
    const listQuery = worksListQuery(worksState);
    const first = await view.transport.started();
    const pageOne = Array.from({ length: WORKS_PAGE_SIZE }, (_, index) => index + 1);
    await publishSuccess(view, first, worksPage(pageOne, 1, 13), listQuery);
    expect(view.read().hasNextPage).toBe(true);

    act(() => {
      void view.read().fetchNextPage();
    });
    const second = await view.transport.started();
    expect(paramsOf(second.url).page).toBe('2');
    await publishSuccess(view, second, worksPage([WORKS_PAGE_SIZE, 13], 2, 13), listQuery);

    const snapshot = view.read();
    const ids = pageOne.map((index) => uuid('11111111', index));
    expect(snapshot.itemIds).toEqual([...ids, uuid('11111111', 13)]);
    expect(new Set(snapshot.itemIds).size).toBe(snapshot.itemIds.length);
    expect(snapshot.hasNextPage).toBe(false);
    view.unmount();
  });

  it('H02 appends one new authors id when page 2 overlaps the first page', async () => {
    const view = mountAuthors(authorsState);
    const listQuery = authorsListQuery(authorsState);
    const first = await view.transport.started();
    const pageOne = Array.from({ length: AUTHORS_PAGE_SIZE }, (_, index) => index + 1);
    await publishSuccess(view, first, authorsPage(pageOne, 1, 9), listQuery);

    act(() => {
      void view.read().fetchNextPage();
    });
    const second = await view.transport.started();
    expect(paramsOf(second.url).page).toBe('2');
    await publishSuccess(view, second, authorsPage([AUTHORS_PAGE_SIZE, 9], 2, 9), listQuery);

    const snapshot = view.read();
    const ids = pageOne.map((index) => uuid('22222222', index));
    expect(snapshot.itemIds).toEqual([...ids, uuid('22222222', 9)]);
    expect(new Set(snapshot.itemIds).size).toBe(snapshot.itemIds.length);
    expect(snapshot.hasNextPage).toBe(false);
    view.unmount();
  });

  it('H03 keeps the first works page after a non-retryable page 2 error and retries that page', async () => {
    const view = mountWorks(worksState);
    const listQuery = worksListQuery(worksState);
    const first = await view.transport.started();
    const pageOne = Array.from({ length: WORKS_PAGE_SIZE }, (_, index) => index + 1);
    await publishSuccess(view, first, worksPage(pageOne, 1, 13), listQuery);
    const pageOneIds = pageOne.map((index) => uuid('11111111', index));

    act(() => {
      void view.read().fetchNextPage();
    });
    const second = await view.transport.started();
    expect(paramsOf(second.url).page).toBe('2');
    await publishError(view, second, listQuery);

    const afterError = view.read();
    expect(afterError.itemIds).toEqual(pageOneIds);
    expect(afterError.isError).toBe(true);
    expect(afterError.isFetchNextPageError).toBe(true);
    expect(view.transport.pendingCount()).toBe(0);

    act(() => {
      void view.read().fetchNextPage();
    });
    const third = await view.transport.started();
    expect(paramsOf(third.url)).toEqual(
      expectedParams(toPortfolioWorksListQuery(worksState), 2, WORKS_PAGE_SIZE),
    );
    expect(paramsOf(third.url).page).not.toBe('1');
    expect(paramsOf(third.url).page).not.toBe('3');
    await publishSuccess(view, third, worksPage([WORKS_PAGE_SIZE, 13], 2, 13), listQuery);

    const snapshot = view.read();
    expect(snapshot.itemIds).toEqual([...pageOneIds, uuid('11111111', 13)]);
    expect(new Set(snapshot.itemIds).size).toBe(snapshot.itemIds.length);
    expect(snapshot.isError).toBe(false);
    view.unmount();
  });

  it('H03 keeps the first authors page after a non-retryable page 2 error and retries that page', async () => {
    const view = mountAuthors(authorsState);
    const listQuery = authorsListQuery(authorsState);
    const first = await view.transport.started();
    const pageOne = Array.from({ length: AUTHORS_PAGE_SIZE }, (_, index) => index + 1);
    await publishSuccess(view, first, authorsPage(pageOne, 1, 9), listQuery);
    const pageOneIds = pageOne.map((index) => uuid('22222222', index));

    act(() => {
      void view.read().fetchNextPage();
    });
    const second = await view.transport.started();
    await publishError(view, second, listQuery);
    expect(view.read().itemIds).toEqual(pageOneIds);
    expect(view.read().isFetchNextPageError).toBe(true);

    act(() => {
      void view.read().fetchNextPage();
    });
    const third = await view.transport.started();
    expect(paramsOf(third.url)).toEqual(
      expectedParams(toPortfolioAuthorsListQuery(authorsState), 2, AUTHORS_PAGE_SIZE),
    );
    await publishSuccess(view, third, authorsPage([AUTHORS_PAGE_SIZE, 9], 2, 9), listQuery);
    const snapshot = view.read();
    expect(snapshot.itemIds).toEqual([...pageOneIds, uuid('22222222', 9)]);
    expect(new Set(snapshot.itemIds).size).toBe(snapshot.itemIds.length);
    view.unmount();
  });

  it.each([
    { field: 'q', value: 'bronze vessel' },
    { field: 'category', value: nextWorksCategory },
    { field: 'material', value: 'Bronze' },
    { field: 'sort', value: 'newest' },
  ] as const)(
    'H04 works identity field $field starts a new first page',
    async ({ field, value }) => {
      const view = mountWorks(worksState);
      const listQuery = worksListQuery(worksState);
      const first = await view.transport.started();
      await publishSuccess(view, first, worksPage([1], 1, 13), listQuery);
      act(() => {
        void view.read().fetchNextPage();
      });
      const second = await view.transport.started();
      await publishSuccess(view, second, worksPage([2], 2, 13), listQuery);
      const previousIds = view.read().itemIds;
      const previousQuery = view.read().listQuery;
      const nextState: PortfolioWorksRouteState = { ...worksState, [field]: value };
      const nextQuery = worksListQuery(nextState);

      view.show(nextState);
      const restarted = await view.transport.started();
      expect(paramsOf(restarted.url).page).toBe('1');
      await view.currentResult(isPublishedPending(nextQuery));
      expect(view.read().itemIds).not.toEqual(previousIds);
      expect(view.read().itemIds).toEqual([]);

      await publishSuccess(view, restarted, worksPage([20], 1, 1), nextQuery);
      const snapshot = view.read();
      expect(snapshot.itemIds).toEqual([uuid('11111111', 20)]);
      expect(paramsOf(restarted.url)).toEqual(
        expectedParams(toPortfolioWorksListQuery(nextState), 1, WORKS_PAGE_SIZE),
      );
      expect(
        view.queryClient.getQueryCache().findAll({
          queryKey: ['portfolio-works', snapshot.listQuery],
        }),
      ).toHaveLength(1);
      expect(snapshot.listQuery).not.toEqual(previousQuery);
      view.unmount();
    },
  );

  it.each([
    { field: 'q', value: 'clay' },
    { field: 'tag', value: 'textile' },
    { field: 'city', value: 'Grodno' },
    { field: 'sort', value: 'added' },
  ] as const)(
    'H04 authors identity field $field starts a new first page',
    async ({ field, value }) => {
      const view = mountAuthors(authorsState);
      const listQuery = authorsListQuery(authorsState);
      const first = await view.transport.started();
      await publishSuccess(view, first, authorsPage([1], 1, 9), listQuery);
      act(() => {
        void view.read().fetchNextPage();
      });
      const second = await view.transport.started();
      await publishSuccess(view, second, authorsPage([2], 2, 9), listQuery);
      const previousIds = view.read().itemIds;
      const previousQuery = view.read().listQuery;
      const nextState: PortfolioAuthorsRouteState = { ...authorsState, [field]: value };
      const nextQuery = authorsListQuery(nextState);

      view.show(nextState);
      const restarted = await view.transport.started();
      expect(paramsOf(restarted.url).page).toBe('1');
      await view.currentResult(isPublishedPending(nextQuery));
      expect(view.read().itemIds).toEqual([]);
      expect(view.read().itemIds).not.toEqual(previousIds);

      await publishSuccess(view, restarted, authorsPage([20], 1, 1), nextQuery);
      const snapshot = view.read();
      expect(snapshot.itemIds).toEqual([uuid('22222222', 20)]);
      expect(paramsOf(restarted.url)).toEqual(
        expectedParams(toPortfolioAuthorsListQuery(nextState), 1, AUTHORS_PAGE_SIZE),
      );
      expect(
        view.queryClient.getQueryCache().findAll({
          queryKey: ['portfolio-authors', snapshot.listQuery],
        }),
      ).toHaveLength(1);
      expect(snapshot.listQuery).not.toEqual(previousQuery);
      view.unmount();
    },
  );

  it('H05 aborts the pending works request when the query identity changes', async () => {
    const view = mountWorks(worksState);
    const first = await view.transport.started();
    expect(first.signal?.aborted).toBe(false);
    const nextState: PortfolioWorksRouteState = { ...worksState, q: 'late glass' };

    view.show(nextState);
    const second = await view.transport.started();
    expect(first.signal?.aborted).toBe(true);
    await publishSuccess(view, second, worksPage([30], 1, 1), worksListQuery(nextState));
    await deliverLateResponse(first, worksPage([1], 1, 1));

    const snapshot = view.read();
    expect(snapshot.itemIds).toEqual([uuid('11111111', 30)]);
    expect(snapshot.isError).toBe(false);
    expect(snapshot.status).not.toBe('error');
    view.unmount();
  });

  it('H05 aborts the pending authors request when the query identity changes', async () => {
    const view = mountAuthors(authorsState);
    const first = await view.transport.started();
    expect(first.signal?.aborted).toBe(false);
    const nextState: PortfolioAuthorsRouteState = { ...authorsState, q: 'late pixel' };

    view.show(nextState);
    const second = await view.transport.started();
    expect(first.signal?.aborted).toBe(true);
    await publishSuccess(view, second, authorsPage([30], 1, 1), authorsListQuery(nextState));
    await deliverLateResponse(first, authorsPage([1], 1, 1));

    const snapshot = view.read();
    expect(snapshot.itemIds).toEqual([uuid('22222222', 30)]);
    expect(snapshot.status).not.toBe('error');
    view.unmount();
  });

  it('H06 aborts the pending works request when the last observer unmounts', async () => {
    const view = mountWorks(worksState);
    const request = await view.transport.started();
    expect(request.signal?.aborted).toBe(false);
    const queryKey = ['portfolio-works', view.read().listQuery] as const;

    view.unmount();

    expect(request.signal?.aborted).toBe(true);
    expect(view.queryClient.getQueryState(queryKey)?.status).not.toBe('error');
  });

  it('H06 aborts the pending authors request when the last observer unmounts', async () => {
    const view = mountAuthors(authorsState);
    const request = await view.transport.started();
    expect(request.signal?.aborted).toBe(false);
    const queryKey = ['portfolio-authors', view.read().listQuery] as const;

    view.unmount();

    expect(request.signal?.aborted).toBe(true);
    expect(view.queryClient.getQueryState(queryKey)?.status).not.toBe('error');
  });
});
