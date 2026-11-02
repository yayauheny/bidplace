import { useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import type { PublicLot } from '@bidplace/contracts';

import { designTokens } from '@bidplace/design-tokens';

import { AppDialog } from '../../components/ui/AppDialog';
import { AppText } from '../../components/ui/AppText';
import { PrimaryButton } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { formatMoney } from '../../lib/money';
import { contactHoursPhrase } from './lot-view';
import { commerceActionError, type AttemptResult } from './use-lot-actions';

export function PurchaseDialog({
  open,
  lot,
  title,
  imageUrl,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  lot: PublicLot | null;
  title: string;
  imageUrl: string | null;
  pending: boolean;
  error: unknown;
  onClose: () => void;
  onSubmit: (
    comment: string,
  ) => Promise<AttemptResult<{ publicId: string; dealCode: string }>>;
}) {
  return (
    <AppDialog
      presentation="sheet"
      open={open}
      title="Купить работу"
      onClose={onClose}
    >
      {open && lot?.priceMinor != null ? (
        <PurchaseForm
          key={lot.id}
          lot={lot}
          priceMinor={lot.priceMinor}
          title={title}
          imageUrl={imageUrl}
          pending={pending}
          error={error}
          onSubmit={onSubmit}
        />
      ) : null}
    </AppDialog>
  );
}

function PurchaseForm({
  lot,
  priceMinor,
  title,
  imageUrl,
  pending,
  error,
  onSubmit,
}: {
  lot: PublicLot;
  priceMinor: number;
  title: string;
  imageUrl: string | null;
  pending: boolean;
  error: unknown;
  onSubmit: (
    comment: string,
  ) => Promise<AttemptResult<{ publicId: string; dealCode: string }>>;
}) {
  const [comment, setComment] = useState('');
  const [order, setOrder] = useState<{ dealCode: string } | null>(null);
  const message = commerceActionError(error, 'Не удалось забронировать работу.');
  if (order) {
    return (
      <AppText role="body">
        {`Заказ создан. Код сделки ${order.dealCode}.`}
      </AppText>
    );
  }
  return (
    <View style={{ gap: designTokens.space.x3 }}>
      <View
        style={{
          flexDirection: 'row',
          gap: designTokens.space.x3,
          alignItems: 'center',
        }}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            accessibilityLabel={title}
            contentFit="cover"
            style={{
              width: 72,
              height: 96,
              borderRadius: designTokens.radius.image,
            }}
          />
        ) : null}
        <View style={{ flex: 1, gap: designTokens.space.x1 }}>
          <AppText role="body">{title}</AppText>
          <AppText role="caption">Актуальная цена</AppText>
          <AppText role="workTitle">{formatMoney(priceMinor, lot.currency)}</AppText>
        </View>
      </View>
      <AppText role="bodySmall">
        Работа бронируется, пока автор не подтвердит сделку.
      </AppText>
      <TextField
        label="Комментарий автору"
        value={comment}
        editable={!pending}
        maxLength={500}
        multiline
        onChangeText={setComment}
      />
      <AppText role="caption">
        {`Автор свяжется с вами в течение ${contactHoursPhrase(lot.contactWindowHours)}.`}
      </AppText>
      {message ? (
        <AppText role="bodySmall" tone="danger">
          {message}
        </AppText>
      ) : null}
      <PrimaryButton
        label="Купить"
        width="full"
        loading={pending}
        disabled={pending}
        onPress={() => void submit()}
      />
    </View>
  );

  async function submit() {
    if (pending) return;
    const result = await onSubmit(comment.trim());
    if (result.status === 'accepted') setOrder({ dealCode: result.value.dealCode });
  }
}
