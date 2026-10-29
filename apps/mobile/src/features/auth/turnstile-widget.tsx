import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { getTurnstileSiteKey } from '../../lib/environment';
import { loadTurnstileApi, type TurnstileAction } from './turnstile-script';

const PROOF_TIMEOUT_MS = 10_000;

export function useInvisibleTurnstile(action: TurnstileAction) {
  const mounted = useRef(false);
  const pending = useRef<(() => void) | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      pending.current?.();
    };
  }, [action]);

  const getToken = useCallback(
    (signal?: AbortSignal): Promise<string | null> => {
      pending.current?.();
      const sitekey = getTurnstileSiteKey();
      if (
        !mounted.current ||
        signal?.aborted ||
        Platform.OS !== 'web' ||
        !sitekey
      ) {
        return Promise.resolve(null);
      }
      return new Promise((resolve) => {
        let settled = false;
        let dispose: (() => void) | undefined;
        const finish = (token: string | null) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          signal?.removeEventListener('abort', cancel);
          if (pending.current === cancel) pending.current = null;
          dispose?.();
          resolve(token);
        };
        const cancel = () => finish(null);
        const timer = setTimeout(cancel, PROOF_TIMEOUT_MS);
        pending.current = cancel;
        signal?.addEventListener('abort', cancel, { once: true });
        void loadTurnstileApi()
          .then((api) => {
            if (settled) return;
            const host = document.createElement('div');
            host.dataset.invisibleTurnstile = action;
            document.body.append(host);
            let id: string | undefined;
            dispose = () => {
              if (id) {
                try {
                  api.remove(id);
                } catch {
                  console.error('Turnstile widget cleanup failed');
                }
              }
              host.remove();
            };
            try {
              id = api.render(host, {
                sitekey,
                action,
                language: 'ru',
                execution: 'execute',
                retry: 'never',
                'refresh-expired': 'manual',
                callback: (token) => finish(token || null),
                'error-callback': cancel,
                'expired-callback': cancel,
                'timeout-callback': cancel,
              });
              if (settled) {
                dispose();
                return;
              }
              if (!id) {
                finish(null);
                return;
              }
              api.execute(id);
            } catch {
              finish(null);
            }
          })
          .catch(cancel);
      });
    },
    [action],
  );
  return { getToken };
}
