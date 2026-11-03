import { useState } from 'react';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';
import type { PortfolioCabinetWorksResponse } from '@bidplace/contracts';

import {
  WorkCoverCaption,
  WorkCoverCard,
} from '../../components/figma/WorkCoverCard';
import { coverCaptionCardFrameStyle } from '../../components/figma/cover-card-style';
import {
  AppText,
  ImagePlaceholder,
  PrimaryButton,
  SecondaryButton,
} from '../../components/ui';
import { getApiAssetUrl } from '../../lib/environment';
import { useAppTheme } from '../../providers/theme-provider';
import { CreateLotSheet } from '../commerce/CreateLotSheet';
import { cabinetListOffer } from '../commerce/create-lot-form';
import {
  authorCabinetPrimaryAction,
  authorCabinetVisibilityActions,
  authorCabinetWorkState,
} from '../sellers/author-cabinet-state';

export type OwnerCabinetWork = PortfolioCabinetWorksResponse['works'][number];

/**
 * Owner-карточка работы кабинета/аккаунта: caption-вариант обложки +
 * статус/модерация + действия. Кнопки — siblings ссылки, не вложены в Link
 * карточки. Права/статусы решает author-cabinet-state; shared card не знает
 * seller permissions.
 */
export function OwnerWorkCard({
  work,
  authorName,
  authorSlug,
  isSuspended,
  visibilityPending,
  onHide,
  onRestore,
}: {
  work: OwnerCabinetWork;
  /** Отображаемое имя автора для caption. */
  authorName: string;
  /** Канонический slug для a11y/fallback caption. */
  authorSlug: string;
  isSuspended: boolean;
  visibilityPending: boolean;
  onHide: () => void;
  onRestore: () => void;
}) {
  const palette = useAppTheme();
  const [sellOpen, setSellOpen] = useState(false);
  const title = work.title ?? 'Без названия';
  const listOffer = cabinetListOffer({
    status: work.status,
    isSuspended,
  });
  const visibility = authorCabinetVisibilityActions({
    status: work.status,
    isSuspended,
  });

  return (
    <View style={{ gap: designTokens.space.x2 }}>
      {work.coverImage ? (
        <WorkCoverCard
          href={`/products/${work.id}`}
          variant="caption"
          imageUrl={work.coverImage.url}
          imagePresentation={work.coverImage}
          imageLabel={title}
          title={title}
          authorSlug={authorSlug}
          authorLabel={authorName}
        />
      ) : (
        <>
          <View style={coverCaptionCardFrameStyle(palette)}>
            <ImagePlaceholder
              ratio={designTokens.ratio.ownerCardMedia}
              label="Обложка работы не добавлена"
            />
          </View>
          <WorkCoverCaption author={authorName} title={title} />
        </>
      )}
      <View style={{ gap: designTokens.space.x1 }}>
        <AppText role="bodySmall" tone="secondary">
          {authorCabinetWorkState(work)}
        </AppText>
        {work.moderationMessage ? (
          <AppText role="bodySmall" tone="danger">
            {work.moderationMessage}
          </AppText>
        ) : null}
      </View>
      <SecondaryButton
        label="Выставить на продажу"
        width="block"
        disabled={!listOffer.enabled}
        onPress={() => {
          if (listOffer.enabled) setSellOpen(true);
        }}
      />
      {listOffer.reason ? (
        <AppText role="bodySmall" tone="secondary">
          {listOffer.reason}
        </AppText>
      ) : null}
      <PrimaryButton
        label={authorCabinetPrimaryAction({
          status: work.status,
          editingRevisionStatus: work.editingRevisionStatus,
          isSuspended,
        })}
        width="block"
        href={`/products/${work.id}`}
      />
      {visibility.canHide ? (
        <SecondaryButton
          label="Скрыть"
          width="block"
          disabled={visibilityPending}
          onPress={onHide}
        />
      ) : null}
      {visibility.canRestore ? (
        <SecondaryButton
          label="Вернуть в профиль"
          width="block"
          loading={visibilityPending}
          disabled={visibilityPending}
          onPress={onRestore}
        />
      ) : null}
      {sellOpen ? (
        <CreateLotSheet
          open
          productId={work.id}
          publicId={work.publicId}
          title={title}
          imageUrl={
            work.coverImage ? getApiAssetUrl(work.coverImage.url) : null
          }
          onClose={() => setSellOpen(false)}
        />
      ) : null}
    </View>
  );
}
