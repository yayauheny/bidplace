import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { designTokens } from '@bidplace/design-tokens';
import { FigmaTabs } from '../../components/figma/FigmaTabs';
import { CreatorHero } from './CreatorHero';
import { AuthorShare } from './AuthorShare';
import type { CreatorHeaderProps } from './creator-header';
import {
  CREATOR_GEOMETRY_FALLBACK_MS,
  CREATOR_GEOMETRY_MS,
  CREATOR_HEADER_EASING,
  CREATOR_HANDOFF_HYSTERESIS,
  creatorHandleLayout,
  creatorHeaderStateFromScroll,
  creatorIdentityClipInsets,
  creatorWebCompactStack,
  findScrollBoundary,
  measureCompactActionsWidth,
  readCurrentScrollTop,
  scrollTopFromEvent,
} from './creator-header-motion';

const motionCss = `
@property --creator-progress {
  syntax: "<number>";
  inherits: true;
  initial-value: 0;
}
@property --creator-geometry {
  syntax: "<number>";
  inherits: true;
  initial-value: 0;
}
.creator-header {
  --creator-progress: 0;
  --creator-geometry: 0;
}
.creator-header[data-state="compact"] {
  --creator-progress: 1;
}
.creator-header [data-testid="creator-identity"] {
  --creator-identity-clip-top: 0px;
  --creator-identity-clip-bottom: 0px;
  clip-path: none;
}
.creator-header[data-state="compact"] [data-testid="creator-identity"] {
  clip-path: inset(
    var(--creator-identity-clip-top)
    0
    var(--creator-identity-clip-bottom)
    0
  );
}
.creator-header[data-geometry="1"] {
  --creator-geometry: 1;
}
.creator-header [data-testid="creator-avatar"],
.creator-header [data-testid="creator-handle"],
.creator-header [data-testid="creator-actions"],
.creator-header [data-testid="author-atmosphere"] {
  transform-origin: top left;
  will-change: transform;
}
.creator-header [data-testid="creator-avatar"] {
  transform: translate(0px, 0px) scale(1);
}
.creator-header[data-state="compact"] [data-testid="creator-avatar"] {
  transition: transform ${CREATOR_GEOMETRY_MS}ms ${CREATOR_HEADER_EASING};
}
.creator-header[data-state="compact"][data-geometry="1"] [data-testid="creator-avatar"] {
  transform: translate(var(--avatar-tx, 0px), var(--avatar-ty, 0px))
    scale(var(--avatar-scale, 1));
}
.creator-header [data-testid="creator-handle"] {
  align-self: flex-start !important;
  width: fit-content !important;
  max-width: 100% !important;
  margin-left: var(--handle-ml, 0px);
  white-space: nowrap;
  overflow: hidden;
  transform: translate(0px, 0px) scale(1);
  font-family: Inter_600SemiBold, Inter, sans-serif;
  font-size: 24px;
  line-height: 29px;
  font-weight: calc(600 - 100 * var(--creator-progress));
}
.creator-header[data-state="compact"] [data-testid="creator-handle"] {
  min-width: 0 !important;
  max-width: var(--handle-compact-max, 100%) !important;
  transition: transform ${CREATOR_GEOMETRY_MS}ms ${CREATOR_HEADER_EASING};
}
.creator-header[data-state="compact"][data-geometry="1"] [data-testid="creator-handle"] {
  transform: translate(var(--handle-tx, 0px), var(--handle-ty, 0px))
    scale(var(--handle-scale, 1));
}
.creator-header [data-testid="creator-handle"] > * {
  max-width: none !important;
  overflow: visible !important;
  text-overflow: clip !important;
  white-space: nowrap;
  font-family: inherit !important;
  font-size: inherit !important;
  line-height: inherit !important;
  font-weight: inherit !important;
}
.creator-header[data-state="compact"] [data-testid="creator-handle"] > * {
  max-width: 100% !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}
.creator-header[data-progress="1"] [data-testid="creator-handle"] {
  font-family: Inter_500Medium, Inter, sans-serif;
}
.creator-header[data-progress="1"] [data-testid="author-header"] {
  overflow: hidden !important;
}
.creator-header [data-testid="creator-actions"] {
  transform: translate(0px, 0px);
}
.creator-header[data-state="compact"] [data-testid="creator-actions"] {
  transition: transform ${CREATOR_GEOMETRY_MS}ms ${CREATOR_HEADER_EASING};
}
.creator-header[data-state="compact"][data-geometry="1"] [data-testid="creator-actions"] {
  transform: translate(var(--actions-tx, 0px), var(--actions-ty, 0px));
}
@media (prefers-reduced-motion: reduce) {
  .creator-header[data-state="compact"] [data-testid="creator-avatar"],
  .creator-header[data-state="compact"] [data-testid="creator-handle"],
  .creator-header[data-state="compact"] [data-testid="creator-actions"] {
    transition: none;
  }
}
.creator-header [data-testid="author-atmosphere"] {
  transform: translateY(calc(var(--atmosphere-ty, 0px) * var(--creator-progress)));
}
.creator-header [data-testid^="creator-fade-"],
.creator-header [data-testid="creator-social-overflow"] {
  opacity: 1;
  transition: opacity ${CREATOR_GEOMETRY_MS}ms ${CREATOR_HEADER_EASING};
}
.creator-header[data-state="compact"] [data-testid^="creator-fade-"],
.creator-header[data-state="compact"] [data-testid="creator-social-overflow"] {
  opacity: 0;
  pointer-events: none;
}
@media (prefers-reduced-motion: reduce) {
  .creator-header [data-testid^="creator-fade-"],
  .creator-header [data-testid="creator-social-overflow"] {
    transition: none;
  }
}
.creator-header[data-progress="1"] [data-testid^="creator-fade-"] {
  visibility: hidden;
}
.creator-header[data-progress="1"] [data-testid="creator-social-overflow"] {
  visibility: hidden;
  width: 0 !important;
  min-width: 0 !important;
  height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden;
  pointer-events: none;
}
`;

