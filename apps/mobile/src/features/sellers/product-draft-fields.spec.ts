/**
 * @vitest-environment jsdom
 */
import {
  act,
  createElement,
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

import { ProductDraftAboutStep } from './product-draft-about';
import { ProductDraftWriteGuard } from './product-draft-fields';
import {
  emptyProductDraftFormValues,
  productDraftFormSchema,
  type ProductDraftFormValues,
} from './product-draft-form';
import { ProductDraftStoryStep } from './product-draft-story';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

vi.mock('react-native', () => ({
  View: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
}));

vi.mock('../../components/layout', () => ({
  FormPageColumns: ({
    children,
    sidebar,
  }: {
    children?: ReactNode;
    sidebar?: ReactNode;
  }) => createElement('div', null, sidebar, children),
}));

vi.mock('../../components/ui', () => ({
  AppText: ({ children }: { children?: ReactNode }) => createElement('span', null, children),
  FormSection: ({ children }: { children?: ReactNode }) => createElement('section', null, children),
  PrimaryButton: ({
    label,
    onPress,
    disabled,
  }: {
    label: string;
    onPress?: () => void;
    disabled?: boolean;
  }) => createElement('button', { type: 'button', disabled, onClick: () => onPress?.() }, label),
  SecondaryButton: ({
    label,
    onPress,
    disabled,
  }: {
    label: string;
    onPress?: () => void;
    disabled?: boolean;
  }) => createElement('button', { type: 'button', disabled, onClick: () => onPress?.() }, label),
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

const categories = [{ id: 'cat-1', name: 'Painting' }];

function Harness({ guard }: { guard: RefObject<boolean> }) {
  const [step, setStep] = useState<'about' | 'story'>('about');
  const [stepOneAttempted, setStepOneAttempted] = useState(false);
  const form = useForm<ProductDraftFormValues>({
    defaultValues: emptyProductDraftFormValues,
    resolver: zodResolver(productDraftFormSchema),
    mode: 'onChange',
    shouldUnregister: false,
  });
  const Provider = FormProvider as ComponentType<
    UseFormReturn<ProductDraftFormValues> & { children?: ReactNode }
  >;
  return createElement(Provider, {
    ...form,
    children: createElement(
      'div',
      null,
      createElement('button', { type: 'button', onClick: () => setStep('about') }, 'О работе'),
      createElement('button', { type: 'button', onClick: () => setStep('story') }, 'История'),
      createElement(
        'button',
        { type: 'button', onClick: () => setStepOneAttempted(true) },
        'Проверить шаг',
      ),
      createElement(ProductDraftWriteGuard, {
        guard,
        children:
          step === 'about'
            ? createElement(ProductDraftAboutStep, {
                isCreationFlow: true,
                wizardStep: 1,
                editable: true,
                categories,
                stepOneAttempted,
                saveIsPending: false,
                saveIsError: false,
                onSavePress: () => undefined,
                wizardCanOpenImages: false,
                onContinueToImages: () => undefined,
              })
            : createElement(ProductDraftStoryStep, {
                editable: true,
                savePending: false,
                saveError: false,
                onBackToImages: () => undefined,
                onSaveAndContinue: () => undefined,
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

function click(container: ParentNode, label: string) {
  const button = [...container.querySelectorAll('button')].find((item) => item.textContent === label);
  if (!button) throw new Error(`Missing button ${label}`);
  act(() => {
    button.click();
  });
}

describe('product draft field ownership', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('keeps an incomplete draft editable and reveals required errors only after the step is attempted', async () => {
    const view = mount();
    await flush();
    expect(view.container.textContent).not.toContain('Введите название');
    expect(view.container.textContent).not.toContain('Выберите категорию');
    setInput(view.container, 'Название', 'First work');
    click(view.container, 'Painting');
    await flush();
    expect(input(view.container, 'Название').value).toBe('First work');
    expect(view.container.textContent).toContain('✓ Painting');
    setInput(view.container, 'Название', '');
    setInput(view.container, 'Год создания', '10000');
    await flush();
    expect(view.container.textContent).not.toContain('Введите год числом от 0 до 9999');
    click(view.container, 'Проверить шаг');
    await flush();
    expect(view.container.textContent).toContain('Введите название');
    expect(view.container.textContent).toContain('Введите год числом от 0 до 9999');
    expect(view.container.textContent).toContain('Проверьте обязательные поля');
    view.unmount();
  });

  it('keeps values when a step unmounts and ignores writes while the transition lock is held', async () => {
    const view = mount();
    await flush();
    setInput(view.container, 'Название', 'Kept title');
    click(view.container, 'История');
    expect(view.container.querySelector('[aria-label="Название"]')).toBeNull();
    setInput(view.container, 'История создания', 'A story');
    click(view.container, 'О работе');
    expect(input(view.container, 'Название').value).toBe('Kept title');
    view.guard.current = true;
    setInput(view.container, 'Название', 'Other');
    click(view.container, 'Painting');
    expect(input(view.container, 'Название').value).toBe('Kept title');
    expect(view.container.textContent).not.toContain('✓ Painting');
    view.unmount();
  });
});
