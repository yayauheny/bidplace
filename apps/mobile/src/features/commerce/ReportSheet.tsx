import { useState } from 'react';
import { View } from 'react-native';
import {
  ApiErrorCode,
  REPORT_REASONS,
  createReportRequestSchema,
} from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';
import { ApiClientError } from '@bidplace/api-client';

import { AppDialog } from '../../components/ui/AppDialog';
import { AppText } from '../../components/ui/AppText';
import { PrimaryButton } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { FigmaChoiceChip } from '../../components/figma/FigmaChoiceChip';
import { commerceActionError } from './use-lot-actions';
import { REPORT_REASON_LABEL } from './order-view';
import type { useOrderCommands } from './use-order-actions';

export function ReportSheet({
  open,
  report,
  onClose,
}: {
  open: boolean;
  report: ReturnType<typeof useOrderCommands>['report'];
  onClose: () => void;
}) {
  return (
    <AppDialog presentation="sheet" open={open} title="Пожаловаться" onClose={onClose}>
      {open ? <ReportForm report={report} onClose={onClose} /> : null}
    </AppDialog>
  );
}

function ReportForm({
  report,
  onClose,
}: {
  report: ReturnType<typeof useOrderCommands>['report'];
  onClose: () => void;
}) {
  const [reason, setReason] = useState<(typeof REPORT_REASONS)[number]>('NO_CONTACT');
  const [text, setText] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const duplicate =
    report.error instanceof ApiClientError &&
    report.error.code === ApiErrorCode.CONFLICT;
  const message = duplicate
    ? 'Жалоба уже на рассмотрении.'
    : commerceActionError(report.error, 'Не удалось отправить жалобу.');
  if (sent) {
    return (
      <AppText role="bodySmall">
        Жалоба отправлена. Ответим в течение 2 рабочих дней. Срочно — в поддержку.
      </AppText>
    );
  }
  return (
    <View style={{ gap: designTokens.space.x3 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: designTokens.space.x2 }}>
        {REPORT_REASONS.map((item) => (
          <FigmaChoiceChip
            key={item}
            label={REPORT_REASON_LABEL[item]}
            selected={reason === item}
            disabled={report.pending}
            onPress={() => setReason(item)}
          />
        ))}
      </View>
      <TextField
        label="Текст"
        value={text}
        editable={!report.pending}
        maxLength={1000}
        multiline
        onChangeText={setText}
      />
      {localError || message ? (
        <AppText role="bodySmall" tone="danger">
          {localError ?? message}
        </AppText>
      ) : null}
      <PrimaryButton
        label="Отправить"
        width="full"
        loading={report.pending}
        disabled={report.pending}
        onPress={() => void send()}
      />
    </View>
  );

  async function send() {
    if (report.pending) return;
    const parsed = createReportRequestSchema.safeParse({
      reason,
      ...(text.trim() ? { text: text.trim() } : {}),
    });
    if (!parsed.success) {
      setLocalError('Проверьте текст жалобы.');
      return;
    }
    setLocalError(null);
    const result = await report.submit(parsed.data);
    if (result.status === 'accepted' && result.value) setSent(true);
    if (result.status === 'accepted' && result.value === null) onClose();
  }
}
