import { describe, expect, it, vi } from 'vitest';

import { navigateWorkPageBack } from './work-page-back';

describe('Work page back', () => {
  it('uses history when the stack can go back', () => {
    const router = {
      canGoBack: () => true,
      back: vi.fn(),
      replace: vi.fn(),
    };
    navigateWorkPageBack(router);
    expect(router.back).toHaveBeenCalledOnce();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('falls back to the works catalog without a history stack', () => {
    const router = {
      canGoBack: () => false,
      back: vi.fn(),
      replace: vi.fn(),
    };
    navigateWorkPageBack(router);
    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/works');
  });
});
