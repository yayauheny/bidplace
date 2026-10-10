export const TURNSTILE_SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export const TURNSTILE_SCRIPT_TIMEOUT_MS = 10_000;

export type TurnstileAction = 'login' | 'register' | 'password_reset' | 'email_verification';

type TurnstileRenderOptions = {
  sitekey: string;
  action: TurnstileAction;
  language: 'ru';
  size: 'compact' | 'flexible';
  callback: (token: string) => void;
  'error-callback': () => void;
  'expired-callback': () => void;
  'timeout-callback': () => void;
};

export type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId?: string) => void;
};

type TurnstileWindow = Window & { turnstile?: TurnstileApi };

type InflightLoad = {
  promise: Promise<TurnstileApi>;
  script: HTMLScriptElement;
};

const LOAD_FAILED = 'Turnstile script failed to load';

let inflight: InflightLoad | null = null;

function turnstileWindow(): TurnstileWindow {
  return window;
}

function loadFailure(error: unknown): Error {
  return error instanceof Error ? error : new Error(LOAD_FAILED);
}

function loadTurnstileScript(): Promise<TurnstileApi> {
  const ready = turnstileWindow().turnstile;
  if (ready) return Promise.resolve(ready);
  if (inflight) return inflight.promise;

  const script = document.createElement('script');
  script.async = true;
  let active = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let rejectLoad: ((error: Error) => void) | undefined;

  const promise = new Promise<TurnstileApi>((resolve, reject) => {
    active = true;
    rejectLoad = reject;
    timer = setTimeout(() => {
      fail(new Error('Turnstile script timed out'));
    }, TURNSTILE_SCRIPT_TIMEOUT_MS);

    function fail(error: Error): void {
      if (!active) return;
      active = false;
      if (inflight?.script === script) inflight = null;
      if (timer) clearTimeout(timer);
      script.onload = null;
      script.onerror = null;
      script.remove();
      reject(error);
    }

    script.onload = () => {
      if (!active) return;
      active = false;
      if (timer) clearTimeout(timer);
      if (inflight?.script === script) inflight = null;
      script.onload = null;
      script.onerror = null;
      const api = turnstileWindow().turnstile;
      if (!api) {
        script.remove();
        reject(new Error('Turnstile API did not load'));
        return;
      }
      resolve(api);
    };

    script.onerror = () => {
      fail(new Error(LOAD_FAILED));
    };
  });

  inflight = { promise, script };
  try {
    if (!document.head) throw new Error(LOAD_FAILED);
    document.head.append(script);
    script.src = TURNSTILE_SCRIPT_URL;
  } catch (error) {
    if (inflight?.script !== script) return promise;
    inflight = null;
    active = false;
    if (timer) clearTimeout(timer);
    script.onload = null;
    script.onerror = null;
    script.remove();
    if (rejectLoad) rejectLoad(loadFailure(error));
  }
  return promise;
}

export function loadTurnstileApi(): Promise<TurnstileApi> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error(LOAD_FAILED));
  }
  try {
    return loadTurnstileScript();
  } catch (error) {
    if (inflight) inflight = null;
    return Promise.reject(loadFailure(error));
  }
}
