import { useState, type CSSProperties } from 'react';
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
import { Button } from 'react-aria-components/Button';
import {
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
} from 'react-aria-components/Calendar';
import { I18nProvider } from 'react-aria-components/I18nProvider';
import { Input } from 'react-aria-components/Input';
import { NumberField } from 'react-aria-components/NumberField';
import { designTokens } from '@bidplace/design-tokens';

import type { CalendarDateValue } from '../../lib/calendar-date';
import { useAppTheme } from '../../providers/theme-provider';
import { FigmaIcon } from '../figma/FigmaIcon';

// React Native lineHeight is px; React DOM numeric lineHeight is a multiplier.
const fieldTypography: CSSProperties = {
  ...designTokens.typography.field,
  lineHeight: `${designTokens.typography.field.lineHeight}px`,
};

export function DateSelection({
  value,
  onChange,
}: {
  value: CalendarDateValue | null;
  onChange: (value: CalendarDateValue) => void;
}) {
  const palette = useAppTheme();
  const [focused, setFocused] = useState(() =>
    value
      ? new CalendarDate(value.year, value.month, value.day ?? 1)
      : today(getLocalTimeZone()),
  );
  const control: CSSProperties = {
    ...fieldTypography,
    boxSizing: 'border-box',
    minHeight: designTokens.size.touch,
    minWidth: 0,
    border: `${designTokens.size.fieldBorder}px solid ${palette.border}`,
    borderRadius: designTokens.radius.control,
    color: palette.ink,
    background: palette.surface,
    padding: designTokens.space.x2,
  };
  const selected = value?.day
    ? new CalendarDate(value.year, value.month, value.day)
    : null;
  const monthLabel = new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    timeZone: 'UTC',
  });
  return (
    <I18nProvider locale="ru-RU">
      <Calendar
        aria-label="Календарь"
        value={selected}
        focusedValue={focused}
        onFocusChange={setFocused}
        minValue={new CalendarDate(1, 1, 1)}
        maxValue={new CalendarDate(9999, 12, 31)}
        onChange={(date) =>
          onChange({ year: date.year, month: date.month, day: date.day })
        }
        style={{ width: '100%', color: palette.ink }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: designTokens.space.x2,
          }}
        >
          <Button slot="previous" aria-label="Предыдущий месяц" style={control}>
            <FigmaIcon name="arrow-left-01" />
          </Button>
          <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <select
              aria-label="Месяц календаря"
              value={focused.month}
              onChange={(event) =>
                setFocused(focused.set({ month: Number(event.target.value) }))
              }
              style={{
                ...control,
                appearance: 'none',
                width: '100%',
                paddingRight: designTokens.size.icon + designTokens.space.x4,
              }}
            >
              {Array.from({ length: 12 }, (_, index) => (
                <option key={index} value={index + 1}>
                  {monthLabel.format(new Date(Date.UTC(2000, index, 1)))}
                </option>
              ))}
            </select>
            <div
              style={{
                position: 'absolute',
                right: designTokens.space.x2,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            >
              <FigmaIcon name="arrow-down-01" />
            </div>
          </div>
          <Button slot="next" aria-label="Следующий месяц" style={control}>
            <FigmaIcon name="arrow-right-01" />
          </Button>
        </div>
        <NumberField
          aria-label="Год календаря"
          minValue={1}
          maxValue={9999}
          value={focused.year}
          formatOptions={{ useGrouping: false }}
          onChange={(year) => {
            if (Number.isFinite(year)) setFocused(focused.set({ year }));
          }}
          style={{
            display: 'flex',
            gap: designTokens.space.x2,
            marginTop: designTokens.space.x2,
          }}
        >
          <Button slot="decrement" aria-label="Предыдущий год" style={control}>
            −
          </Button>
          <Input style={{ ...control, flex: 1, textAlign: 'center' }} />
          <Button slot="increment" aria-label="Следующий год" style={control}>
            +
          </Button>
        </NumberField>
        <CalendarGrid
          style={{ width: '100%', tableLayout: 'fixed', borderSpacing: 0 }}
        >
          <CalendarGridHeader>
            {(day) => (
              <CalendarHeaderCell
                style={{
                  ...fieldTypography,
                  color: palette.textSubdued,
                  fontWeight: 'normal',
                }}
              >
                {day}
              </CalendarHeaderCell>
            )}
          </CalendarGridHeader>
          <CalendarGridBody>
            {(date) => (
              <CalendarCell
                date={date}
                style={({
                  isSelected,
                  isFocusVisible,
                  isOutsideMonth,
                  isDisabled,
                }) => ({
                  ...fieldTypography,
                  minHeight: designTokens.size.touch,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: designTokens.radius.pill,
                  background: isSelected ? palette.action : palette.surface,
                  color: isSelected ? palette.onAction : palette.ink,
                  opacity:
                    isOutsideMonth || isDisabled
                      ? designTokens.opacity.disabled
                      : 1,
                  outline: isFocusVisible
                    ? `${designTokens.size.fieldBorder}px solid ${palette.focus}`
                    : undefined,
                  cursor: isDisabled ? 'default' : 'pointer',
                })}
              />
            )}
          </CalendarGridBody>
        </CalendarGrid>
      </Calendar>
      <Button
        onPress={() =>
          onChange({ year: focused.year, month: focused.month, day: null })
        }
        style={{
          ...control,
          width: '100%',
          marginTop: designTokens.space.x2,
          borderRadius: designTokens.radius.button,
        }}
      >
        Только месяц, без точного дня
      </Button>
    </I18nProvider>
  );
}
