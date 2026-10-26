import type { WorkViewMode } from '../../components/figma/WorkViewToggle';
import { useEffect, useRef, useState } from 'react';
import {
  useLocalSearchParams,
  useNavigation,
  useRoute,
  useRouter,
} from 'expo-router';
import {
  closeExploreSearch,
  exploreHref,
  exploreParams,
  parseExploreRoute,
  type ExploreRoute,
  type ExploreSection,
} from './explore-route';

type ExploreSession = {
  state: ExploreRoute;
  workView: WorkViewMode;
  scroll: Partial<Record<ExploreSection, number>>;
};
// Navigation entries own drafts/offsets; server pages stay in React Query.
const sessions = new Map<string, ExploreSession>();
export function exploreSearchHref() {
  return exploreHref({
    ...parseExploreRoute({}),
    searchOpen: true,
  });
}
export function useExploreState() {
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const router = useRouter();
  const { key: entryKey } = useRoute();
  const route = parseExploreRoute(params);
  const urlKey = JSON.stringify(exploreParams(route));
  const [session, setSession] = useState<ExploreSession>(() => {
    const saved = sessions.get(entryKey);
    return saved
      ? {
          ...saved,
          state: {
            ...saved.state,
            section: route.section,
            searchOpen: route.searchOpen,
            [route.section]: route[route.section],
          },
        }
      : { state: route, scroll: {}, workView: 'compact' };
  });
  const writtenUrl = useRef<string | undefined>(undefined);
  const current = useRef(session);
  current.current = session;
  useEffect(() => {
    if (writtenUrl.current === urlKey) {
      writtenUrl.current = undefined;
      return;
    }
    const incoming = parseExploreRoute(JSON.parse(urlKey));
    setSession((previous) => ({
      ...previous,
      state: {
        ...previous.state,
        section: incoming.section,
        searchOpen: incoming.searchOpen,
        [incoming.section]: incoming[incoming.section],
      },
    }));
  }, [urlKey]);
  useEffect(() => {
    sessions.set(entryKey, session);
    // Discard entries removed from this navigator's history.
    const stack = navigation.getState();
    if (!stack) return;
    const keys = new Set(stack.routes.map((item) => item.key));
    for (const key of sessions.keys()) if (!keys.has(key)) sessions.delete(key);
  }, [entryKey, navigation, session]);
  const update = (state: ExploreRoute, resetScroll = false) => {
    const next = {
      ...current.current,
      state,
      scroll: resetScroll
        ? { ...current.current.scroll, [state.section]: 0 }
        : current.current.scroll,
    };
    current.current = next;
    sessions.set(entryKey, next);
    setSession(next);
    const serialized = exploreParams(state);
    writtenUrl.current = JSON.stringify(serialized);
    router.setParams(serialized);
  };
  return {
    state: session.state,
    workView: session.workView,
    setWorkView: (workView: WorkViewMode) => {
      const next = {
        ...current.current,
        workView,
        scroll: { ...current.current.scroll, works: 0 },
      };
      current.current = next;
      sessions.set(entryKey, next);
      setSession(next);
    },
    update,
    selectSection: (section: ExploreSection) =>
      update({ ...session.state, section }),
    closeSearch: () =>
      update(
        closeExploreSearch(session.state),
        Boolean(session.state[session.state.section].q),
      ),
    changeQuery: (q: string) =>
      update(
        {
          ...session.state,
          [session.state.section]: {
            ...session.state[session.state.section],
            q,
          },
        },
        true,
      ),
    scroll: session.scroll,
    saveScroll: (offset: number) => {
      const value = current.current;
      value.scroll[value.state.section] = offset;
      sessions.set(entryKey, value);
    },
  };
}
