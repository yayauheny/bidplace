import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';

import {
  formatCalendarDateInput,
  parseCalendarDateInput,
  type CalendarDateValue,
} from '../../lib/calendar-date';
import { FigmaSelectField } from '../figma/FigmaSelectField';
import type { FigmaFieldVariant } from '../figma/figma-text-field-style';
import { AppDialog } from './AppDialog';
import { AppText } from './AppText';
import { PrimaryButton, SecondaryButton } from './Button';
import { DateSelection } from './DateSelection';

export function DateField({
  label,
  value,
  onChangeText,
  editable = true,
  error,
  variant = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  editable?: boolean;
  error?: string;
  variant?: FigmaFieldVariant;
}) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  const [selection, setSelection] = useState<CalendarDateValue | null>(null);
  useEffect(() => {
    setOpen(false);
  }, [editable, value]);
  return (
    <>
      <FigmaSelectField
        label={label}
        value={value}
        placeholder="Выбрать дату"
        disabled={!editable}
        error={error}
        variant={variant}
        icon="calendar-01"
        onPress={() => {
          if (!editable) return;
          setSession((current) => current + 1);
          setSelection(parseCalendarDateInput(value).date);
          setOpen(true);
        }}
      />
      <AppDialog
        open={open && editable}
        title={label}
        presentation="sheet"
        onClose={() => setOpen(false)}
      >
        <View style={{ gap: designTokens.space.x4 }}>
          <DateSelection
            key={session}
            value={selection}
            onChange={setSelection}
          />
          <AppText role="bodySmall" accessibilityLiveRegion="polite">
            {selection
              ? `Выбрано: ${formatCalendarDateInput(selection)}`
              : 'Выберите месяц или точную дату'}
          </AppText>
          <PrimaryButton
            width="full"
            label="Выбрать"
            disabled={!selection || !editable}
            onPress={() => {
              if (!editable || !selection) return;
              onChangeText(formatCalendarDateInput(selection));
              setOpen(false);
            }}
          />
          <SecondaryButton
            width="full"
            label="Очистить дату"
            disabled={!editable}
            onPress={() => {
              if (!editable) return;
              onChangeText('');
              setOpen(false);
            }}
          />
        </View>
      </AppDialog>
    </>
  );
}
