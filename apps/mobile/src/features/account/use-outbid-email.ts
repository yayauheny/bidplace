import type { NotificationSettings } from '@bidplace/contracts';
import type { QueryClient } from '@tanstack/react-query';

import {
  canWritePrivateCache,
  commerceKeys,
  currentAuthEpoch,
} from '../../lib/query-cache';

export async function commitOutbidToggle(input: {
  queryClient: QueryClient;
  next: boolean;
  update: (value: boolean) => Promise<NotificationSettings>;
}): Promise<'saved' | 'rolled-back' | 'dropped'> {
  const epoch = currentAuthEpoch(input.queryClient);
  if (!canWritePrivateCache(input.queryClient, epoch)) return 'dropped';
  const key = commerceKeys.notificationSettings();
  const previous = input.queryClient.getQueryData<NotificationSettings>(key);
  input.queryClient.setQueryData(key, { outbidEmail: input.next });
  try {
    const saved = await input.update(input.next);
    if (!canWritePrivateCache(input.queryClient, epoch)) return 'dropped';
    input.queryClient.setQueryData(key, saved);
    return 'saved';
  } catch {
    if (!canWritePrivateCache(input.queryClient, epoch)) return 'dropped';
    if (previous === undefined) {
      input.queryClient.removeQueries({ queryKey: key, exact: true });
    } else {
      input.queryClient.setQueryData(key, previous);
    }
    return 'rolled-back';
  }
}
