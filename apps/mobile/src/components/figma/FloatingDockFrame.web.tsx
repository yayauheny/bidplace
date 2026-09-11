import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useEffect,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import type { View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

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
  const [webHost, setWebHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setWebHost(document.body);
  }, []);

  if (!webHost) {
    return null;
  }

  const layerStyle: DockLayerStyle = {
    bottom,
    '--figma-dock-gap': `${figmaTokens.space.dockGap}px`,
    '--figma-dock-padding': `${figmaTokens.space.dockPad}px`,
  };

  return createPortal(
    <div className="figma-dock-layer" style={layerStyle}>
      <FigmaGlassSurface
        preset="navigation"
        testID="figma-floating-dock"
        accessibilityRole="tablist"
        accessibilityLabel="Основная навигация"
        contentClassName="figma-dock-items"
      >
        {children}
      </FigmaGlassSurface>
    </div>,
    webHost,
  );
}
