import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';
import { WorkGallery } from '../../components/figma/WorkGallery';
import { FigmaTabs } from '../../components/figma/FigmaTabs';
import { FigmaIconButton } from '../../components/figma/FigmaIconButton';
import { FigmaGlassSurface } from '../../components/figma/FigmaGlassSurface';
import { useReducedMotion } from '../../lib/reduced-motion';
import type { WorkHeaderProps } from './work-header';
import { WorkIdentity } from './WorkIdentity';
import {
  WORK_HEADER_EASING,
  WORK_HEADER_TRANSITION_MS,
  findWorkScrollBoundary,
  readWorkScrollTop,
  workHeaderScrollTopFromEvent,
  workHeaderStateFromScroll,
  workWebCompactStack,
} from './work-header-motion';

const motionCss = `
@property --work-progress {
  syntax: "<number>";
  inherits: true;
  initial-value: 0;
}
.work-header {
  --work-progress: 0;
  transition: --work-progress ${WORK_HEADER_TRANSITION_MS}ms ${WORK_HEADER_EASING};
}
.work-header[data-state="compact"] {
  --work-progress: 1;
}
@media (prefers-reduced-motion: reduce) {
  .work-header {
    transition: none;
  }
}
.work-header [data-testid="work-gallery"] {
  position: relative;
  z-index: 3;
}
.work-header [data-testid="work-gallery-chrome"] {
  transform: translateY(calc(var(--chrome-ty, 0px) * var(--work-progress)));
}
.work-header [data-testid="work-compact-slot"] {
  z-index: 1;
  opacity: var(--work-progress);
  pointer-events: none;
}
.work-header[data-progress="1"] [data-testid="work-hero"] {
  overflow: hidden !important;
}
`;

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
  const stateRef = useRef<'expanded' | 'compact'>('expanded');
  const [height, setHeight] = useState(0);
  const [state, setState] = useState<'expanded' | 'compact'>('expanded');
  const [settled, setSettled] = useState<'expanded' | 'compact'>('expanded');
  const reduced = useReducedMotion();
  const compactStack = workWebCompactStack();
  const shift = Math.max(0, height - compactStack);
  const identityHidden = settled === 'compact';

  useLayoutEffect(() => {
    const shell = header.current;
    if (!shell) {
      return;
    }

    let settleTimer: ReturnType<typeof setTimeout> | undefined;

    const finishSettle = (next: 'expanded' | 'compact') => {
      setSettled(next);
    };

    const applyState = (next: 'expanded' | 'compact') => {
      if (next === stateRef.current) {
        return;
      }
      stateRef.current = next;
      setState(next);
      clearTimeout(settleTimer);
      if (reduced || next === 'expanded') {
        finishSettle(next);
        return;
      }
      settleTimer = setTimeout(() => {
        finishSettle(stateRef.current);
      }, WORK_HEADER_TRANSITION_MS);
    };

    const applyScroll = (scrollTop: number) => {
      applyState(workHeaderStateFromScroll(scrollTop, stateRef.current));
    };

    const onTransitionEnd = (event: TransitionEvent) => {
      if (
        event.target !== shell ||
        !event.propertyName.includes('work-progress')
      ) {
        return;
      }
      clearTimeout(settleTimer);
      finishSettle(stateRef.current);
    };

    shell.addEventListener('transitionend', onTransitionEnd);
    const boundary = findWorkScrollBoundary(shell);
    if (boundary) {
      applyScroll(readWorkScrollTop(boundary));
    }

    if (!boundary) {
      return () => {
        clearTimeout(settleTimer);
        shell.removeEventListener('transitionend', onTransitionEnd);
      };
    }

    const onScroll = (event: Event) => {
      const scrollTop = workHeaderScrollTopFromEvent(event, boundary);
      if (scrollTop === null) {
        return;
      }
      applyScroll(scrollTop);
    };
    boundary.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(settleTimer);
      shell.removeEventListener('transitionend', onTransitionEnd);
      boundary.removeEventListener('scroll', onScroll);
    };
  }, [reduced]);

  return (
    <>
      <style>{motionCss}</style>
      <div
        ref={header}
        className="work-header"
        data-testid="work-sticky-header"
        data-state={state}
        data-compact={settled === 'compact'}
        data-progress={settled === 'compact' ? '1' : '0'}
        style={
          {
            position: 'sticky',
            top: -shift,
            zIndex: 2,
            width: '100%',
            minWidth: 0,
            background: designTokens.color.canvas,
            ['--chrome-ty' as string]: `${shift}px`,
          } as CSSProperties
        }
      >
        <View
          testID="work-hero"
          onLayout={(event) => {
            const next = Math.round(event.nativeEvent.layout.height);
            setHeight((prev) => (prev === next ? prev : next));
          }}
          style={{
            position: 'relative',
            width: '100%',
            minWidth: 0,
            gap: designTokens.space.sectionGap,
            paddingBottom: designTokens.space.x10,
          }}
        >
          <WorkGallery
            images={images}
            label={title}
            leadingAction={
              <FigmaGlassSurface
                preset="controlGroup"
                contentStyle={{ padding: designTokens.space.socialGroupY }}
              >
                <FigmaIconButton
                  icon="arrow-left-01"
                  iconSize={designTokens.size.socialGroupIcon}
                  label="Назад"
                  onPress={onBack}
                />
              </FigmaGlassSurface>
            }
            action={
              <FigmaGlassSurface
                preset="controlGroup"
                contentStyle={{ padding: designTokens.space.socialGroupY }}
              >
                <FigmaIconButton
                  icon="share-04"
                  iconSize={designTokens.size.socialGroupIcon}
                  label="Поделиться работой"
                  onPress={onShare}
                />
              </FigmaGlassSurface>
            }
          />
          <div
            data-testid="work-identity-shell"
            aria-hidden={identityHidden ? true : undefined}
            ref={(node) => {
              if (!node) {
                return;
              }
              if (identityHidden) {
                node.setAttribute('inert', '');
                return;
              }
              node.removeAttribute('inert');
            }}
          >
            <View style={{ paddingHorizontal: designTokens.space.pageGutter }}>
              <WorkIdentity
                title={title}
                authorName={authorName}
                authorHref={authorHref}
                chips={chips}
              />
            </View>
          </div>
          <View
            testID="work-compact-slot"
            aria-hidden
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: compactStack,
              backgroundColor: designTokens.color.canvas,
            }}
          />
        </View>
        <FigmaTabs
          tabs={tabs}
          value={tab}
          onChange={onTabChange}
          label="Информация о работе"
          panelId={panelId}
        />
      </div>
    </>
  );
}
