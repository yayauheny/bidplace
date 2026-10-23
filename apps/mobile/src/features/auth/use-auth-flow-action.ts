import { useEffect, useRef, useState } from 'react';
import { useIsFocused, useNavigation } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '@bidplace/contracts';
import {
  authKeys,
  currentAuthEpoch,
  readAuthEpoch,
} from '../../lib/query-cache';
import { authRequestMessage, getUserFacingErrorMessage } from '../../errors';

// Owns transport lifetime for anonymous flow forms and provider navigation.
export function useAuthFlowAction() {
  const queryClient = useQueryClient();
  const focused = useIsFocused();
  const navigation = useNavigation();
  const active = useRef(focused);
  const flight = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  active.current = focused;
  const cancel = () => {
    flight.current?.abort();
    flight.current = null;
    setBusy(false);
  };
  useEffect(() => {
    active.current = focused;
    const blur = navigation.addListener('blur', () => {
      active.current = false;
      flight.current?.abort();
    });
    return () => {
      active.current = false;
      flight.current?.abort();
      blur();
    };
  }, [navigation, focused]);
  useEffect(() => {
    if (!focused) flight.current?.abort();
    else if (!flight.current || flight.current.signal.aborted) setBusy(false);
  }, [focused]);
  async function run<T>(
    work: (signal: AbortSignal) => Promise<T>,
    accept: (result: T, isCurrent: () => boolean) => void | Promise<void>,
  ) {
    if (flight.current && !flight.current.signal.aborted) return;
    if (!active.current) return;
    const controller = new AbortController();
    flight.current = controller;
    const epoch = currentAuthEpoch(queryClient);
    setBusy(true);
    setError(null);
    const owns = () =>
      active.current &&
      !controller.signal.aborted &&
      flight.current === controller;
    try {
      const result = await work(controller.signal);
      if (!owns()) return;
      const canAccept = () => {
        if (!owns()) return false;
        const now = readAuthEpoch(queryClient);
        const installed = queryClient.getQueryData<User | null>(
          authKeys.session,
        );
        const installedOwnLogin =
          now.id === epoch + 2 &&
          now.writesOpen &&
          result &&
          typeof result === 'object' &&
          'user' in result &&
          (result.user as User | undefined)?.id === installed?.id;
        return now.id === epoch || Boolean(installedOwnLogin);
      };
      if (!canAccept()) return;
      await accept(result, canAccept);
    } catch (failure) {
      if (owns() && currentAuthEpoch(queryClient) === epoch)
        setError(
          authRequestMessage(failure) ??
            getUserFacingErrorMessage(
              failure,
              'Не удалось завершить действие. Повторите попытку.',
            ),
        );
    } finally {
      if (flight.current === controller) {
        flight.current = null;
        if (active.current) setBusy(false);
      }
    }
  }
  return { busy, error, run, cancel, setError };
}
