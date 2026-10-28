/**
 * @vitest-environment jsdom
 */
import { act, createElement, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const api = vi.hoisted(() => ({ getStoryImage: vi.fn(), getImage: vi.fn() }));

vi.mock('../../providers/api-provider', () => ({
  useApiClient: () => ({ images: api }),
}));
vi.mock('react-native', () => ({
  View: ({ children }: { children?: ReactNode }) => createElement('div', null, children),
}));
vi.mock('expo-image', () => ({
  Image: ({ source }: { source: { uri: string } }) =>
    createElement('img', { src: source.uri, alt: 'story image' }),
}));
vi.mock('../ui', () => ({
  AppText: ({ children }: { children?: ReactNode }) => createElement('span', null, children),
  SecondaryButton: ({ label, onPress }: { label: string; onPress: () => void }) =>
    createElement('button', { type: 'button', onClick: onPress }, label),
}));

import { PrivateStoryImage } from './PrivateStoryImage';

describe('private Work Story preview', () => {
  it('lets the user retry a pending media derivative without exposing an unauthenticated URL', async () => {
    api.getStoryImage.mockReset().mockRejectedValueOnce(new Error('preview not delivered'))
      .mockResolvedValueOnce(new Blob(['preview'], { type: 'image/webp' }));
    api.getImage.mockReset();
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => 'blob:private-preview');
    URL.revokeObjectURL = vi.fn();
    const container = document.createElement('div');
    const root = createRoot(container);
    try {
      await act(async () => {
        root.render(createElement(PrivateStoryImage, {
          productId: 'work-id',
          mediaAssetId: 'asset-id',
          authEpoch: 1,
          label: 'Фото',
          style: { width: 120, height: 90 },
        }));
        await Promise.resolve();
      });
      expect(container.textContent).toContain('Фото истории недоступно');
      await act(async () => {
        container.querySelector('button')?.click();
        await Promise.resolve();
      });
      expect(api.getStoryImage).toHaveBeenCalledTimes(2);
      expect(container.querySelector('img')?.getAttribute('src')).toBe('blob:private-preview');
      expect(api.getImage).not.toHaveBeenCalled();
    } finally {
      act(() => root.unmount());
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
    }
  });
});
