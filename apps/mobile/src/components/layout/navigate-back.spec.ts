import { afterEach, describe, expect, it, vi } from 'vitest';

import { navigateBack } from './navigate-back';

describe('navigateBack', () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each([0, 3])(
    'uses real browser history position %i instead of an anchored stack',
    (index) => {
      vi.stubGlobal('window', { history: { state: { index } } });
      const router = { canGoBack: () => true, back: vi.fn(), replace: vi.fn() };
      navigateBack(router, { fallbackHref: '/authors' });
      if (index === 0) {
        expect(router.replace).toHaveBeenCalledWith('/authors');
        expect(router.back).not.toHaveBeenCalled();
      } else {
        expect(router.back).toHaveBeenCalledOnce();
        expect(router.replace).not.toHaveBeenCalled();
      }
    },
  );
  it('uses history when the stack can go back', () => {
    const router = {
      canGoBack: () => true,
      back: vi.fn(),
      replace: vi.fn(),
    };
    navigateBack(router, { fallbackHref: '/authors' });
    expect(router.back).toHaveBeenCalledOnce();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('uses the caller fallback only when history is empty', () => {
    const router = {
      canGoBack: () => false,
      back: vi.fn(),
      replace: vi.fn(),
    };
    navigateBack(router, { fallbackHref: '/works' });
    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/works');
  });
});
