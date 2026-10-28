/** @vitest-environment jsdom */
import { act, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../testing/author-application-mocks';
import {
  ProductDraftStoryStep,
  type ProductDraftStoryStepProps,
} from './product-draft-story';
import type { EditableStoryBlock } from './use-product-story-editor';

vi.mock('../../components/ui', () => ({
  AppText: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  SecondaryButton: ({
    label,
    disabled,
    onPress,
  }: {
    label: string;
    disabled?: boolean;
    onPress: () => void;
  }) => (
    <button disabled={disabled} onClick={onPress}>
      {label}
    </button>
  ),
  productMediaStyle: () => ({}),
}));
vi.mock('../../components/figma/FigmaIconButton', () => ({
  FigmaIconButton: ({
    label,
    disabled,
    onPress,
  }: {
    label: string;
    disabled?: boolean;
    onPress: () => void;
  }) => (
    <button aria-label={label} disabled={disabled} onClick={onPress}>
      {label}
    </button>
  ),
}));
vi.mock('react-native', () =>
  vi.importActual<typeof import('react-native')>('react-native-web'),
);
vi.mock('../../providers/theme-provider', async () => {
  const { lightColorMap } = await import('@bidplace/design-tokens');
  return { useAppTheme: () => lightColorMap };
});
vi.mock('../../components/shared/PrivateStoryImage', () => ({
  PrivateStoryImage: () => null,
}));
vi.mock('./product-block-actions', () => ({
  ProductBlockActions: ({
    children,
    blockKey,
    disabled,
  }: {
    children: ReactNode;
    blockKey: string;
    disabled: boolean;
  }) => (
    <div data-block-key={blockKey}>
      <button disabled={disabled}>Действия</button>
      {children}
    </div>
  ),
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const cleanups: Array<() => void> = [];
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
});
function mount(
  overrides: Partial<ProductDraftStoryStepProps> & {
    canAddText?: boolean;
    canAddImage?: boolean;
  } = {},
) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  function Probe() {
    const [blocks, setBlocks] = useState<EditableStoryBlock[]>([]);
    return (
      <ProductDraftStoryStep
        productId="work"
        authEpoch={1}
        isCreationFlow
        storyNeedsDraft={false}
        blocks={blocks}
        images={[]}
        editable
        savePending={false}
        uploading={false}
        canAddText
        canAddImage
        saveError={null}
        retryUpload={false}
        onAddText={(type, text = '', key = 'new') => {
          setBlocks((previous) => [...previous, { type, text, key }]);
          return key;
        }}
        onEditText={(key, text) =>
          setBlocks((previous) =>
            previous.map((block) =>
              block.key === key && block.type !== 'IMAGE'
                ? { ...block, text }
                : block,
            ),
          )
        }
        onEditAlt={() => undefined}
        onRemove={() => undefined}
        onMove={() => undefined}
        onChooseImage={() => undefined}
        onRetryUpload={() => undefined}
        onSaveAndContinue={() => undefined}
        {...overrides}
      />
    );
  }
  act(() => root.render(<Probe />));
  cleanups.push(() => {
    act(() => root.unmount());
    container.remove();
  });
  return container;
}
describe('story step', () => {
  it('keeps the virtual paragraph node, key and focus after its first character', () => {
    const container = mount();
    const input = container.querySelector('textarea')!;
    const key = input
      .closest('[data-block-key]')
      ?.getAttribute('data-block-key');
    act(() => input.focus());
    act(() => {
      Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        'value',
      )!.set!.call(input, 'А');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(container.querySelector('textarea')).toBe(input);
    expect(
      input.closest('[data-block-key]')?.getAttribute('data-block-key'),
    ).toBe(key);
    expect(document.activeElement).toBe(input);
  });
  it('uses the editor capacity and keeps upload text enabled while disabling actions', () => {
    const container = mount({
      canAddText: false,
      canAddImage: false,
      uploading: true,
    });
    expect(container.querySelector('textarea')?.readOnly).toBe(false);
    expect(
      [...container.querySelectorAll('button')].every(
        (button) => button.disabled,
      ),
    ).toBe(true);
  });
  it('uses the editor limits for add controls', () => {
    const container = mount({ canAddText: false, canAddImage: false });
    const add = [...container.querySelectorAll('button')].filter((button) =>
      button.getAttribute('aria-label')?.startsWith('Добавить'),
    );
    expect(add).toHaveLength(3);
    expect(add.every((button) => button.disabled)).toBe(true);
  });
});
