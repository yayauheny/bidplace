import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useEffect,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import type { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { useVisibleViewport } from '../layout/use-visible-viewport';

import { FigmaGlassSurface } from './FigmaGlassSurface';

type DockLayerStyle = CSSProperties & {
  '--figma-dock-gap': string;
  '--figma-dock-padding': string;
};

export function FloatingDockFrame({
  bottom,
  children,
}: {
  bottom: number;
  blurTarget: RefObject<View | null>;
  children: ReactNode;
}) {
  const { height, layoutHeight } = useVisibleViewport();
  const [webHost, setWebHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setWebHost(document.body);
  }, []);

  if (!webHost) {
    return null;
  }

  const layerStyle: DockLayerStyle = {
    bottom,
    zIndex: designTokens.layer.dock,
    '--figma-dock-gap': `${designTokens.space.dockGap}px`,
    '--figma-dock-padding': `${designTokens.space.dockPad}px`,
  };

  return createPortal(
    <div
      className="figma-dock-layer"
      data-viewport-reduced={height < layoutHeight ? true : undefined}
      style={layerStyle}
    >
      <FigmaGlassSurface
        preset="navigation"
        testID="figma-floating-dock"
        accessibilityRole="navigation"
        accessibilityLabel="Основная навигация"
        contentClassName="figma-dock-items"
      >
        {children}
      </FigmaGlassSurface>
    </div>,
    webHost,
  );
}
