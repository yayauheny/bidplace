import { useEffect, useRef, useState } from 'react';
import { Platform, View, type LayoutChangeEvent } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';

import { AppText, TextButton } from '../../components/ui';
import { AUTH_TURNSTILE_UNAVAILABLE_COPY } from '../../errors';
import { getTurnstileSiteKey } from '../../lib/environment';
import { loadTurnstileApi, type TurnstileAction, type TurnstileApi } from './turnstile-script';

export type TurnstileAvailability = 'ready' | 'unavailable';

type TurnstileWidgetProps = {
  action: TurnstileAction;
  onToken: (token: string | null) => void;
  onAvailability: (availability: TurnstileAvailability) => void;
};

type Phase = 'loading' | 'ready' | 'unavailable';
type WidgetSize = 'compact' | 'flexible';

type WidgetHandle = {
  id?: string;
  removed: boolean;
  failed: boolean;
  api?: TurnstileApi;
};

const FLEXIBLE_MIN_WIDTH = 300;
const FLEXIBLE_MIN_HEIGHT = 65;
const COMPACT_MIN_HEIGHT = 140;
const TURNSTILE_LOADING_COPY = 'Загрузка проверки безопасности…';
const TURNSTILE_RETRY_LABEL = 'Повторить';
const CLEANUP_FAILED = 'Turnstile widget cleanup failed';

function canRenderTurnstile(): boolean {
  return Platform.OS === 'web' && Boolean(getTurnstileSiteKey());
}

function sizeForWidth(width: number): WidgetSize {
  return width < FLEXIBLE_MIN_WIDTH ? 'compact' : 'flexible';
}

function reportCleanupFailure(): void {
  console.error(CLEANUP_FAILED);
}