function box(element: HTMLElement, root: HTMLElement) {
  let x = 0;
  let y = 0;
  let current: HTMLElement | null = element;
  while (current && current !== root) {
    x += current.offsetLeft;
    y += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }
  return { x, y, width: element.offsetWidth, height: element.offsetHeight };
}

function prefersReducedMotion() {
  return (
    typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function isGeometryNode(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const testId = target.dataset.testid;
  return (
    testId === 'creator-avatar' ||
    testId === 'creator-handle' ||
    testId === 'creator-actions'
  );
}

function restoreOverflowFocus(root: HTMLElement) {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) {
    return;
  }
  const overflow = root.querySelectorAll(
    '[data-testid="creator-social-overflow"]',
  );
  for (const node of overflow) {
    if (node.contains(active)) {
      root
        .querySelector<HTMLElement>('[aria-label="Поделиться профилем"]')
        ?.focus();
      return;
    }
  }
}

export function CreatorHeader({
  profile,
  tabs,
  tab,
  onTabChange,
  panelId,
}: CreatorHeaderProps) {
  const header = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLDivElement>(null);
  const stateRef = useRef<'expanded' | 'compact'>('expanded');
  const handleLayoutCache = useRef<{
    parentX: number;
    parentWidth: number;
    intrinsicWidth: number;
    intrinsicY: number;
  } | null>(null);
  const heroHeightRef = useRef(0);
  const handoffOffsetRef = useRef(0);
  const releasingRef = useRef(false);
  const geometryPlayedRef = useRef(false);
  const finalizeTimerRef = useRef(0);
  const finalizeExpandedRef = useRef(() => {});
  const scrollTopRef = useRef(0);
  const [height, setHeight] = useState(0);
  const [state, setState] = useState<'expanded' | 'compact'>('expanded');
  const [settled, setSettled] = useState<'expanded' | 'compact'>('expanded');
  const [geometryPlayed, setGeometryPlayed] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const compactStack = creatorWebCompactStack();
  const offset = Math.max(0, height - compactStack);

  useLayoutEffect(() => {
    const root = hero.current;
    const shell = header.current;
    if (!root || !shell) {
      return;
    }
    handleLayoutCache.current = null;

    const writeClip = (scrollTop: number) => {
      const { clipTop, clipBottom } = creatorIdentityClipInsets({
        scrollTop,
        handoffOffset: handoffOffsetRef.current,
        heroHeight: heroHeightRef.current || root.offsetHeight,
        identityHeight: compactStack,
      });
      root.style.setProperty('--creator-identity-clip-top', `${clipTop}px`);
      root.style.setProperty('--creator-identity-clip-bottom', `${clipBottom}px`);
    };

    const writeTransforms = () => {
      const expandedHeight = root.offsetHeight;
      heroHeightRef.current = expandedHeight;
      handoffOffsetRef.current = Math.max(0, expandedHeight - compactStack);
      setHeight(expandedHeight);
      const shift = handoffOffsetRef.current;
      writeClip(scrollTopRef.current);
      const avatar = root.querySelector<HTMLElement>(
        '[data-testid="creator-avatar"]',
      );
      const handle = root.querySelector<HTMLElement>(
        '[data-testid="creator-handle"]',
      );
      const actions = root.querySelector<HTMLElement>(
        '[data-testid="creator-actions"]',
      );
      if (!avatar || !handle || !actions) {
        return;
      }
      const a = box(avatar, root);
      const compactActionsWidth = measureCompactActionsWidth(actions);
      const x = designTokens.space.x5;
      const top = shift + designTokens.space.x3;
      const avatarSize = designTokens.size.creatorCompactAvatar;
      const handleX = x + avatarSize + designTokens.space.x2;
      const actionsX = root.offsetWidth - x - compactActionsWidth;
      const parent = handle.parentElement;
      const parentBox = parent ? box(parent, root) : { x: 0, width: 0 };
      const parentWidth = parent?.clientWidth ?? handle.offsetWidth;
      if (stateRef.current === 'expanded' && !releasingRef.current) {
        handleLayoutCache.current = {
          parentX: parentBox.x,
          parentWidth,
          intrinsicWidth: Math.max(handle.scrollWidth, handle.offsetWidth),
          intrinsicY: box(handle, root).y,
        };
      }
      const cached = handleLayoutCache.current ?? {
        parentX: parentBox.x,
        parentWidth,
        intrinsicWidth: Math.max(handle.scrollWidth, handle.offsetWidth),
        intrinsicY: box(handle, root).y,
      };
      const motion = creatorHandleLayout({
        parentX: cached.parentX,
        parentWidth: cached.parentWidth,
        intrinsicWidth: cached.intrinsicWidth,
        intrinsicY: cached.intrinsicY,
        compactLeft: handleX,
        compactTop: top,
        compactAvatarSize: avatarSize,
        compactHeight: designTokens.typography.profileHandleCompact.lineHeight,
        compactMaxWidth: Math.max(
          0,
          actionsX - designTokens.space.x3 - handleX,
        ),
        expandedFontSize: designTokens.typography.profileHandle.fontSize,
        compactFontSize: designTokens.typography.profileHandleCompact.fontSize,
      });
      shell.style.setProperty('--avatar-tx', `${x - a.x}px`);
      shell.style.setProperty('--avatar-ty', `${top - a.y}px`);
      shell.style.setProperty('--avatar-scale', String(avatarSize / a.width));
      shell.style.setProperty('--handle-tx', `${motion.tx}px`);
      shell.style.setProperty('--handle-ty', `${motion.ty}px`);
      shell.style.setProperty('--handle-scale', String(motion.scale));
      shell.style.setProperty('--handle-ml', `${motion.marginLeft}px`);
      shell.style.setProperty(
        '--handle-compact-max',
        `${motion.compactLayoutWidth}px`,
      );
      shell.style.setProperty('--actions-tx', `${actionsX - box(actions, root).x}px`);
      shell.style.setProperty('--actions-ty', `${top - box(actions, root).y}px`);
      shell.style.setProperty(
        '--atmosphere-ty',
        `${shift + designTokens.space.creatorCompactAtmosphereTop + designTokens.space.atmosphereOffset}px`,
      );
    };

    const finishSettle = (next: 'expanded' | 'compact') => {
      setSettled(next);
      if (next === 'compact') {
        restoreOverflowFocus(root);
      }
    };

    const setGeometry = (next: boolean) => {
      geometryPlayedRef.current = next;
      setGeometryPlayed(next);
    };

    const finalizeExpanded = () => {
      if (stateRef.current !== 'expanded') {
        return;
      }
      window.clearTimeout(finalizeTimerRef.current);
      finalizeTimerRef.current = 0;
      releasingRef.current = false;
      setReleasing(false);
      setGeometry(false);
      setState('expanded');
      finishSettle('expanded');
    };
    finalizeExpandedRef.current = finalizeExpanded;

    const applyState = (next: 'expanded' | 'compact') => {
      if (next === stateRef.current) {
        return;
      }
      stateRef.current = next;
      window.clearTimeout(finalizeTimerRef.current);
      finalizeTimerRef.current = 0;
      if (next === 'compact') {
        const wasReleasing = releasingRef.current;
        releasingRef.current = false;
        setReleasing(false);
        setState('compact');
        finishSettle('compact');
        setGeometry(wasReleasing || geometryPlayedRef.current);
        return;
      }
      if (!geometryPlayedRef.current || prefersReducedMotion()) {
        finalizeExpanded();
        return;
      }
      releasingRef.current = true;
      setReleasing(true);
      setGeometry(false);
    };

    const applyScroll = (scrollTop: number) => {
      scrollTopRef.current = scrollTop;
      applyState(
        creatorHeaderStateFromScroll(scrollTop, stateRef.current, {
          collapseAt: handoffOffsetRef.current,
          expandAt: Math.max(
            0,
            handoffOffsetRef.current - CREATOR_HANDOFF_HYSTERESIS,
          ),
        }),
      );
      writeClip(scrollTop);
    };

    writeTransforms();
    const boundary = findScrollBoundary(shell);
    if (boundary) {
      applyScroll(readCurrentScrollTop(boundary));
    }

    const resize = new ResizeObserver(() => {
      writeTransforms();
      const current = findScrollBoundary(shell);
      if (current) {
        applyScroll(readCurrentScrollTop(current));
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
      window.clearTimeout(finalizeTimerRef.current);
    };
  }, [compactStack, profile.slug]);

  useLayoutEffect(() => {
    const shell = header.current;
    if (!shell || state !== 'compact' || geometryPlayed || releasing) {
      return;
    }
    if (prefersReducedMotion()) {
      geometryPlayedRef.current = true;
      setGeometryPlayed(true);
      return;
    }
    const frame = requestAnimationFrame(() => {
      geometryPlayedRef.current = true;
      setGeometryPlayed(true);
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [state, geometryPlayed, releasing]);

  useLayoutEffect(() => {
    const shell = header.current;
    if (!shell || !releasing || prefersReducedMotion()) {
      return;
    }
    const onEnd = (event: TransitionEvent) => {
      if (event.propertyName !== 'transform' || !isGeometryNode(event.target)) {
        return;
      }
      finalizeExpandedRef.current();
    };
    shell.addEventListener('transitionend', onEnd);
    finalizeTimerRef.current = window.setTimeout(() => {
      finalizeExpandedRef.current();
    }, CREATOR_GEOMETRY_FALLBACK_MS);
    return () => {
      shell.removeEventListener('transitionend', onEnd);
      window.clearTimeout(finalizeTimerRef.current);
      finalizeTimerRef.current = 0;
    };
  }, [releasing]);

  return (
    <>
      <style>{motionCss}</style>
      <div
        ref={header}
        className="creator-header"
        data-testid="creator-sticky-header"
        data-scroll-binding="capture-boundary"
        data-state={state}
        data-compact={settled === 'compact'}
        data-progress={settled === 'compact' ? '1' : '0'}
        data-geometry={geometryPlayed ? '1' : '0'}
        data-releasing={releasing ? '1' : '0'}
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
          data-testid="creator-identity"
          style={{ position: 'relative' }}
        >
          <CreatorHero
            profile={profile}
            compact={settled === 'compact'}
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
    </>
  );
}
