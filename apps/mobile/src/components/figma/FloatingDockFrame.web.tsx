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

type DockCssProperties = CSSProperties & {
  '--figma-dock-background': string;
  '--figma-dock-blur': string;
  '--figma-dock-border-start': string;
  '--figma-dock-border-end': string;
  '--figma-dock-gap': string;
  '--figma-dock-padding': string;
  '--figma-dock-radius': string;
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

  const glassStyle: DockCssProperties = {
    '--figma-dock-background': figmaTokens.color.glass,
    '--figma-dock-blur': `${figmaTokens.blur.dock}px`,
    '--figma-dock-border-start': figmaTokens.color.glassBorder,
    '--figma-dock-border-end': figmaTokens.color.glassBorderEnd,
    '--figma-dock-gap': `${figmaTokens.space.dockGap}px`,
    '--figma-dock-padding': `${figmaTokens.space.dockPad}px`,
    '--figma-dock-radius': `${figmaTokens.radius.dock}px`,
  };

  return createPortal(
    <div className="figma-dock-layer" style={{ bottom }}>
      <div
        className="figma-dock-glass"
        data-testid="figma-floating-dock"
        role="tablist"
        aria-label="Основная навигация"
        style={glassStyle}
      >
        {children}
      </div>
    </div>,
    webHost,
  );
}
