import { createContext, useContext, type ReactNode } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

import { hasDesktopNavigation } from './header-chrome';

const PublicNavigationContext = createContext(false);

export function PublicNavigationProvider({
  children,
}: {
  children: ReactNode;
}) {
  return <PublicNavigationContext value>{children}</PublicNavigationContext>;
}

export function useDesktopNavigation() {
  const isPublic = useContext(PublicNavigationContext);
  const { width } = useWindowDimensions();
  return hasDesktopNavigation(Platform.OS, width, isPublic);
}
