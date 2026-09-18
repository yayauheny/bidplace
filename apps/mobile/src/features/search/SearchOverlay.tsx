import { useId, useState } from 'react';
import { Platform, ScrollView } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { useDismissibleOverlay } from '../../components/layout/use-dismissible-overlay';
import { useOverlayFocusTrap } from '../../components/layout/use-overlay-focus-trap';
import { AuthorsSearchPane } from './panes/AuthorsSearchPane';
import { CategoriesSearchPane } from './panes/CategoriesSearchPane';
import { WorksSearchPane } from './panes/WorksSearchPane';
import { SearchOverlayHeader } from './SearchOverlayHeader';
import { SearchOverlaySurface } from './search-overlay-surface';
import {
  SEARCH_DEBOUNCE_MS,
  searchRequestQuery,
  useDebouncedValue,
} from './search-query';
import {
  SEARCH_OVERLAY_DEFAULT_TAB,
  searchOverlayTabPanelId,
  type SearchOverlayTab,
} from './search-overlay-tabs';

export function SearchOverlay({
  initialQuery,
  onDismiss,
  onSelect,
}: {
  initialQuery: string;
  onDismiss: () => void;
  onSelect: () => void;
}) {
  const surfaceId = `search-overlay-${useId()}`;
  const [query, setQuery] = useState(initialQuery);
  const [tab, setTab] = useState<SearchOverlayTab>(SEARCH_OVERLAY_DEFAULT_TAB);
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const requestQuery = searchRequestQuery(debouncedQuery);
  const { restoreFocus } = useOverlayFocusTrap({
    open: true,
    surfaceId,
    restoreOnClose: false,
  });

  const dismiss = () => {
    restoreFocus();
    onDismiss();
  };

  useDismissibleOverlay({
    open: true,
    onClose: dismiss,
    getSurfaces: () => [
      Platform.OS === 'web' ? document.getElementById(surfaceId) : null,
    ],
  });

  return (
    <SearchOverlaySurface surfaceId={surfaceId} onClose={dismiss}>
      <SearchOverlayHeader
        query={query}
        onChangeQuery={setQuery}
        tab={tab}
        onChangeTab={setTab}
        onClose={dismiss}
      />
      <ScrollView
        nativeID={searchOverlayTabPanelId(tab)}
        style={{ flex: 1, marginTop: figmaTokens.space.x4 }}
        contentContainerStyle={{
          paddingBottom: figmaTokens.space.x5,
          gap: figmaTokens.space.x3,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {tab === 'categories' ? (
          <CategoriesSearchPane query={query} onSelect={onSelect} />
        ) : null}
        {tab === 'authors' ? (
          <AuthorsSearchPane query={requestQuery} onSelect={onSelect} />
        ) : null}
        {tab === 'works' ? (
          <WorksSearchPane query={requestQuery} onSelect={onSelect} />
        ) : null}
      </ScrollView>
    </SearchOverlaySurface>
  );
}
