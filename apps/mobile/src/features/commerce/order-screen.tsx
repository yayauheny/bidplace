import { useState } from 'react';
import { Image } from 'expo-image';
import { Linking, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { designTokens } from '@bidplace/design-tokens';

import { BackButton } from '../../components/figma/BackButton';
import { FormPageShell } from '../../components/layout';
import { navigateBack } from '../../components/layout/navigate-back';
import { InfrastructurePageStatus } from '../../components/shared/InfrastructurePageStatus';
import {
  AppText,
  ImagePlaceholder,
  SecondaryButton,
  TextField,
} from '../../components/ui';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { getApiAssetUrl } from '../../lib/environment';
import { formatMoney } from '../../lib/money';
import { OrderActions } from './OrderActions';
import { commerceActionError } from './use-lot-actions';
import {
  orderContactLinks,
  orderSourceLabel,
  orderStatusLabel,
  orderTiming,
} from './order-view';
import { useOrderCommands } from './use-order-actions';
import { useOrder } from './use-order';

export function OrderScreen({ publicId }: { publicId: string }) {
  const router = useRouter();
  const order = useOrder(publicId);
  const detail = order.data ?? null;
  const commands = useOrderCommands(publicId, detail?.workPublicId ?? '');
  if (order.isLoading && !detail) {
    return (
      <FormPageShell variant="account">
        <InfrastructurePageStatus status="loading" onRetry={() => undefined} />
      </FormPageShell>
    );
  }
  if (order.isError || !detail) {
    return (
      <FormPageShell variant="account">
        <InfrastructurePageStatus
          status="error"
          onRetry={() => void order.refetch()}
        />
      </FormPageShell>
    );
  }
  const timing = orderTiming(detail);
  return (
    <FormPageShell variant="account">
      <BackButton onPress={() => navigateBack(router, { fallbackHref: '/account/deals' })} />
      <StatusBadge
        tone={detail.status === 'COMPLETED' ? 'success' : detail.status === 'FAILED' ? 'danger' : 'neutral'}
        label={orderStatusLabel(detail)}
      />
      <AppText role="caption">{detail.publicId}</AppText>
      <AppText role="workTitle">{detail.dealCode}</AppText>
      <AppText role="caption">Назовите друг другу при связи</AppText>
      <View style={{ flexDirection: 'row', gap: designTokens.space.x3 }}>
        {detail.coverImageUrl ? (
          <Image
            source={{ uri: getApiAssetUrl(detail.coverImageUrl) }}
            accessibilityLabel={detail.workTitle}
            contentFit="cover"
            style={{ width: 72, height: 96, borderRadius: designTokens.radius.image }}
          />
        ) : (
          <View style={{ width: 72 }}>
            <ImagePlaceholder ratio={72 / 96} label="Нет обложки" />
          </View>
        )}
        <View style={{ flex: 1, gap: designTokens.space.x1 }}>
          <AppText role="body">{detail.workTitle}</AppText>
          <SecondaryButton
            label="Открыть работу"
            width="block"
            onPress={() => router.push(`/product/${detail.workPublicId}` as Href)}
          />
        </View>
      </View>
      <AppText role="body">
        {`${formatMoney(detail.amountMinor, detail.currency)} · ${orderSourceLabel(detail.source)}`}
      </AppText>
      {timing ? <AppText role="bodySmall">{timing}</AppText> : null}
      {detail.buyerComment ? (
        <AppText role="bodySmall">{`Комментарий покупателя: ${detail.buyerComment}`}</AppText>
      ) : null}
      <Party
        title="Контакты покупателя"
        contacts={detail.buyerContacts}
        hint={null}
      />
      <Party
        title="Контакты автора"
        contacts={detail.sellerContacts}
        hint={detail.sellerContactHint}
      />
      {detail.role === 'seller' ? (
        <SellerNote
          initial={detail.sellerNote ?? ''}
          pending={commands.note.pending}
          onSave={(note) => void commands.note.submit(note)}
          error={commerceActionError(
            commands.note.error,
            'Не удалось сохранить заметку.',
          )}
        />
      ) : null}
      <OrderActions order={detail} commands={commands} />
    </FormPageShell>
  );
}

function Party({
  title,
  contacts,
  hint,
}: {
  title: string;
  contacts: Parameters<typeof orderContactLinks>[0] | null;
  hint: string | null;
}) {
  if (!contacts && !hint) return null;
  return (
    <View style={{ gap: designTokens.space.x2 }}>
      <AppText role="label">{title}</AppText>
      {hint ? <AppText role="bodySmall">{hint}</AppText> : null}
      {contacts
        ? orderContactLinks(contacts).map((link) => (
            <SecondaryButton
              key={link.href}
              label={link.label}
              width="block"
              onPress={() => void Linking.openURL(link.href)}
            />
          ))
        : null}
    </View>
  );
}

function SellerNote({
  initial,
  pending,
  error,
  onSave,
}: {
  initial: string;
  pending: boolean;
  error: string | null;
  onSave: (note: string) => void;
}) {
  const [note, setNote] = useState(initial);
  return (
    <View style={{ gap: designTokens.space.x2 }}>
      <TextField
        label="Заметка автора"
        value={note}
        editable={!pending}
        maxLength={1000}
        multiline
        onChangeText={setNote}
      />
      <SecondaryButton
        label="Сохранить заметку"
        width="block"
        loading={pending}
        disabled={pending}
        onPress={() => onSave(note.trim())}
      />
      {error ? (
        <AppText role="bodySmall" tone="danger">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
