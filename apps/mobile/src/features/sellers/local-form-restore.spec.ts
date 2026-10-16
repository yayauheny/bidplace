/**
 * @vitest-environment jsdom
 */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { useForm } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import { afterEach, expect, it, vi } from 'vitest';

import { clearAccountFormDrafts } from '../../lib/local-form-draft';
import { emptyProductDraftFormValues } from './product-draft-form';
import { emptyProfileDraft } from './profile-validation';
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
      canWrite: () => true,
    });
    return null;
  }
  act(() => root.render(createElement(Harness, { baseToken: base })));
  cases.push(() => act(() => root.unmount()));
  return {
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
      canWrite: () => true,
    });
    return null;
  }
  act(() => root.render(createElement(Harness, { baseToken: base })));
  cases.push(() => act(() => root.unmount()));
  return {
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

it('drops a delayed write scheduled before the account drafts were cleared', () => {
  vi.useFakeTimers();
  const key = 'bidplace:draft:user-a:product-draft:work-1';
  const view = mountProduct('work-1', 'revision-t1');
  act(() =>
    view.form.setValue('title', 'Приватный ввод', { shouldDirty: true }),
  );
  // Logout clears the account drafts while the debounced write is pending.
  clearAccountFormDrafts('user-a');
  act(() => vi.advanceTimersByTime(500));
  expect(window.localStorage.getItem(key)).toBeNull();
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
