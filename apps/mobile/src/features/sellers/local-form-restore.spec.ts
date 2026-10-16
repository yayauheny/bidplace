/**
 * @vitest-environment jsdom
 */
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { useForm } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import { afterEach, expect, it, vi } from 'vitest';

import { emptyProductDraftFormValues } from './product-draft-form';
import { emptyProfileDraft } from './profile-validation';
import { useLocalFormRestore } from './local-form-restore';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

type ProfileValues = typeof emptyProfileDraft;
type ProductValues = typeof emptyProductDraftFormValues;

const cases: Array<() => void> = [];

function mountProfile(entityId = 'new', base: string | null = null) {
  let form!: UseFormReturn<ProfileValues>;
  const root = createRoot(document.createElement('div'));
  function Harness({ baseToken }: { baseToken: string | null }) {
    form = useForm<ProfileValues>({ defaultValues: emptyProfileDraft });
    void form.formState.isDirty;
    useLocalFormRestore({
      form,
      accountId: 'user-a',
      scope: 'seller-application',
      entityId,
      baseToken,
      serverValues: entityId === 'new' ? null : emptyProfileDraft,
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
    rerender(nextBase: string | null) {
      act(() => root.render(createElement(Harness, { baseToken: nextBase })));
    },
  };
}

function mountProduct(entityId = 'new', base: string | null = null) {
  let form!: UseFormReturn<ProductValues>;
  const root = createRoot(document.createElement('div'));
  function Harness({ baseToken }: { baseToken: string | null }) {
    form = useForm<ProductValues>({ defaultValues: emptyProductDraftFormValues });
    void form.formState.isDirty;
    useLocalFormRestore({
      form,
      accountId: 'user-a',
      scope: 'product-draft',
      entityId,
      baseToken,
      serverValues: entityId === 'new' ? null : emptyProductDraftFormValues,
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
    rerender(nextBase: string | null) {
      act(() => root.render(createElement(Harness, { baseToken: nextBase })));
    },
  };
}

afterEach(() => {
  cases.splice(0).forEach((cleanup) => cleanup());
  window.localStorage.clear();
  vi.useRealTimers();
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
  act(() => view.form.setValue('title', 'Несохранённое название', { shouldDirty: true }));
  act(() => vi.advanceTimersByTime(500));
  expect(JSON.parse(window.localStorage.getItem(key)!).values.title).toBe('Несохранённое название');
  view.rerender('revision-t2');
  act(() => vi.advanceTimersByTime(500));
  expect(view.form.getValues('title')).toBe('Несохранённое название');
  expect(window.localStorage.getItem(key)).toBeNull();
});
