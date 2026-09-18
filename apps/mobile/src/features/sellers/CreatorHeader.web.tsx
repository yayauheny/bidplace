import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { designTokens } from '@bidplace/design-tokens';
import { FigmaTabs } from '../../components/figma/FigmaTabs';
import { StickyDockActionRow } from '../../components/figma/StickyDockActionRow';
import { StickyDockSurface } from '../../components/figma/StickyDockSurface';
import { WorkBackControl } from '../products/WorkActions';
import { CreatorHero } from './CreatorHero';
import { AuthorShare } from './AuthorShare';
import type { CreatorHeaderProps } from './creator-header';
import { revealTabPanelStartIfAbove } from '../../lib/reveal-tab-panel';
import {
  CREATOR_SCROLL_TEST_ID,
  creatorHandoffThresholds,
  creatorHeaderStateFromScroll,
  findScrollBoundary,
  readCurrentScrollTop,
  scrollTopFromEvent,
} from './creator-header-motion';

const creatorDockLayer = {
  surface: 0,
  content: 1,
  tabs: 2,
} as const;

export function CreatorHeader({
  profile,
  onBack,
  tabs,
  tab,
  onTabChange,
  panelId,
}: CreatorHeaderProps) {
  const header = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLDivElement>(null);
  const previousTab = useRef(tab);
  const compactRef = useRef(false);
  const heroHeightRef = useRef(0);
  const [heroHeight, setHeroHeight] = useState(0);
  const [compact, setCompact] = useState(false);
  const offset = Math.max(
    0,
    heroHeight - designTokens.stickyDock.actionHeight,
  );

  useLayoutEffect(() => {
    const shell = header.current;
    const root = hero.current;
    if (!shell || !root) {
      return;
    }

    const measure = () => {
      if (compactRef.current) {
        return;
      }
      const next = root.offsetHeight;
      heroHeightRef.current = next;
      setHeroHeight((prev) => (prev === next ? prev : next));
    };

    const applyScroll = (scrollTop: number) => {
      const { collapseAt, expandAt } = creatorHandoffThresholds(
        heroHeightRef.current || root.offsetHeight,
      );
      const next = creatorHeaderStateFromScroll(
        scrollTop,
        compactRef.current ? 'compact' : 'expanded',
        { collapseAt, expandAt },
      );
      const isCompact = next === 'compact';
      if (isCompact === compactRef.current) {
        return;
      }
      compactRef.current = isCompact;
      setCompact(isCompact);
    };

    measure();
    const boundary = findScrollBoundary(shell);
    if (boundary) {
      applyScroll(readCurrentScrollTop(boundary));
    }

    const resize = new ResizeObserver(() => {
      measure();
      if (boundary) {
        applyScroll(readCurrentScrollTop(boundary));
      }
    });
    resize.observe(root);
    if (boundary) {
      resize.observe(boundary);
    }

    if (!boundary) {
      return () => {
        resize.disconnect();
      };
    }

    const onScroll = (event: Event) => {
      applyScroll(scrollTopFromEvent(event, boundary));
    };
    boundary.addEventListener('scroll', onScroll, {
      capture: true,
      passive: true,
    });
    return () => {
      resize.disconnect();
      boundary.removeEventListener('scroll', onScroll, { capture: true });
    };
  }, [profile.slug]);

  useLayoutEffect(() => {
    if (previousTab.current === tab) {
      return;
    }
    previousTab.current = tab;
    const panel =
      document.getElementById(panelId) ??
      document.querySelector('[data-testid="author-content"]');
    const tabs = header.current?.querySelector('[role="tablist"]');
    if (!(tabs instanceof HTMLElement)) {
      return;
    }
    revealTabPanelStartIfAbove({
      from: panel ?? tabs,
      scrollTestId: CREATOR_SCROLL_TEST_ID,
      panel,
      desiredTop: tabs.getBoundingClientRect().bottom,
    });
  }, [tab, panelId]);

  return (
    <div
      ref={header}
      data-testid="creator-sticky-header"
      data-state={compact ? 'compact' : 'expanded'}
      style={
        {
          position: 'sticky',
          top: -offset,
          zIndex: 2,
          background: designTokens.color.canvas,
        } as CSSProperties
      }
    >
      <div
        data-testid="sticky-dock-surface-host"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: designTokens.stickyDock.fullHeight,
          pointerEvents: 'none',
          zIndex: creatorDockLayer.surface,
        }}
      >
        <StickyDockSurface active={compact} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: compact ? offset : 0,
          zIndex: designTokens.layer.chrome,
          pointerEvents: 'none',
        }}
      >
        <StickyDockActionRow testID="creator-sticky-actions">
          <WorkBackControl testID="author-back" onPress={onBack} />
        </StickyDockActionRow>
      </div>
      <div
        ref={hero}
        style={{
          position: 'relative',
          zIndex: creatorDockLayer.content,
          height: compact && heroHeight ? heroHeight : undefined,
        }}
      >
        <CreatorHero
          profile={profile}
          compact={compact}
          actions={<AuthorShare sharePath={profile.sharePath} />}
        />
      </div>
      <div style={{ position: 'relative', zIndex: creatorDockLayer.tabs }}>
        <FigmaTabs
          tabs={tabs}
          value={tab}
          onChange={onTabChange}
          label="Профиль автора"
          panelId={panelId}
          align="center"
        />
      </div>
    </div>
  );
}
