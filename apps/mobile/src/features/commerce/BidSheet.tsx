import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { bidStepMinor, type PublicLot } from '@bidplace/contracts';

import { designTokens } from '@bidplace/design-tokens';

import { AppDialog } from '../../components/ui/AppDialog';
import { AppText } from '../../components/ui/AppText';
import { PrimaryButton, SecondaryButton } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { formatMoney, parseMoneyInput } from '../../lib/money';
import { bidPress, steppedAmount } from './bid-amount';
import { commerceActionError, type AttemptResult } from './use-lot-actions';

const OBLIGATION =
  'Ставка является обязательством купить работу в случае победы. Размещая её, вы соглашаетесь с условиями торгов.';

export function BidSheet({
  open,
  lot,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  lot: PublicLot | null;
  pending: boolean;
  error: unknown;
  onClose: () => void;
  onSubmit: (amountMinor: number) => Promise<AttemptResult<null>>;
}) {
  return (
    <AppDialog
      presentation="sheet"
      open={open}
      title="Участие в торгах"
      onClose={onClose}
    >
      {open && lot?.minimumBidMinor != null ? (
        <BidForm
          key={lot.id}
          lot={lot}
          minimum={lot.minimumBidMinor}
          pending={pending}
          error={error}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      ) : null}
    </AppDialog>
  );
}

function BidForm({
  lot,
  minimum,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  lot: PublicLot;
  minimum: number;
  pending: boolean;
  error: unknown;
  onClose: () => void;
  onSubmit: (amountMinor: number) => Promise<AttemptResult<null>>;
}) {
  const [amountMinor, setAmountMinor] = useState(minimum);
  const [draft, setDraft] = useState(majorText(minimum));
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    if (amountMinor >= minimum) return;
    setAmountMinor(minimum);
    setDraft(majorText(minimum));
    setConfirming(false);
  }, [amountMinor, minimum]);
  const step = bidStepMinor(lot.currency, amountMinor);
  const parsed = parseMoneyInput(draft, lot.currency);
  const amount = parsed ?? amountMinor;
  const message = commerceActionError(error, 'Не удалось отправить ставку.');
  const stepText = majorText(step);
  return (
    <View style={{ gap: designTokens.space.x3 }}>
      <AppText role="caption">Измените цену</AppText>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: designTokens.space.x2,
        }}
      >
        <SecondaryButton
          label={`−${stepText}`}
          accessibilityHint="Уменьшить ставку на шаг"
          disabled={pending || amountMinor <= minimum}
          onPress={() =>
            setAmount(
              steppedAmount({
                minimumMinor: minimum,
                stepMinor: step,
                amountMinor,
                direction: -1,
              }),
            )
          }
        />
        <View style={{ flex: 1 }}>
          <TextField
            label="Сумма ставки"
            value={draft}
            editable={!pending}
            inputMode="decimal"
            onChangeText={(text) => {
              setDraft(text);
              setConfirming(false);
              const next = parseMoneyInput(text, lot.currency);
              if (next != null) setAmountMinor(next);
            }}
          />
        </View>
        <SecondaryButton
          label={`+${stepText}`}
          accessibilityHint="Увеличить ставку на шаг"
          disabled={pending}
          onPress={() =>
            setAmount(
              steppedAmount({
                minimumMinor: minimum,
                stepMinor: step,
                amountMinor,
                direction: 1,
              }),
            )
          }
        />
      </View>
      <AppText role="caption">
        {`Минимум ${formatMoney(minimum, lot.currency)}, шаг ${formatMoney(step, lot.currency)}`}
      </AppText>
      {message ? (
        <AppText role="bodySmall" tone="danger">
          {message}
        </AppText>
      ) : null}
      <PrimaryButton
        label={
          confirming
            ? `Подтвердите ставку ${formatMoney(amount, lot.currency)}`
            : 'Сделать ставку'
        }
        width="full"
        loading={pending}
        disabled={pending || parsed == null || parsed < minimum}
        onPress={() => void submit()}
      />
      <AppText role="caption">{OBLIGATION}</AppText>
    </View>
  );

  function setAmount(next: number) {
    setAmountMinor(next);
    setDraft(majorText(next));
    setConfirming(false);
  }

  async function submit() {
    if (parsed == null || parsed < minimum || pending) return;
    const decision = bidPress({
      amountMinor: parsed,
      minimumMinor: minimum,
      confirming,
    });
    setConfirming(decision.confirming);
    if (!decision.submit) return;
    const result = await onSubmit(parsed);
    if (result.status === 'accepted') onClose();
  }
}

function majorText(minor: number): string {
  const major = minor / 100;
  return Number.isInteger(major) ? String(major) : major.toFixed(2).replace('.', ',');
}
