import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';
import { WorkGallery } from '../../components/figma/WorkGallery';
import { FigmaTabs } from '../../components/figma/FigmaTabs';
import { StickyDockActionRow } from '../../components/figma/StickyDockActionRow';
import { StickyDockSurface } from '../../components/figma/StickyDockSurface';
import { stickyDockTabsStyle } from '../../components/figma/sticky-dock-action-row';
import { WorkBackControl, WorkShareControl } from './WorkActions';
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
  children,
}: WorkHeaderProps) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [dockSurfaceActive, setDockSurfaceActive] = useState(false);

  useLayoutEffect(() => {
    const marker = sentinel.current;
    if (!marker) {
      return;
    }
    const root = marker.closest(`[data-testid="${WORK_SCROLL_TEST_ID}"]`);
    if (!(root instanceof HTMLElement)) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) {
          return;
        }
        const next = !entry.isIntersecting;
        setDockSurfaceActive((prev) => (prev === next ? prev : next));
      },
      {
        root,
        rootMargin: `-${designTokens.stickyDock.actionHeight}px 0px 0px 0px`,
        threshold: 0,
      },
    );
    observer.observe(marker);
    return () => observer.disconnect();
  }, [title]);

  return (
    <div
      data-testid="work-sticky-header"
      data-state={dockSurfaceActive ? 'docked' : 'overlay'}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          width: '100%',
          minWidth: 0,
        }}
      >
        <div style={{ gridRow: 1, gridColumn: 1, minWidth: 0, zIndex: 0 }}>
          <WorkGallery images={images} label={title} />
        </div>
        <div style={{ gridRow: 2, gridColumn: 1, minWidth: 0, zIndex: 0 }}>
          <View
            style={{
              paddingTop: designTokens.space.sectionGap,
              paddingBottom: designTokens.space.x10,
              paddingHorizontal: designTokens.space.pageGutter,
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
        <div
          ref={sentinel}
          data-testid="work-dock-sentinel"
          style={{
            gridRow: 3,
            gridColumn: 1,
            // 1px IO target, zero flow height, 2px above tabs so the
            // actionHeight inset clears when tabs dock.
            height: 1,
            marginBottom: -1,
            position: 'relative',
            top: -2,
            pointerEvents: 'none',
          }}
        />
        <div
          data-testid="work-sticky-tabs"
          style={
            {
              gridRow: 4,
              gridColumn: 1,
              minWidth: 0,
              ...stickyDockTabsStyle(),
            } as CSSProperties
          }
        >
          <FigmaTabs
            tabs={tabs}
            value={tab}
            onChange={onTabChange}
            label="Информация о работе"
            panelId={panelId}
            contentInset={designTokens.space.pageGutter}
          />
        </div>
        <div
          style={{
            gridRow: 5,
            gridColumn: 1,
            minWidth: 0,
            paddingTop: designTokens.space.sectionGap,
            zIndex: 0,
          }}
        >
          {children}
        </div>
        <div
          data-testid="sticky-dock-surface-host"
          style={{
            gridRow: '1 / -1',
            gridColumn: 1,
            position: 'sticky',
            top: 0,
            alignSelf: 'start',
            height: designTokens.stickyDock.fullHeight,
            zIndex: designTokens.layer.chrome - 1,
            pointerEvents: 'none',
          }}
        >
          <StickyDockSurface active={dockSurfaceActive} />
        </div>
        <div
          style={{
            gridRow: '1 / -1',
            gridColumn: 1,
            position: 'sticky',
            top: 0,
            alignSelf: 'start',
            zIndex: designTokens.layer.chrome,
            pointerEvents: 'none',
          }}
        >
          <StickyDockActionRow testID="work-sticky-actions">
            <WorkBackControl onPress={onBack} />
            <WorkShareControl onPress={onShare} />
          </StickyDockActionRow>
        </div>
      </div>
    </div>
  );
}
