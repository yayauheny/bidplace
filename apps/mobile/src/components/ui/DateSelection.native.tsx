import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform, View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';

import type { CalendarDateValue } from '../../lib/calendar-date';
import { useAppTheme, useAppThemeName } from '../../providers/theme-provider';
import { SecondaryButton } from './Button';

function localDate(value: CalendarDateValue | null) {
  if (!value) return new Date();
  const date = new Date();
  date.setFullYear(value.year, value.month - 1, value.day ?? 1);
  date.setHours(12, 0, 0, 0);
  return date;
}

export function DateSelection({
  value,
  onChange,
}: {
  value: CalendarDateValue | null;
  onChange: (value: CalendarDateValue) => void;
}) {
  const [focused, setFocused] = useState(() => localDate(value));
  const [pickerOpen, setPickerOpen] = useState(true);
  const palette = useAppTheme();
  const theme = useAppThemeName();
  return (
    <View style={{ gap: designTokens.space.x4 }}>
      {Platform.OS === 'android' ? (
        <SecondaryButton
          label="Изменить дату"
          onPress={() => setPickerOpen(true)}
        />
      ) : null}
      {pickerOpen || Platform.OS === 'ios' ? (
        <DateTimePicker
          value={focused}
          mode="date"
          themeVariant={theme === 'black' ? 'dark' : 'light'}
          accentColor={palette.action}
          onValueChange={(_event, date) => {
            setFocused(date);
            if (Platform.OS === 'android') setPickerOpen(false);
            onChange({
              year: date.getFullYear(),
              month: date.getMonth() + 1,
              day: date.getDate(),
            });
          }}
          onDismiss={() => setPickerOpen(false)}
        />
      ) : null}
      <SecondaryButton
        label="Только месяц, без точного дня"
        onPress={() => {
          onChange({
            year: focused.getFullYear(),
            month: focused.getMonth() + 1,
            day: null,
          });
        }}
      />
    </View>
  );
}
