import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import { authKeys, commerceKeys, replaceAuthenticatedSession } from '../../lib/query-cache';
import { commitOutbidToggle } from './use-outbid-email';

describe('outbid email toggle', () => {
  it('rolls back a failed save and drops a save from the previous account', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(authKeys.session, { id: 'user-a' });
    queryClient.setQueryData(commerceKeys.notificationSettings(), {
      outbidEmail: true,
    });

    const rolled = await commitOutbidToggle({
      queryClient,
      next: false,
      update: async () => {
        throw new Error('offline');
      },
    });
    expect(rolled).toBe('rolled-back');
    expect(queryClient.getQueryData(commerceKeys.notificationSettings())).toEqual({
      outbidEmail: true,
    });

    let release: (() => void) | undefined;
    const pending = commitOutbidToggle({
      queryClient,
      next: false,
      update: () =>
        new Promise((resolve) => {
          release = () => resolve({ outbidEmail: false });
        }),
    });
    await Promise.resolve();
    expect(queryClient.getQueryData(commerceKeys.notificationSettings())).toEqual({
      outbidEmail: false,
    });
    await replaceAuthenticatedSession(queryClient, { id: 'user-b' });
    queryClient.setQueryData(commerceKeys.notificationSettings(), {
      outbidEmail: true,
    });
    release?.();
    await expect(pending).resolves.toBe('dropped');
    expect(queryClient.getQueryData(commerceKeys.notificationSettings())).toEqual({
      outbidEmail: true,
    });
  });
});
