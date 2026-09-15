import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { designTokens } from '@bidplace/design-tokens';
import { FigmaTabs } from '../../components/figma/FigmaTabs';
import { useReducedMotion } from '../../lib/reduced-motion';
import { CreatorHero } from './CreatorHero';
import { AuthorShare } from './AuthorShare';
import type { CreatorHeaderProps } from './creator-header';
import {
  creatorHandleLayout,
  findScrollBoundary,
  measureCompactActionsWidth,
  progressBucket,
  progressFromScroll,
  readCurrentScrollTop,
  scrollTopFromEvent,
} from './creator-header-motion';

const motionCss = `
.creator-header {
  --creator-progress: 0;
}
.creator-header [data-testid="creator-avatar"],
.creator-header [data-testid="creator-handle"],
.creator-header [data-testid="creator-actions"],
.creator-header [data-testid="author-atmosphere"] {
  transform-origin: top left;
  will-change: transform;
}
.creator-header [data-testid="creator-avatar"] {
  transform: translate(
      calc(var(--avatar-tx, 0px) * var(--creator-progress)),
      calc(var(--avatar-ty, 0px) * var(--creator-progress))
    )
    scale(calc(1 + (var(--avatar-scale, 1) - 1) * var(--creator-progress)));
}
.creator-header [data-testid="creator-handle"] {
  align-self: flex-start !important;
  width: fit-content !important;
  margin-left: var(--handle-ml, 0px);
  white-space: nowrap;
  max-width: calc(
    var(--handle-expanded-width, 100%) -
      var(--handle-clip, 0px) * var(--creator-progress)
  );
  overflow: hidden;
  transform: translate(
      calc(var(--handle-tx, 0px) * var(--creator-progress)),
      calc(var(--handle-ty, 0px) * var(--creator-progress))
    )
    scale(
      calc(1 + (var(--handle-scale, 1) - 1) * var(--creator-progress))
    );
  font-family: Inter_600SemiBold, Inter, sans-serif;
  font-size: 24px;
  line-height: 29px;
  font-weight: calc(600 - 100 * var(--creator-progress));
}
.creator-header [data-testid="creator-handle"] > * {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: inherit !important;
  font-size: inherit !important;
  line-height: inherit !important;
  font-weight: inherit !important;
}
.creator-header[data-progress="1"] [data-testid="creator-handle"] {
  font-family: Inter_500Medium, Inter, sans-serif;
}
.creator-header [data-testid="creator-actions"] {
  transform: translate(
    calc(var(--actions-tx, 0px) * var(--creator-progress)),
    calc(var(--actions-ty, 0px) * var(--creator-progress))
  );
}
.creator-header [data-testid="author-atmosphere"] {
  transform: translateY(calc(var(--atmosphere-ty, 0px) * var(--creator-progress)));
}
.creator-header [data-testid^="creator-fade-"],
.creator-header [data-testid="creator-social-overflow"] {
  opacity: clamp(0, 1 - var(--creator-progress) * 2, 1);
}
.creator-header:not([data-progress="0"]) [data-testid^="creator-fade-"],
.creator-header:not([data-progress="0"]) [data-testid="creator-social-overflow"] {
  pointer-events: none;
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
  const offsetRef = useRef(0);
  const [height, setHeight] = useState(0);
  const [bucket, setBucket] = useState<'0' | 'mid' | '1'>('0');
  const reduced = useReducedMotion();
  const compactHeight = designTokens.size.creatorCompactHeader;
  const offset = Math.max(0, height - compactHeight);
  offsetRef.current = offset;

  useLayoutEffect(() => {
    const root = hero.current;
    const shell = header.current;
    if (!root || !shell) {
      return;
    }

    const writeTransforms = () => {
      const expandedHeight = root.offsetHeight;
      setHeight(expandedHeight);
      const shift = Math.max(0, expandedHeight - compactHeight);
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
      const top = shift + designTokens.space.creatorCompactTop;
      const avatarSize = designTokens.size.creatorCompactAvatar;
      const handleX = x + avatarSize + designTokens.space.x2;
      const actionsX = root.offsetWidth - x - compactActionsWidth;
      const parent = handle.parentElement;
      const parentBox = parent ? box(parent, root) : { x: 0, width: 0 };
      const parentWidth = parent?.clientWidth ?? handle.offsetWidth;
      const motion = creatorHandleLayout({
        parentX: parentBox.x,
        parentWidth,
        intrinsicWidth: Math.max(handle.scrollWidth, handle.offsetWidth),
        intrinsicY: box(handle, root).y,
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
        '--handle-expanded-width',
        `${motion.width}px`,
      );
      shell.style.setProperty('--handle-clip', `${motion.clipLayout}px`);
      shell.style.setProperty('--actions-tx', `${actionsX - box(actions, root).x}px`);
      shell.style.setProperty('--actions-ty', `${top - box(actions, root).y}px`);
      shell.style.setProperty(
        '--atmosphere-ty',
        `${shift + designTokens.space.creatorCompactAtmosphereTop + designTokens.space.atmosphereOffset}px`,
      );
    };

    const applyScroll = (scrollTop: number) => {
      const progress = progressFromScroll(
        scrollTop,
        offsetRef.current,
        reduced,
      );
      shell.style.setProperty('--creator-progress', String(progress));
      const next = progressBucket(progress);
      if (next === '1') {
        restoreOverflowFocus(root);
      }
      setBucket((current) => (current === next ? current : next));
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
      return () => resize.disconnect();
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
  }, [compactHeight, profile.slug, reduced]);

  return (
    <>
      <style>{motionCss}</style>
      <div
        ref={header}
        className="creator-header"
        data-testid="creator-sticky-header"
        data-scroll-binding="capture-boundary"
        data-compact={bucket === '1'}
        data-progress={bucket}
        style={
          {
            position: 'sticky',
            top: -offset,
            zIndex: 2,
            background: designTokens.color.canvas,
          } as CSSProperties
        }
      >
        <div ref={hero} style={{ position: 'relative' }}>
          <CreatorHero
            profile={profile}
            compact={bucket === '1'}
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
