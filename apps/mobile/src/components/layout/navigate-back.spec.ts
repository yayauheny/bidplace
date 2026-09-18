import { describe, expect, it, vi } from 'vitest';

import { navigateBack } from './navigate-back';

describe('navigateBack', () => {
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
