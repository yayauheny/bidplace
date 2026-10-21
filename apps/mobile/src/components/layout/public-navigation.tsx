import { createContext, useContext, type ReactNode } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

import { hasDesktopNavigation } from './header-chrome';

const PublicNavigationContext = createContext(false);
const PageChromeContext = createContext({ desktop: false, dock: true });

export const PageChromeProvider = PageChromeContext.Provider;
export function usePageDesktopChrome() {
  return useContext(PageChromeContext).desktop;
}

export function usePageDockVisible() {
  return useContext(PageChromeContext).dock;
}

export function useWideLayout() {
  const { width } = useWindowDimensions();
  return hasDesktopNavigation(Platform.OS, width, true);
}

export function PublicNavigationProvider({
  children,
}: {
  children: ReactNode;
}) {
  return <PublicNavigationContext value>{children}</PublicNavigationContext>;
}

export function useDesktopNavigation() {
  const isPublic = useContext(PublicNavigationContext);
  const wide = useWideLayout();
  return isPublic && wide;
}
