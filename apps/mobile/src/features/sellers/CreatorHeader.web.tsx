import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { designTokens } from '@bidplace/design-tokens';
import { FigmaTabs } from '../../components/figma/FigmaTabs';
import { useReducedMotion } from '../../lib/reduced-motion';
import { CreatorHero } from './CreatorHero';
import { AuthorShare } from './AuthorShare';
import type { CreatorHeaderProps } from './creator-header';

const motionCss = `
.creator-header [data-testid="creator-avatar"],
.creator-header [data-testid="creator-handle"],
.creator-header [data-testid="creator-actions"],
.creator-header [data-testid="author-atmosphere"] {
  transform-origin: top left;
  transition: transform var(--creator-duration) ease;
}
.creator-header[data-compact="true"] [data-testid="creator-avatar"] { transform: var(--avatar-transform); }
.creator-header[data-compact="true"] [data-testid="creator-handle"] { transform: var(--handle-transform); width: var(--handle-width); }
.creator-header[data-compact="true"] [data-testid="creator-handle"] > * { max-width: var(--handle-limit); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.creator-header[data-compact="true"] [data-testid="creator-actions"] { transform: var(--actions-transform); }
.creator-header[data-compact="true"] [data-testid="author-atmosphere"] { transform: var(--atmosphere-transform); }
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

export function CreatorHeader({
  profile,
  tabs,
  tab,
  onTabChange,
  panelId,
}: CreatorHeaderProps) {
  const hero = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [compact, setCompact] = useState(false);
  const reduced = useReducedMotion();
  const compactHeight = designTokens.size.creatorCompactHeader;
  const offset = Math.max(0, height - compactHeight);
  useLayoutEffect(() => {
    const root = hero.current;
    if (!root) return;
    const measure = () => {
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
      if (!avatar || !handle || !actions) return;
      const a = box(avatar, root),
        h = box(handle, root),
        c = box(actions, root);
      const x = designTokens.space.x5;
      const top = shift + designTokens.space.creatorCompactTop;
      const avatarSize = designTokens.size.creatorCompactAvatar;
      const handleScale =
        designTokens.typography.profileTab.fontSize /
        designTokens.typography.profileHandle.fontSize;
      const handleX = x + avatarSize + designTokens.space.x2;
      const actionsX = root.offsetWidth - x - c.width;
      root.style.setProperty(
        '--avatar-transform',
        `translate(${x - a.x}px, ${top - a.y}px) scale(${avatarSize / a.width})`,
      );
      root.style.setProperty(
        '--handle-transform',
        `translate(${handleX - h.x}px, ${top + (avatarSize - h.height * handleScale) / 2 - h.y}px) scale(${handleScale})`,
      );
      root.style.setProperty('--handle-width', `${h.width}px`);
      root.style.setProperty(
        '--handle-limit',
        `${Math.max(0, actionsX - designTokens.space.x3 - handleX) / handleScale}px`,
      );
      root.style.setProperty(
        '--actions-transform',
        `translate(${actionsX - c.x}px, ${top - c.y}px)`,
      );
      root.style.setProperty(
        '--atmosphere-transform',
        `translateY(${shift + designTokens.space.creatorCompactAtmosphereTop + designTokens.space.atmosphereOffset}px)`,
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    measure();
    return () => observer.disconnect();
  }, [compactHeight, profile.slug]);
  useLayoutEffect(() => {
    if (!sentinel.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      setCompact(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [offset]);
  return (
    <>
      <style>{motionCss}</style>
      <div aria-hidden="true" style={{ position: 'relative', height: 0 }}>
        <div
          ref={sentinel}
          style={{ position: 'absolute', top: offset, height: 1, width: 1 }}
        />
      </div>
      <div
        className="creator-header"
        data-testid="creator-sticky-header"
        data-compact={compact}
        style={
          {
            position: 'sticky',
            top: -offset,
            zIndex: 2,
            background: designTokens.color.canvas,
            '--creator-duration': reduced ? '0ms' : '240ms',
          } as CSSProperties
        }
      >
        <div ref={hero} style={{ position: 'relative' }}>
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
    </>
  );
}