export function TurnstileWidget({ action, onToken, onAvailability }: TurnstileWidgetProps) {
  const host = useRef<View>(null);
  const apiRef = useRef<TurnstileApi | null>(null);
  const tokenHandler = useRef(onToken);
  const availabilityHandler = useRef(onAvailability);
  const [attempt, setAttempt] = useState(0);
  const [widgetSize, setWidgetSize] = useState<WidgetSize | null>(null);
  const [phase, setPhase] = useState<Phase>(() => (canRenderTurnstile() ? 'loading' : 'unavailable'));
  tokenHandler.current = onToken;
  availabilityHandler.current = onAvailability;
  const interactive = canRenderTurnstile();

  const onFrameLayout = (event: LayoutChangeEvent) => {
    if (!canRenderTurnstile()) return;
    const width = event.nativeEvent.layout.width;
    if (width <= 0) return;
    const next = sizeForWidth(width);
    setWidgetSize((current) => (current === next ? current : next));
  };

  useEffect(() => {
    if (!canRenderTurnstile()) {
      tokenHandler.current(null);
      availabilityHandler.current('unavailable');
      setPhase('unavailable');
      return;
    }

    const siteKey = getTurnstileSiteKey();
    if (!siteKey) {
      tokenHandler.current(null);
      availabilityHandler.current('unavailable');
      setPhase('unavailable');
      return;
    }
    if (!widgetSize) {
      tokenHandler.current(null);
      setPhase('loading');
      return;
    }

    setPhase('loading');
    tokenHandler.current(null);

    const handle: WidgetHandle = { removed: false, failed: false };

    function markUnavailable(): void {
      if (handle.removed || handle.failed) return;
      handle.failed = true;
      tokenHandler.current(null);
      availabilityHandler.current('unavailable');
      setPhase('unavailable');
    }

    function removeWidget(id: string): boolean {
      if (!handle.api) return true;
      try {
        handle.api.remove(id);
        return true;
      } catch {
        if (handle.removed || handle.failed) reportCleanupFailure();
        else markUnavailable();
        return false;
      }
    }

    function failClosed(): void {
      if (handle.removed || handle.failed) return;
      const id = handle.id;
      handle.id = undefined;
      if (id && !removeWidget(id)) return;
      markUnavailable();
    }

    function clearAndReset(): void {
      if (handle.removed || handle.failed || !handle.id || !handle.api) {
        if (!handle.removed && !handle.failed) markUnavailable();
        return;
      }
      tokenHandler.current(null);
      try {
        handle.api.reset(handle.id);
      } catch {
        const id = handle.id;
        handle.id = undefined;
        if (id && !removeWidget(id)) return;
        markUnavailable();
      }
    }

    function acceptToken(token: string): void {
      if (handle.removed || handle.failed) return;
      if (token.length === 0) {
        tokenHandler.current(null);
        return;
      }
      tokenHandler.current(token);
    }

    function renderProvider(
      loaded: TurnstileApi,
      node: HTMLElement,
      publicSiteKey: string,
      size: WidgetSize,
    ): void {
      handle.api = loaded;
      apiRef.current = loaded;
      let renderedId = '';
      try {
        renderedId = loaded.render(node, {
          sitekey: publicSiteKey,
          action,
          language: 'ru',
          size,
          callback: acceptToken,
          'error-callback': () => {
            if (handle.removed) return;
            failClosed();
          },
          'expired-callback': clearAndReset,
          'timeout-callback': clearAndReset,
        });
      } catch {
        markUnavailable();
        return;
      }
      if (handle.removed || handle.failed) {
        if (renderedId.length > 0) removeWidget(renderedId);
        return;
      }
      if (renderedId.length === 0) {
        markUnavailable();
        return;
      }
      handle.id = renderedId;
      availabilityHandler.current('ready');
      setPhase('ready');
    }

    const node = host.current;
    const cached = apiRef.current;
    if (cached && node instanceof HTMLElement) {
      renderProvider(cached, node, siteKey, widgetSize);
      return () => {
        handle.removed = true;
        tokenHandler.current(null);
        const id = handle.id;
        handle.id = undefined;
        if (id && !removeWidget(id)) return;
      };
    }

    void loadTurnstileApi()
      .then((loaded) => {
        apiRef.current = loaded;
        if (handle.removed) return;
        if (!(host.current instanceof HTMLElement)) {
          markUnavailable();
          return;
        }
        renderProvider(loaded, host.current, siteKey, widgetSize);
      })
      .catch(() => {
        markUnavailable();
      });

    return () => {
      handle.removed = true;
      tokenHandler.current(null);
      const id = handle.id;
      handle.id = undefined;
      if (id && !removeWidget(id)) return;
    };
  }, [action, attempt, widgetSize]);

  const frameStyle =
    widgetSize === 'compact'
      ? { width: '100%' as const, maxWidth: '100%' as const, minHeight: COMPACT_MIN_HEIGHT }
      : widgetSize === 'flexible'
        ? { width: '100%' as const, maxWidth: '100%' as const, minHeight: FLEXIBLE_MIN_HEIGHT }
        : { width: '100%' as const, maxWidth: '100%' as const };

  return (
    <View
      accessibilityLabel="Проверка безопасности"
      onLayout={onFrameLayout}
      style={{ width: '100%', maxWidth: '100%', gap: designTokens.auth.formGap }}
    >
      <View ref={host} style={interactive ? frameStyle : undefined} />
      {phase === 'loading' ? <AppText role="bodySmall">{TURNSTILE_LOADING_COPY}</AppText> : null}
      {phase === 'unavailable' ? (
        <AppText accessibilityLiveRegion="polite" role="bodySmall" tone="danger">
          {AUTH_TURNSTILE_UNAVAILABLE_COPY}
        </AppText>
      ) : null}
      {phase === 'unavailable' && interactive ? (
        <TextButton
          label={TURNSTILE_RETRY_LABEL}
          onPress={() => {
            setAttempt((current) => current + 1);
          }}
        />
      ) : null}
    </View>
  );
}
