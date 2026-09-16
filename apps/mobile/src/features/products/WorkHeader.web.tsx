import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { designTokens } from '@bidplace/design-tokens';
import { WorkGallery } from '../../components/figma/WorkGallery';
import { FigmaTabs } from '../../components/figma/FigmaTabs';
import { controlLayoutTransition } from '../../lib/layout-transition';
import {
  findScrollBoundary,
  readCurrentScrollTop,
  scrollTopFromEvent,
  stickyHeaderStateFromScroll,
  workHandoffThresholds,
} from '../../lib/sticky-handoff';
import {
  WorkBackControl,
  WorkCompactNav,
  WorkShareControl,
} from './WorkActions';
import { WORK_SCROLL_TEST_ID, type WorkHeaderProps } from './work-header';
import { WorkIdentity } from './WorkIdentity';

export function WorkHeader({
  images,
  title,
  authorName,
  authorHref,
  chips,
  tabs,
  tab,
  onTabChange,
  panelId,
  onBack,
  onShare,
}: WorkHeaderProps) {
  const header = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLDivElement>(null);
  const compactRef = useRef(false);
  const heroHeightRef = useRef(0);
  const [heroHeight, setHeroHeight] = useState(0);
  const [compact, setCompact] = useState(false);
  const offset = Math.max(0, heroHeight);

  useLayoutEffect(() => {
    const shell = header.current;
    const root = hero.current;
    if (!shell || !root) {
      return;
    }

    const measure = () => {
      const next = root.offsetHeight;
      heroHeightRef.current = next;
      setHeroHeight((prev) => (prev === next ? prev : next));
    };

    const applyScroll = (scrollTop: number) => {
      const { collapseAt, expandAt } = workHandoffThresholds(
        heroHeightRef.current || root.offsetHeight,
      );
      const next = stickyHeaderStateFromScroll(
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
    const boundary = findScrollBoundary(shell, WORK_SCROLL_TEST_ID);
    if (boundary) {
      boundary.style.overflowAnchor = 'none';
      const port = [
        boundary,
        ...boundary.querySelectorAll<HTMLElement>('*'),
      ].find((node) => node.scrollHeight > node.clientHeight + 1);
      if (port) {
        port.style.overflowAnchor = 'none';
      }
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
  }, [title]);

  return (
    <div
      ref={header}
      data-testid="work-sticky-header"
      data-state={compact ? 'compact' : 'expanded'}
      style={
        {
          position: 'sticky',
          top: -offset,
          zIndex: 2,
          background: designTokens.color.canvas,
          overflowAnchor: 'none',
        } as CSSProperties
      }
    >
      <div ref={hero} data-testid="work-hero" style={{ position: 'relative' }}>
        <WorkGallery
          images={images}
          label={title}
          leadingAction={
            compact ? undefined : <WorkBackControl onPress={onBack} />
          }
          action={compact ? undefined : <WorkShareControl onPress={onShare} />}
        />
        <View
          style={{
            paddingHorizontal: designTokens.space.pageGutter,
            paddingTop: designTokens.space.sectionGap,
            paddingBottom: designTokens.space.x10,
          }}
        >
          <WorkIdentity
            title={title}
            authorName={authorName}
            authorHref={authorHref}
            chips={chips}
          />
        </View>
      </div>
      {compact ? (
        <WorkCompactNav onBack={onBack} onShare={onShare} />
      ) : null}
      <Animated.View
        testID="work-sticky-tabs"
        layout={controlLayoutTransition}
      >
        <FigmaTabs
          tabs={tabs}
          value={tab}
          onChange={onTabChange}
          label="Информация о работе"
          panelId={panelId}
          contentInset={designTokens.space.pageGutter}
        />
      </Animated.View>
    </div>
  );
}
