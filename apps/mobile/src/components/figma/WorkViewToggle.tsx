import { designTokens } from '@bidplace/design-tokens';
import { useAppTheme } from '../../providers/theme-provider';
import {
  interactiveHitDataset,
  interactiveHitFallbackStyle,
} from '../ui/interactive-hit-style';
import { MotionPressable } from '../ui/MotionPressable';
import { FigmaGlassSurface } from './FigmaGlassSurface';
import { FigmaIcon } from './FigmaIcon';

export type WorkViewMode = 'compact' | 'large';

// Figma 7271:2719 / 7271:2722, glyph inside the 43px outer control.
const iconSize = 22.736841;

export function WorkViewToggle({
  value,
  onChange,
}: {
  value: WorkViewMode;
  onChange: (value: WorkViewMode) => void;
}) {
  const palette = useAppTheme();
  const compact = value === 'compact';
  return (
    <FigmaGlassSurface preset="filterControl" style={{ overflow: 'visible' }}>
      <MotionPressable
        {...interactiveHitDataset()}
        interactionStyle={(state) =>
          interactiveHitFallbackStyle({ ...state, palette })
        }
        accessibilityRole="button"
        accessibilityLabel={
          compact ? 'Показать крупные карточки' : 'Показать компактные карточки'
        }
        accessibilityValue={{
          text: compact ? 'Компактный вид' : 'Крупный вид',
        }}
        onPress={() => onChange(compact ? 'large' : 'compact')}
        preset="icon"
        hitSlop={
          (designTokens.size.touch - designTokens.size.filterSortPill) / 2
        }
        style={{
          borderRadius: designTokens.radius.pill,
          width: designTokens.size.filterSortPill,
          height: designTokens.size.filterSortPill,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <FigmaIcon name={compact ? 'square' : 'grid-view'} size={iconSize} />
      </MotionPressable>
    </FigmaGlassSurface>
  );
}
