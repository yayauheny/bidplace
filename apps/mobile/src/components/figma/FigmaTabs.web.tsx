import { designTokens } from '@bidplace/design-tokens';
import type { FigmaTabsProps } from './figma-tabs';

export function FigmaTabs({
  tabs,
  value,
  onChange,
  label,
  panelId,
}: FigmaTabsProps) {
  return (
    <div
      role="tablist"
      aria-label={label}
      style={{
        display: 'flex',
        gap: designTokens.space.x2,
        overflowX: 'auto',
        borderBottom: `1px solid ${designTokens.color.divider}`,
      }}
    >
      {tabs.map((tab, index) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          id={`${panelId}-${tab.value}`}
          aria-controls={panelId}
          aria-selected={value === tab.value}
          tabIndex={value === tab.value ? 0 : -1}
          onClick={() => onChange(tab.value)}
          onKeyDown={(event) => {
            const next =
              event.key === 'ArrowRight'
                ? (index + 1) % tabs.length
                : event.key === 'ArrowLeft'
                  ? (index + tabs.length - 1) % tabs.length
                  : event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? tabs.length - 1
                      : undefined;
            if (next === undefined) return;
            event.preventDefault();
            onChange(tabs[next].value);
            document.getElementById(`${panelId}-${tabs[next].value}`)?.focus();
          }}
          style={{
            ...designTokens.typography.profileTab,
            lineHeight: `${designTokens.typography.profileTab.lineHeight}px`,
            color:
              value === tab.value
                ? designTokens.color.ink
                : designTokens.color.textSecondary,
            padding: '0 0 4px',
            background: 'transparent',
            border: 0,
            borderBottom: `2px solid ${value === tab.value ? designTokens.color.ink : 'transparent'}`,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {tab.label}
          {tab.count !== undefined ? (
            <sup style={{ marginLeft: designTokens.space.x1, fontSize: 12 }}>
              {tab.count}
            </sup>
          ) : null}
        </button>
      ))}
    </div>
  );
}
