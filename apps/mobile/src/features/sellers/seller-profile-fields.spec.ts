/**
 * @vitest-environment jsdom
 */
import {
  act,
  createElement,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
  type RefObject,
} from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { profileDraftSchema } from './profile-validation';
import {
  ProfileFieldWriteGuard,
  SellerProfileFormSteps,
  type ProfileFields,
} from './seller-profile-steps';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const emptyFields: ProfileFields = {
  slug: '',
  fullName: '',
  discipline: '',
  country: 'BY',
  city: '',
  practice: '',
  socialLink: '',
  telegramUrl: '',
  instagramUrl: '',
  websiteUrl: '',
  publicEmail: '',
  shortDescription: '',
};

vi.mock('react-native', () => ({
  View: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
}));

vi.mock('../../components/ui', () => ({
  AppText: ({ children }: { children?: ReactNode }) => createElement('span', null, children),
  FormSection: ({ children }: { children?: ReactNode }) => createElement('section', null, children),
  TextField: ({
    label,
    value,
    editable = true,
    error,
    onChangeText,
  }: {
    label: string;
    value?: string;
    editable?: boolean;
    error?: string;
    onChangeText?: (value: string) => void;
  }) =>
    createElement(
      'label',
      null,
      createElement('input', {
        'aria-label': label,
        value: value ?? '',
        disabled: editable === false,
        onChange: (event: { target: { value: string } }) => onChangeText?.(event.target.value),
      }),
      error ? createElement('span', null, error) : null,
    ),
}));

function Harness({ guard }: { guard: RefObject<boolean> }) {
  const [step, setStep] = useState<1 | 2>(1);
  const form = useForm<ProfileFields>({
    defaultValues: emptyFields,
    resolver: zodResolver(profileDraftSchema),
    mode: 'onChange',
    shouldUnregister: false,
  });
  useEffect(() => {
    void form.trigger();
  }, [form]);
  const Provider = FormProvider as ComponentType<
    UseFormReturn<ProfileFields> & { children?: ReactNode }
  >;
  return createElement(Provider, {
    ...form,
    children: createElement(
      'div',
      null,
      createElement('button', { type: 'button', onClick: () => setStep(1) }, 'Шаг 1'),
      createElement('button', { type: 'button', onClick: () => setStep(2) }, 'Шаг 2'),
      createElement(ProfileFieldWriteGuard, {
        guard,
        children: createElement(SellerProfileFormSteps, {
          profileStep: step,
          showAllSteps: false,
          editable: true,
        }),
      }),
    ),
  });
}

function mount() {
  const guard = { current: false };
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  function GuardedHarness() {
    const guardRef = useRef(guard);
    return createElement(Harness, { guard: guardRef.current });
  }
  act(() => {
    root.render(createElement(GuardedHarness));
  });
  return {
    container,
    guard,
    unmount() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function input(container: ParentNode, label: string) {
  const field = container.querySelector(`[aria-label="${label}"]`);
  if (!(field instanceof HTMLInputElement)) throw new Error(`Missing field ${label}`);
  return field;
}

function setInput(container: ParentNode, label: string, value: string) {
  const field = input(container, label);
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  act(() => {
    setter?.call(field, value);
    field.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

describe('seller profile field ownership', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('shows draft field errors from the form resolver and keeps raw contact text', async () => {
    const view = mount();
    await flush();
    expect(view.container.textContent).toContain('Укажите город');
    setInput(view.container, 'Город', 'Минск');
    await flush();
    expect(view.container.textContent).not.toContain('Укажите город');
    act(() => {
      [...view.container.querySelectorAll('button')].find((button) => button.textContent === 'Шаг 2')?.click();
    });
    setInput(view.container, 'Telegram', '@maker_art');
    await flush();
    expect(input(view.container, 'Telegram').value).toBe('@maker_art');
    expect(view.container.textContent).not.toContain('Введите Telegram username или HTTPS-ссылку');
    setInput(view.container, 'Telegram', 'not-a-url');
    await flush();
    expect(input(view.container, 'Telegram').value).toBe('not-a-url');
    expect(view.container.textContent).toContain('Введите Telegram username или HTTPS-ссылку');
    view.unmount();
  });

  it('keeps values when a step unmounts and ignores writes while the transition lock is held', async () => {
    const view = mount();
    await flush();
    setInput(view.container, 'Никнейм', 'maker');
    act(() => {
      [...view.container.querySelectorAll('button')].find((button) => button.textContent === 'Шаг 2')?.click();
    });
    expect(view.container.querySelector('[aria-label="Никнейм"]')).toBeNull();
    act(() => {
      [...view.container.querySelectorAll('button')].find((button) => button.textContent === 'Шаг 1')?.click();
    });
    expect(input(view.container, 'Никнейм').value).toBe('maker');
    view.guard.current = true;
    setInput(view.container, 'Никнейм', 'other');
    expect(input(view.container, 'Никнейм').value).toBe('maker');
    view.unmount();
  });
});
