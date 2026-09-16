import { designTokens } from '@bidplace/design-tokens';
import { figmaTabLabelColor, type FigmaTabsProps } from './figma-tabs';

export function FigmaTabs({
  tabs,
  value,
  onChange,
  label,
  panelId,
  align = 'start',
  contentInset = 0,
}: FigmaTabsProps) {
  return (
    <div
      role="tablist"
      aria-label={label}
      style={{
        background: designTokens.color.canvas,
        overflowX: 'auto',
        borderBottom: `1px solid ${designTokens.color.divider}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: align === 'center' ? 'safe center' : 'flex-start',
          gap: designTokens.space.x2,
          paddingLeft: contentInset,
          paddingRight: contentInset,
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
              letterSpacing: `${designTokens.typography.profileTab.letterSpacing}px`,
              color: figmaTabLabelColor(value === tab.value),
              padding:
                tab.count !== undefined
                  ? `0 ${designTokens.space.x5}px ${designTokens.space.x1}px 0`
                  : `0 0 ${designTokens.space.x1}px`,
              background: 'transparent',
              border: 0,
              borderBottom: `2px solid ${value === tab.value ? designTokens.color.ink : 'transparent'}`,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <span style={{ position: 'relative' }}>
              {tab.label}
              {tab.count !== undefined ? (
                <span
                  data-testid="figma-tab-count"
                  style={{
                    ...designTokens.typography.profileTabCount,
                    lineHeight: `${designTokens.typography.profileTabCount.lineHeight}px`,
                    letterSpacing: `${designTokens.typography.profileTabCount.letterSpacing}px`,
                    position: 'absolute',
                    top: 0,
                    left: '100%',
                    marginLeft: designTokens.space.x1,
                  }}
                >
                  {tab.count}
                </span>
              ) : null}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
