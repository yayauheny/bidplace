import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { designTokens } from '@bidplace/design-tokens';
import { FigmaTabs } from '../../components/figma/FigmaTabs';
import { useReducedMotion } from '../../lib/reduced-motion';
import { CreatorHero } from './CreatorHero';
import { AuthorShare } from './AuthorShare';
import type { CreatorHeaderProps } from './creator-header';

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
  transform: translate(
      calc(var(--handle-tx, 0px) * var(--creator-progress)),
      calc(var(--handle-ty, 0px) * var(--creator-progress))
    )
    scale(calc(1 + (var(--handle-scale, 1) - 1) * var(--creator-progress)));
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
.creator-header [data-testid^="creator-fade-"] {
  opacity: clamp(0, 1 - var(--creator-progress) * 2, 1);
}
.creator-header[data-progress="1"] [data-testid="creator-handle"] {
  width: var(--handle-width);
}
.creator-header[data-progress="1"] [data-testid="creator-handle"] > * {
  max-width: var(--handle-limit);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.creator-header:not([data-progress="0"]) [data-testid^="creator-fade-"] {
  pointer-events: none;
}
.creator-header[data-progress="1"] [data-testid^="creator-fade-"] {
  visibility: hidden;
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

function isScrollable(element: HTMLElement) {
  const overflowY = getComputedStyle(element).overflowY;
  return (
    (overflowY === 'auto' || overflowY === 'scroll') &&
    element.scrollHeight > element.clientHeight + 1
  );
}

function findScrollPort(): HTMLElement | null {
  const labeled = document.querySelector('[data-testid="creator-scroll"]');
  if (!(labeled instanceof HTMLElement)) {
    return null;
  }
  if (isScrollable(labeled)) {
    return labeled;
  }
  const nodes = labeled.querySelectorAll<HTMLElement>('*');
  for (const node of nodes) {
    if (isScrollable(node)) {
      return node;
    }
  }
  return labeled;
}

function progressBucket(progress: number) {
  if (progress <= 0) {
    return '0';
  }
  if (progress >= 1) {
    return '1';
  }
  return 'mid';
}

function resolvedProgress(raw: number, reduced: boolean) {
  const clamped = Math.min(1, Math.max(0, raw));
  return reduced ? (clamped >= 1 ? 1 : 0) : clamped;
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
      const h = box(handle, root);
      const c = box(actions, root);
      const x = designTokens.space.x5;
      const top = shift + designTokens.space.creatorCompactTop;
      const avatarSize = designTokens.size.creatorCompactAvatar;
      const handleScale =
        designTokens.typography.profileTab.fontSize /
        designTokens.typography.profileHandle.fontSize;
      const handleX = x + avatarSize + designTokens.space.x2;
      const actionsX = root.offsetWidth - x - c.width;
      shell.style.setProperty('--avatar-tx', `${x - a.x}px`);
      shell.style.setProperty('--avatar-ty', `${top - a.y}px`);
      shell.style.setProperty('--avatar-scale', String(avatarSize / a.width));
      shell.style.setProperty('--handle-tx', `${handleX - h.x}px`);
      shell.style.setProperty(
        '--handle-ty',
        `${top + (avatarSize - h.height * handleScale) / 2 - h.y}px`,
      );
      shell.style.setProperty('--handle-scale', String(handleScale));
      shell.style.setProperty('--handle-width', `${h.width}px`);
      shell.style.setProperty(
        '--handle-limit',
        `${Math.max(0, actionsX - designTokens.space.x3 - handleX) / handleScale}px`,
      );
      shell.style.setProperty('--actions-tx', `${actionsX - c.x}px`);
      shell.style.setProperty('--actions-ty', `${top - c.y}px`);
      shell.style.setProperty(
        '--atmosphere-ty',
        `${shift + designTokens.space.creatorCompactAtmosphereTop + designTokens.space.atmosphereOffset}px`,
      );
    };

    const applyScroll = (port: HTMLElement) => {
      const raw =
        offsetRef.current > 0 ? port.scrollTop / offsetRef.current : 0;
      const progress = resolvedProgress(raw, reduced);
      shell.style.setProperty('--creator-progress', String(progress));
      const next = progressBucket(progress);
      setBucket((current) => (current === next ? current : next));
    };

    writeTransforms();
    const port = findScrollPort();
    if (port) {
      applyScroll(port);
    }

    const resize = new ResizeObserver(() => {
      writeTransforms();
      const current = findScrollPort();
      if (current) {
        applyScroll(current);
      }
    });
    resize.observe(root);

    if (!port) {
      return () => resize.disconnect();
    }

    const onScroll = () => applyScroll(port);
    port.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      resize.disconnect();
      port.removeEventListener('scroll', onScroll);
    };
  }, [compactHeight, profile.slug, reduced]);

  return (
    <>
      <style>{motionCss}</style>
      <div
        ref={header}
        className="creator-header"
        data-testid="creator-sticky-header"
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
