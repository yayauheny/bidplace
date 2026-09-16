import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { designTokens } from '@bidplace/design-tokens';
import { FigmaTabs } from '../../components/figma/FigmaTabs';
import { CreatorHero } from './CreatorHero';
import { AuthorShare } from './AuthorShare';
import type { CreatorHeaderProps } from './creator-header';
import {
  CREATOR_WEB_COMPACT_STACK,
  creatorHandoffThresholds,
  creatorHeaderStateFromScroll,
  findScrollBoundary,
  readCurrentScrollTop,
  scrollTopFromEvent,
} from './creator-header-motion';

export function CreatorHeader({
  profile,
  tabs,
  tab,
  onTabChange,
  panelId,
}: CreatorHeaderProps) {
  const header = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLDivElement>(null);
  const compactRef = useRef(false);
  const heroHeightRef = useRef(0);
  const [heroHeight, setHeroHeight] = useState(0);
  const [compact, setCompact] = useState(false);
  const offset = Math.max(0, heroHeight - CREATOR_WEB_COMPACT_STACK);

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
        ref={hero}
        style={{
          position: 'relative',
          height: compact && heroHeight ? heroHeight : undefined,
        }}
      >
        <CreatorHero
          profile={profile}
          compact={compact}
          actions={<AuthorShare sharePath={profile.sharePath} />}
        />
      </div>
      <FigmaTabs
        tabs={tabs}
        value={tab}
        onChange={onTabChange}
        label="Профиль автора"
        panelId={panelId}
        align="center"
      />
    </div>
  );
}
