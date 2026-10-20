/**
 * @vitest-environment jsdom
 */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import { afterEach, expect, it, vi } from 'vitest';

import { clearAccountFormDrafts } from '../../lib/local-form-draft';
import {
  issueDraftWriteLease,
  retireDraftWriteLease,
} from '../../lib/query-cache';
import {
  emptyProductDraftFormValues,
  productDraftFieldsSchema,
} from './product-draft-form';
import {
  emptyProfileDraft,
  profileDraftFieldsSchema,
} from './profile-validation';
import { useLocalFormRestore } from './local-form-restore';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

type ProfileValues = typeof emptyProfileDraft;
type ProductValues = typeof emptyProductDraftFormValues;
type RestoreHook = ReturnType<typeof useLocalFormRestore>;

const cases: Array<() => void> = [];

function mountProfile(
  entityId = 'new',
  base: string | null = null,
  serverValues?: ProfileValues,
) {
  let form!: UseFormReturn<ProfileValues>;
  let restore!: RestoreHook;
  const queryClient = new QueryClient();
  const root = createRoot(document.createElement('div'));
  function Harness({ baseToken }: { baseToken: string | null }) {
    form = useForm<ProfileValues>({ defaultValues: emptyProfileDraft });
    void form.formState.isDirty;
    restore = useLocalFormRestore({
      form,
      accountId: 'user-a',
      scope: 'seller-application',
      entityId,
      baseToken,
      serverValues:
        serverValues ?? (entityId === 'new' ? null : emptyProfileDraft),
      fields: profileDraftFieldsSchema,
      queryClient,
      canWrite: () => true,
    });
    return null;
  }
  act(() => root.render(createElement(Harness, { baseToken: base })));
  cases.push(() => act(() => root.unmount()));
  return {
    queryClient,
    get form() {
      return form;
    },
    get restore() {
      return restore;
    },
    rerender(nextBase: string | null) {
      act(() => root.render(createElement(Harness, { baseToken: nextBase })));
    },
  };
}

function mountProduct(
  entityId = 'new',
  base: string | null = null,
  serverValues?: ProductValues,
) {
  let form!: UseFormReturn<ProductValues>;
  let restore!: RestoreHook;
  const queryClient = new QueryClient();
  const root = createRoot(document.createElement('div'));
  function Harness({ baseToken }: { baseToken: string | null }) {
    form = useForm<ProductValues>({
      defaultValues: emptyProductDraftFormValues,
    });
    void form.formState.isDirty;
    restore = useLocalFormRestore({
      form,
      accountId: 'user-a',
      scope: 'product-draft',
      entityId,
      baseToken,
      serverValues:
        serverValues ??
        (entityId === 'new' ? null : emptyProductDraftFormValues),
      fields: productDraftFieldsSchema,
      queryClient,
      canWrite: () => true,
    });
    return null;
  }
  act(() => root.render(createElement(Harness, { baseToken: base })));
  cases.push(() => act(() => root.unmount()));
  return {
    queryClient,
    get form() {
      return form;
    },
    get restore() {
      return restore;
    },
    rerender(nextBase: string | null, nextServerValues?: ProductValues) {
      serverValues = nextServerValues ?? serverValues;
      act(() => root.render(createElement(Harness, { baseToken: nextBase })));
    },
  };
}

