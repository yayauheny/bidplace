import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { SEARCH_DOCK_BUTTON_ID } from '../../components/figma/floating-dock';
import { SearchOverlay } from './SearchOverlay';
import { useSearchOverlay } from './search-overlay-provider';

export function SearchOverlayHost() {
  const { isOpen, state, close, replaceSession } = useSearchOverlay();
  const restoreOpener = useRef(false);

  useEffect(() => {
    if (isOpen || Platform.OS !== 'web' || !restoreOpener.current) return;
    restoreOpener.current = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.getElementById(SEARCH_DOCK_BUTTON_ID)?.focus();
      });
    });
  }, [isOpen]);

  const dismiss = () => {
    restoreOpener.current = true;
    close();
  };

  if (!isOpen) return null;

  return (
    <SearchOverlay
      initialQuery={state.query}
      initialTab={state.tab}
      onDismiss={dismiss}
      onSessionChange={replaceSession}
    />
  );
}
