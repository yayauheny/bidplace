import { describe, expect, it, vi } from 'vitest';

import { navigateWorksCatalogBack } from './works-catalog-back';

describe('works catalog back', () => {
  it('uses history when the stack can go back', () => {
    const router = {
      canGoBack: () => true,
      back: vi.fn(),
      replace: vi.fn(),
    };
    navigateWorksCatalogBack(router);
    expect(router.back).toHaveBeenCalledOnce();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('falls back to /works without a history stack', () => {
    const router = {
      canGoBack: () => false,
      back: vi.fn(),
      replace: vi.fn(),
    };
    navigateWorksCatalogBack(router);
    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/works');
  });
});
