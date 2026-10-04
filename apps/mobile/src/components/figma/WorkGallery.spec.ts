/** @vitest-environment jsdom */
import { act, createElement, forwardRef, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
vi.mock('react-native', () => ({
  View: ({ children }: { children?: ReactNode }) =>
    createElement('div', null, children),
  ScrollView: forwardRef(({ children }: { children?: ReactNode }, ref) =>
    createElement('div', { ref }, children),
  ),
}));
vi.mock('../../lib/environment', () => ({
  getApiAssetUrl: (url: string) => url,
}));
vi.mock('../../lib/reduced-motion', () => ({ useReducedMotion: () => true }));
vi.mock('./FigmaGlassSurface', () => ({
  FigmaGlassSurface: ({ children }: { children?: ReactNode }) => children,
}));
vi.mock('./FigmaIconButton', () => ({ FigmaIconButton: () => null }));
vi.mock('../ui', () => ({
  ResilientRemoteImage: ({ uri }: { uri: string }) =>
    createElement('img', { src: uri }),
  MotionPressable: ({
    children,
    accessibilityLabel,
    onPress,
  }: {
    children?: ReactNode;
    accessibilityLabel: string;
    onPress: () => void;
  }) =>
    createElement(
      'button',
      { 'aria-label': accessibilityLabel, onClick: onPress },
      children,
    ),
  SecondaryButton: ({
    label,
    onPress,
    disabled,
  }: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
  }) => createElement('button', { onClick: onPress, disabled }, label),
  AppDialog: ({
    children,
    onClose,
  }: {
    children?: ReactNode;
    onClose: () => void;
  }) =>
    createElement(
      'div',
      { role: 'dialog' },
      children,
      createElement('button', { onClick: onClose }, 'Закрыть'),
    ),
}));
import { WorkGallery } from './WorkGallery';

it('mounts only PREVIEW before opening, then the selected FULL, and unmounts FULL when closed', () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const images = [
    {
      id: 'one',
      url: '/preview-one',
      full: { url: '/full-one', width: 200, height: 100 },
    },
    {
      id: 'two',
      url: '/preview-two',
      full: { url: '/full-two', width: 200, height: 100 },
    },
  ] as const;
  act(() => root.render(createElement(WorkGallery, { images, label: 'Work' })));
  const urls = () =>
    [...container.querySelectorAll('img')].map((image) =>
      image.getAttribute('src'),
    );
  expect(urls()).toEqual(['/preview-one', '/preview-two']);
  act(() =>
    container
      .querySelector<HTMLButtonElement>('[aria-label="Открыть фото 1"]')
      ?.click(),
  );
  expect(urls()).toEqual(['/preview-one', '/preview-two', '/full-one']);
  act(() =>
    [...container.querySelectorAll('button')]
      .find((button) => button.textContent === 'Следующее фото в просмотре')
      ?.click(),
  );
  expect(urls()).toEqual(['/preview-one', '/preview-two', '/full-two']);
  act(() =>
    [...container.querySelectorAll('button')]
      .find((button) => button.textContent === 'Закрыть')
      ?.click(),
  );
  expect(urls()).toEqual(['/preview-one', '/preview-two']);
  act(() => root.unmount());
  container.remove();
});
