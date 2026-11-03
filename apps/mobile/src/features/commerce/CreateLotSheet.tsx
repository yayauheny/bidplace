import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { COMMERCE_CURRENCIES } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';

import { AppDialog } from '../../components/ui/AppDialog';
import { AppText } from '../../components/ui/AppText';
import { DateField } from '../../components/ui/DateField';
import { PrimaryButton, SecondaryButton } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { FigmaChoiceChip } from '../../components/figma/FigmaChoiceChip';
import { FigmaTabs } from '../../components/figma/FigmaTabs';
import { formatMoney } from '../../lib/money';
import {
  commerceActionError,
  useCancelListing,
  useCreateListing,
} from './use-lot-actions';
import {
  AUCTION_DAY_CHIPS,
  CONTACT_WINDOW_HOURS,
  createLotRequest,
  initialCreateLotDraft,
  type CreateLotDraft,
} from './create-lot-form';

export function CreateLotSheet({
  open,
  productId,
  publicId,
  title,
  imageUrl,
  onClose,
}: {
  open: boolean;
  productId: string;
  publicId: string;
  title: string;
  imageUrl: string | null;
  onClose: () => void;
}) {
  const listing = useCreateListing(publicId, productId);
  return (
    <AppDialog
      presentation="sheet"
      open={open}
      title="Выставить на продажу"
      onClose={onClose}
    >
      {open ? (
        <CreateLotForm
          key={productId}
          title={title}
          imageUrl={imageUrl}
          pending={listing.pending}
          error={listing.error}
          recovery={listing.recovery}
          onCheckAgain={listing.checkAgain}
          onOpenSale={() => { onClose(); router.push(`/product/${publicId}`); }}
          onSubmit={listing.submit}
          onDone={onClose}
        />
      ) : null}
    </AppDialog>
  );
}

function CreateLotForm({
  title,
  imageUrl,
  pending,
  error,
  onSubmit,
  recovery,
  onCheckAgain,
  onOpenSale,
  onDone,
}: {
  title: string;
  imageUrl: string | null;
  pending: boolean;
  error: unknown;
  onSubmit: ReturnType<typeof useCreateListing>['submit'];
  recovery: ReturnType<typeof useCreateListing>['recovery'];
  onCheckAgain: ReturnType<typeof useCreateListing>['checkAgain'];
  onOpenSale: () => void;
  onDone: () => void;
}) {
  const [draft, setDraft] = useState<CreateLotDraft>(initialCreateLotDraft);
  const [localError, setLocalError] = useState<string | null>(null);
  const preview = createLotRequest(draft, Date.now());
  const amount = !preview.ok
    ? null
    : preview.value.type === 'FIXED'
      ? preview.value.priceMinor
      : preview.value.startPriceMinor;
  const serverError = commerceActionError(error, 'Не удалось выставить лот.');
  return (
    <View style={{ gap: designTokens.space.x3 }}>
      <View style={{ flexDirection: 'row', gap: designTokens.space.x3, alignItems: 'center' }}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            accessibilityLabel={title}
            contentFit="cover"
            style={{ width: 72, height: 96, borderRadius: designTokens.radius.image }}
          />
        ) : null}
        <View style={{ flex: 1, gap: designTokens.space.x1 }}>
          <AppText role="body">{title}</AppText>
          <AppText role="caption">
            {draft.type === 'AUCTION' ? 'Стартовая цена' : 'Цена'}
          </AppText>
          <AppText role="workTitle">
            {amount === null ? 'Укажите цену' : formatMoney(amount, draft.currency)}
          </AppText>
        </View>
      </View>
      <FigmaTabs
        label="Тип продажи"
        panelId="create-lot-type"
        variant="segmented"
        appearance="plain"
        fill
        value={draft.type}
        tabs={[
          { value: 'FIXED', label: 'Фиксированная цена' },
          { value: 'AUCTION', label: 'Аукцион' },
        ]}
        onChange={(value) =>
          setDraft((current) => ({
            ...current,
            type: value === 'AUCTION' ? 'AUCTION' : 'FIXED',
          }))
        }
      />
      <AppText role="caption">Срок связи с покупателем</AppText>
      <ChipRow>
        {CONTACT_WINDOW_HOURS.map((hours) => (
          <FigmaChoiceChip
            key={hours}
            label={`${hours} ч`}
            selected={draft.contactWindowHours === hours}
            disabled={pending}
            onPress={() =>
              setDraft((current) => ({ ...current, contactWindowHours: hours }))
            }
          />
        ))}
      </ChipRow>
      <AppText role="caption">
        Покупатель увидит этот срок. До его конца нельзя отметить «не вышел на связь».
      </AppText>
      <AppText role="caption">Валюта</AppText>
      <ChipRow>
        {COMMERCE_CURRENCIES.map((currency) => (
          <FigmaChoiceChip
            key={currency}
            label={currency}
            selected={draft.currency === currency}
            disabled={pending}
            onPress={() => setDraft((current) => ({ ...current, currency }))}
          />
        ))}
      </ChipRow>
      <TextField
        label={draft.type === 'AUCTION' ? 'Стартовая цена' : 'Цена'}
        value={draft.amountText}
        editable={!pending}
        keyboardType="decimal-pad"
        onChangeText={(amountText) =>
          setDraft((current) => ({ ...current, amountText }))
        }
      />
      {draft.type === 'AUCTION' ? (
        <AuctionFields
          draft={draft}
          pending={pending}
          durationLabel={preview.ok ? preview.durationLabel : null}
          endsLabel={preview.ok ? preview.endsLabel : null}
          onChange={setDraft}
        />
      ) : null}
      <AppText role="caption">
        Лот нельзя изменить. Чтобы поменять цену — снимите и выставьте заново. Аукцион со ставками снять нельзя.
      </AppText>
      {recovery?.notice ? <AppText role="bodySmall" accessibilityLiveRegion="polite">{recovery.notice}</AppText> : null}
      {!recovery && (localError || serverError) ? (
        <AppText role="bodySmall" tone="danger">
          {localError ?? serverError}
        </AppText>
      ) : null}
      <PrimaryButton
        label="Выставить"
        width="full"
        loading={pending}
        disabled={pending || recovery !== null}
        onPress={() => void send()}
      />
      {recovery?.outcome === 'open' ? <SecondaryButton label="Открыть продажу" width="full" onPress={onOpenSale} /> : null}
      {recovery ? <SecondaryButton label="Проверить снова" width="full" loading={pending} disabled={pending} onPress={() => void onCheckAgain()} /> : null}
    </View>
  );

  async function send() {
    if (pending) return;
    const next = createLotRequest(draft, Date.now());
    if (!next.ok) {
      setLocalError(next.message);
      return;
    }
    setLocalError(null);
    const result = await onSubmit(next.value);
    if (result.status === 'accepted' && result.value.applied && result.value.outcome === 'created') onDone();
  }
}

