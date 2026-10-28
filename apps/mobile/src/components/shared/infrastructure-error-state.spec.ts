import { describe, expect, it } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

import { INFRASTRUCTURE_ERROR_COPY } from '../../errors';
import { BIDPLACE_PAGE_LOGO_SIZE } from '../branding/bidplace-brand-metrics';
import {
  INFRASTRUCTURE_ERROR_COPY_MAX_WIDTH,
  INFRASTRUCTURE_ERROR_TEXT_ROLE,
  infrastructurePageErrorLayout,
  showsInfrastructureErrorLogo,
} from './infrastructure-error-presentation';
import {
  combineInfrastructurePageStatus,
  infrastructurePageFetchStatus,
  infrastructurePageVisual,
} from './infrastructure-page-status';

describe('InfrastructureErrorState presentation', () => {
  it('uses one canonical copy without layout line breaks', () => {
    expect(INFRASTRUCTURE_ERROR_COPY).toBe(
      'Проверьте соединение и попробуйте ещё раз.',
    );
    expect(INFRASTRUCTURE_ERROR_COPY.includes('\n')).toBe(false);
  });

  it('shows the animated mark only in page presentation', () => {
    expect(showsInfrastructureErrorLogo('page')).toBe(true);
    expect(showsInfrastructureErrorLogo()).toBe(true);
    expect(showsInfrastructureErrorLogo('inline')).toBe(false);
  });

  it('uses a compact work title and a medium page mark', () => {
    expect(INFRASTRUCTURE_ERROR_TEXT_ROLE).toBe('workTitle');
    expect(designTokens.typography.workTitle).toMatchObject({
      fontSize: 20,
      lineHeight: 24,
      fontWeight: '600',
    });
    expect(INFRASTRUCTURE_ERROR_COPY_MAX_WIDTH).toBe(300);
    expect(BIDPLACE_PAGE_LOGO_SIZE).toBe(104);
    expect(infrastructurePageErrorLayout).toEqual({
      padX: designTokens.space.x5,
      clusterGap: designTokens.space.x8,
      clusterLift: designTokens.space.x8,
    });
  });
});

describe('infrastructure page visual', () => {
  it('keeps loading free of error chrome', () => {
    expect(infrastructurePageVisual('loading')).toEqual({
      showsErrorChrome: false,
    });
  });

  it('shows error chrome when the page is in error', () => {
    expect(infrastructurePageVisual('error')).toEqual({
      showsErrorChrome: true,
    });
  });
});

describe('infrastructurePageFetchStatus', () => {
  it('treats the initial pending fetch as loading', () => {
    expect(
      infrastructurePageFetchStatus({
        isPending: true,
        isFetching: true,
        isError: false,
      }),
    ).toBe('loading');
  });

  it('returns to loading when retrying after an error', () => {
    expect(
      infrastructurePageFetchStatus({
        isPending: false,
        isFetching: true,
        isError: true,
      }),
    ).toBe('loading');
  });

  it('keeps branded loading while a fetch is in flight without usable data', () => {
    expect(
      infrastructurePageFetchStatus({
        isPending: false,
        isFetching: true,
        isError: false,
      }),
    ).toBe('loading');
  });

  it('does not replace ready content with a background refetch', () => {
    expect(
      infrastructurePageFetchStatus({
        isPending: false,
        isFetching: true,
        isError: false,
        data: { curatorSelection: null },
      }),
    ).toBe('ready');
  });

  it('keeps usable content when a later fetch fails', () => {
    expect(
      infrastructurePageFetchStatus({
        isPending: false,
        isFetching: false,
        isError: true,
        data: { curatorSelection: null },
      }),
    ).toBe('ready');
  });

  it('settles on error only after fetching has stopped', () => {
    expect(
      infrastructurePageFetchStatus({
        isPending: false,
        isFetching: false,
        isError: true,
      }),
    ).toBe('error');
  });
});

describe('combineInfrastructurePageStatus', () => {
  it('prefers loading over error while a fetch is still in flight', () => {
    expect(combineInfrastructurePageStatus(['error', 'loading'])).toBe(
      'loading',
    );
  });
});
