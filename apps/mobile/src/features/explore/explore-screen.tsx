import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { BackHandler, Platform, ScrollView, View } from 'react-native';
import { designTokens, searchChromeTokens } from '@bidplace/design-tokens';
import { AppShell } from '../../components/layout';
import { PageColumn } from '../../components/layout/PageColumn';
import { PageScrollView } from '../../components/layout/PageScrollView';
import { navigateBack } from '../../components/layout/navigate-back';
import { FigmaTabs } from '../../components/figma/FigmaTabs';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '../search/search-query';
import { ExploreHeader } from './ExploreHeader';
import { ExploreFilters } from './ExploreFilters';
import { WorksPane } from './WorksPane';
import { AuthorsPane } from './AuthorsPane';
import { CategoriesPane } from './CategoriesPane';
import { exploreSections, isExploreSection } from './explore-route';
import { useExploreState } from './use-explore-state';

// Figma 7240:2492 / 7240:2652: fixed 52px header, rail stays in place.
export function ExploreScreen() {
  const router = useRouter();
  const explore = useExploreState();
  const { state } = explore;
  const scroller = useRef<ScrollView>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [chromeHeight, setChromeHeight] = useState(0);
  const active = state[state.section];
  const searchInput = useMemo(
    () => ({ section: state.section, q: active.q }),
    [state.section, active.q],
  );
  const debounced = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);
  const q = !active.q
    ? undefined
    : debounced.section === state.section
      ? debounced.q?.trim() || undefined
      : active.q.trim() || undefined;
  const scrollIdentity = JSON.stringify({ section: state.section, ...active });
  useEffect(() => {
    scroller.current?.scrollTo({
      y: explore.scroll[state.section] ?? 0,
      animated: false,
    });
  }, [scrollIdentity, state.section, explore.scroll]);
  useFocusEffect(
    useCallback(() => {
      const dismiss = () => {
        if (sheetOpen || !state.searchOpen) return false;
        explore.closeSearch();
        return true;
      };
      if (Platform.OS === 'web') {
        const key = (event: KeyboardEvent) => {
          if (!event.defaultPrevented && event.key === 'Escape' && dismiss()) {
            event.preventDefault();
            event.stopPropagation();
          }
        };
        window.addEventListener('keydown', key, true);
        return () => window.removeEventListener('keydown', key, true);
      }
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        dismiss,
      );
      return () => subscription.remove();
    }, [sheetOpen, state.searchOpen, explore.closeSearch]),
  );
  const controls = (
    <ExploreFilters
      key={state.section}
      state={state}
      onChange={(next) => explore.update(next, true)}
      onSheetOpenChange={setSheetOpen}
    />
  );
  return (
    <AppShell contentLayout="bleed">
      <PageColumn
        onLayout={(event) => setChromeHeight(event.nativeEvent.layout.height)}
        style={{
          paddingTop: designTokens.space.x1,
          gap: searchChromeTokens.railOffset,
        }}
      >
        <ExploreHeader
          open={state.searchOpen}
          query={active.q ?? ''}
          onChangeQuery={explore.changeQuery}
          onOpen={() => explore.update({ ...state, searchOpen: true })}
          onClose={explore.closeSearch}
          onBack={() => navigateBack(router, { fallbackHref: '/' })}
        />
        <FigmaTabs
          variant="segmented"
          tabs={exploreSections}
          value={state.section}
          label="Разделы Explore"
          panelId="explore-results"
          onChange={(section) => {
            if (isExploreSection(section)) explore.selectSection(section);
          }}
        />
      </PageColumn>
      <PageScrollView
        ref={scroller}
        variant="viewport"
        testID="explore-scroll"
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={(event) =>
          explore.saveScroll(event.nativeEvent.contentOffset.y)
        }
        onContentSizeChange={() =>
          scroller.current?.scrollTo({
            y: explore.scroll[state.section] ?? 0,
            animated: false,
          })
        }
        contentContainerStyle={{
          paddingTop: designTokens.space.x4,
          // Balance fixed chrome so the empty state centers in the full viewport.
          paddingBottom: chromeHeight + designTokens.space.x4,
          gap: designTokens.space.x5,
        }}
      >
        <View
          nativeID="explore-results"
          style={{ flexGrow: 1 }}
          {...(Platform.OS === 'web'
            ? ({
                role: 'tabpanel',
                'aria-labelledby': `explore-results-${state.section}`,
              } as object)
            : {})}
        >
          {state.section === 'works' ? (
            <WorksPane state={{ ...state.works, q }} controls={controls} />
          ) : state.section === 'authors' ? (
            <AuthorsPane state={{ ...state.authors, q }} controls={controls} />
          ) : (
            <CategoriesPane query={active.q ?? ''} />
          )}
        </View>
      </PageScrollView>
    </AppShell>
  );
}