function AuctionFields({
  draft,
  pending,
  durationLabel,
  endsLabel,
  onChange,
}: {
  draft: CreateLotDraft;
  pending: boolean;
  durationLabel: string | null;
  endsLabel: string | null;
  onChange: (update: (current: CreateLotDraft) => CreateLotDraft) => void;
}) {
  return (
    <View style={{ gap: designTokens.space.x3 }}>
      <AppText role="caption">Начало</AppText>
      <ChipRow>
        <FigmaChoiceChip
          label="Сейчас"
          selected={draft.startMode === 'now'}
          disabled={pending}
          onPress={() => onChange((current) => ({ ...current, startMode: 'now' }))}
        />
        <FigmaChoiceChip
          label="Дата и время"
          selected={draft.startMode === 'scheduled'}
          disabled={pending}
          onPress={() =>
            onChange((current) => ({ ...current, startMode: 'scheduled' }))
          }
        />
      </ChipRow>
      {draft.startMode === 'scheduled' ? (
        <View style={{ gap: designTokens.space.x2 }}>
          <DateField
            label="Дата начала"
            value={draft.startDate}
            editable={!pending}
            onChangeText={(startDate) =>
              onChange((current) => ({ ...current, startDate }))
            }
          />
          <TextField
            label="Время начала"
            value={draft.startTime}
            editable={!pending}
            onChangeText={(startTime) =>
              onChange((current) => ({ ...current, startTime }))
            }
          />
        </View>
      ) : null}
      <AppText role="caption">Длительность</AppText>
      <ChipRow>
        {AUCTION_DAY_CHIPS.map((days) => (
          <FigmaChoiceChip
            key={days}
            label={`${days} д`}
            selected={draft.durationDays === days}
            disabled={pending}
            onPress={() =>
              onChange((current) => ({ ...current, durationDays: days }))
            }
          />
        ))}
        <FigmaChoiceChip
          label="Другая"
          selected={draft.durationDays === null}
          disabled={pending}
          onPress={() =>
            onChange((current) => ({ ...current, durationDays: null }))
          }
        />
      </ChipRow>
      {draft.durationDays === null ? (
        <TextField
          label="Дней, от 1 до 14"
          value={draft.customDaysText}
          editable={!pending}
          keyboardType="number-pad"
          onChangeText={(customDaysText) =>
            onChange((current) => ({ ...current, customDaysText }))
          }
        />
      ) : null}
      {durationLabel ? <AppText role="bodySmall">{durationLabel}</AppText> : null}
      {endsLabel ? (
        <AppText role="bodySmall">{endsLabel}</AppText>
      ) : null}
    </View>
  );
}

function ChipRow({ children }: { children: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: designTokens.space.x2 }}>
      {children}
    </View>
  );
}

export function CancelLotDialog({
  open,
  publicId,
  listingId,
  onClose,
}: {
  open: boolean;
  publicId: string;
  listingId: string | null;
  onClose: () => void;
}) {
  const cancel = useCancelListing(publicId, listingId);
  const message = commerceActionError(cancel.error, 'Не удалось снять лот.');
  return (
    <AppDialog open={open} title="Снять с продажи" onClose={onClose}>
      <View style={{ gap: designTokens.space.x3 }}>
        <AppText role="bodySmall">
          Лот будет снят. Чтобы продать работу, его нужно выставить заново.
        </AppText>
        {message ? (
          <AppText role="bodySmall" tone="danger">
            {message}
          </AppText>
        ) : null}
        <PrimaryButton
          label="Снять"
          width="full"
          loading={cancel.pending}
          disabled={cancel.pending || !listingId}
          onPress={() => void confirm()}
        />
        <SecondaryButton label="Оставить" width="full" onPress={onClose} />
      </View>
    </AppDialog>
  );

  async function confirm() {
    if (cancel.pending) return;
    const result = await cancel.submit();
    if (result.status === 'accepted' && result.value) onClose();
  }
}