afterEach(() => {
  cases.splice(0).forEach((cleanup) => cleanup());
  window.localStorage.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it('restores all author input when the optional public email is unfinished', () => {
  const values = {
    ...emptyProfileDraft,
    fullName: 'Автор текста',
    shortDescription: 'Несохранённая биография',
    publicEmail: 'unfinished@',
  };
  window.localStorage.setItem(
    'bidplace:draft:user-a:seller-application:new',
    JSON.stringify({ base: null, values }),
  );
  const view = mountProfile();
  expect(view.form.getValues()).toEqual(values);
});

it('restores all Work input when the year is temporarily invalid', () => {
  const values = {
    ...emptyProductDraftFormValues,
    title: 'Важное название',
    uniqueness: 'Несохранённое описание',
    year: '20-',
  };
  window.localStorage.setItem(
    'bidplace:draft:user-a:product-draft:new',
    JSON.stringify({ base: null, values }),
  );
  const view = mountProduct();
  expect(view.form.getValues()).toEqual(values);
});

it('drops a stored array mixing strings with non-strings and restores its neighbours', () => {
  const values = {
    ...emptyProductDraftFormValues,
    title: 'Несохранённое название',
    materialProposals: ['ok', {}] as unknown as string[],
  };
  window.localStorage.setItem(
    'bidplace:draft:user-a:product-draft:new',
    JSON.stringify({ base: null, values }),
  );
  const view = mountProduct();
  expect(view.form.getValues('materialProposals')).toEqual([]);
  expect(view.form.getValues('title')).toBe('Несохранённое название');
});

it('drops a stored ID array that mixes a string with a number', () => {
  const values = {
    ...emptyProductDraftFormValues,
    title: 'Несохранённое название',
    materialTermIds: ['a', 42] as unknown as string[],
  };
  window.localStorage.setItem(
    'bidplace:draft:user-a:product-draft:new',
    JSON.stringify({ base: null, values }),
  );
  const view = mountProduct();
  expect(view.form.getValues('materialTermIds')).toEqual([]);
  expect(view.form.getValues('title')).toBe('Несохранённое название');
});

it('does not pass unknown stored fields into the form', () => {
  const values = {
    ...emptyProfileDraft,
    fullName: 'Автор текста',
    hackerField: 'стороннее значение',
  };
  window.localStorage.setItem(
    'bidplace:draft:user-a:seller-application:new',
    JSON.stringify({ base: null, values }),
  );
  const view = mountProfile();
  expect(view.form.getValues('fullName')).toBe('Автор текста');
  expect('hackerField' in view.form.getValues()).toBe(false);
});

it('drops a stored field whose JSON shape does not match the form', () => {
  const values = {
    ...emptyProductDraftFormValues,
    title: 42,
    uniqueness: 'Несохранённое описание',
  };
  window.localStorage.setItem(
    'bidplace:draft:user-a:product-draft:new',
    JSON.stringify({ base: null, values }),
  );
  const view = mountProduct();
  expect(view.form.getValues('title')).toBe('');
  expect(view.form.getValues('uniqueness')).toBe('Несохранённое описание');
});

it('drops a cached draft written for a different server revision', () => {
  vi.useFakeTimers();
  const key = 'bidplace:draft:user-a:product-draft:work-1';
  const view = mountProduct('work-1', 'revision-t1');
  act(() =>
    view.form.setValue('title', 'Несохранённое название', {
      shouldDirty: true,
    }),
  );
  act(() => vi.advanceTimersByTime(500));
  expect(JSON.parse(window.localStorage.getItem(key)!).values.title).toBe(
    'Несохранённое название',
  );
  view.rerender('revision-t2');
  act(() => vi.advanceTimersByTime(500));
  expect(view.form.getValues('title')).toBe('Несохранённое название');
  expect(window.localStorage.getItem(key)).toBeNull();
});

it('removes a fully saved local snapshot instead of repersisting a clean form', () => {
  vi.useFakeTimers();
  const key = 'bidplace:draft:user-a:product-draft:work-1';
  const serverValues = {
    ...emptyProductDraftFormValues,
    title: 'Серверное название',
  };
  const view = mountProduct('work-1', 'revision-t1', serverValues);
  act(() =>
    view.form.setValue('title', 'Несохранённое название', {
      shouldDirty: true,
    }),
  );
  act(() => vi.advanceTimersByTime(500));
  expect(JSON.parse(window.localStorage.getItem(key)!).values.title).toBe(
    'Несохранённое название',
  );
  // Clean save: the server confirmed new values and the form resets to them.
  const saved = {
    ...emptyProductDraftFormValues,
    title: 'Сохранённое название',
  };
  act(() => {
    view.form.reset(saved);
    view.rerender('revision-t2', saved);
  });
  act(() => vi.advanceTimersByTime(500));
  expect(window.localStorage.getItem(key)).toBeNull();
});

it('drops a delayed write scheduled before the session lease was retired', () => {
  vi.useFakeTimers();
  const key = 'bidplace:draft:user-a:product-draft:work-1';
  const view = mountProduct('work-1', 'revision-t1');
  act(() =>
    view.form.setValue('title', 'Приватный ввод', { shouldDirty: true }),
  );
  // Logout clears the account drafts and retires the session lease while
  // the debounced write is pending.
  clearAccountFormDrafts('user-a');
  retireDraftWriteLease(view.queryClient);
  act(() => vi.advanceTimersByTime(500));
  expect(window.localStorage.getItem(key)).toBeNull();
});

it('does not re-arm writes after the drafts were cleared until a new session lease', () => {
  vi.useFakeTimers();
  const key = 'bidplace:draft:user-a:product-draft:new';
  const view = mountProduct();
  act(() => view.form.setValue('title', 'Первый ввод', { shouldDirty: true }));
  act(() => vi.advanceTimersByTime(500));
  expect(window.localStorage.getItem(key)).not.toBeNull();
  // Logout completes locally; typing resumes before the next login installs
  // a new lease — nothing may be written in between.
  clearAccountFormDrafts('user-a');
  retireDraftWriteLease(view.queryClient);
  act(() => view.form.setValue('title', 'Поздний ввод', { shouldDirty: true }));
  act(() => vi.advanceTimersByTime(500));
  expect(window.localStorage.getItem(key)).toBeNull();
  // The next login issues a fresh lease and drafts persist again.
  issueDraftWriteLease(view.queryClient);
  act(() => view.form.setValue('title', 'Новый ввод', { shouldDirty: true }));
  act(() => vi.advanceTimersByTime(500));
  expect(JSON.parse(window.localStorage.getItem(key)!).values.title).toBe(
    'Новый ввод',
  );
});

it('keeps the draft at the old key when the entity-created copy fails to write', () => {
  vi.useFakeTimers();
  const newKey = 'bidplace:draft:user-a:product-draft:new';
  const view = mountProduct();
  act(() =>
    view.form.setValue('title', 'Несохранённое название', {
      shouldDirty: true,
    }),
  );
  act(() => vi.advanceTimersByTime(500));
  expect(window.localStorage.getItem(newKey)).not.toBeNull();
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('quota exceeded', 'QuotaExceededError');
  });
  act(() => view.restore.noteEntityCreated('work-1', 'revision-t1'));
  // The only snapshot must survive a failed copy to the real id.
  expect(window.localStorage.getItem(newKey)).not.toBeNull();
  expect(view.restore.storageError).toBeTruthy();
});

it('reports when the local draft storage rejects writes', () => {
  vi.useFakeTimers();
  const view = mountProduct();
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('quota exceeded', 'QuotaExceededError');
  });
  act(() => view.form.setValue('title', 'Текст', { shouldDirty: true }));
  act(() => vi.advanceTimersByTime(500));
  expect(view.restore.storageError).toBeTruthy();
});

it('reports when local draft storage is unavailable on load', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('denied', 'SecurityError');
  });
  const view = mountProduct();
  expect(view.restore.storageError).toBeTruthy();
});

it('does not warn when the runtime has no Web Storage', () => {
  vi.useFakeTimers();
  vi.stubGlobal('localStorage', undefined);
  try {
    const view = mountProduct();
    // The probe alone is not enough — the warning rule must hold for typed
    // input and the debounced flush too.
    act(() => view.form.setValue('title', 'Текст', { shouldDirty: true }));
    act(() => vi.advanceTimersByTime(500));
    expect(view.restore.storageError).toBeNull();
  } finally {
    vi.unstubAllGlobals();
  }
});
