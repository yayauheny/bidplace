import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { PrimaryButton, SecondaryButton, TextField } from '../../components/ui';

export type BidFormProps = {
  amount: string;
  minimumNextBid: number | null;
  validationError: string | null;
  isPending: boolean;
  hasFailedAttempt: boolean;
  onAmountChange: (value: string) => void;
  onSubmit: () => void;
  onRetry: () => void;
  showPrimaryAction?: boolean;
};

export function BidForm({
  amount,
  minimumNextBid,
  validationError,
  isPending,
  hasFailedAttempt,
  onAmountChange,
  onSubmit,
  onRetry,
  showPrimaryAction = true,
}: BidFormProps) {
  return (
    <View style={{ gap: designTokens.space.x3 }}>
      <TextField
        label="Ваша ставка, BYN"
        value={amount}
        onChangeText={onAmountChange}
        keyboardType="decimal-pad"
        placeholder={minimumNextBid !== null ? `от ${minimumNextBid}` : undefined}
        error={validationError ?? undefined}
      />
      {showPrimaryAction ? (
        <PrimaryButton
          label="Сделать ставку"
          loading={isPending}
          onPress={onSubmit}
          accessibilityHint="Сервер проверит актуальную цену и условия торгов"
        />
      ) : null}
      {hasFailedAttempt ? (
        <SecondaryButton
          label="Повторить ставку"
          disabled={isPending}
          onPress={onRetry}
        />
      ) : null}
    </View>
  );
}

