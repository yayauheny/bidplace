import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';
import type { PortfolioCabinetWorksResponse } from '@bidplace/contracts';

import { WorkCoverCard } from '../../components/figma/WorkCoverCard';
import {
  coverCaptionBlockStyle,
  coverCaptionCardFrameStyle,
} from '../../components/figma/cover-card-style';
import {
  AppText,
  ImagePlaceholder,
  PrimaryButton,
  SecondaryButton,
} from '../../components/ui';
import { useAppTheme } from '../../providers/theme-provider';
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
  isSuspended,
  visibilityPending,
  onHide,
  onRestore,
}: {
  work: OwnerCabinetWork;
  authorName: string;
  isSuspended: boolean;
  visibilityPending: boolean;
  onHide: () => void;
  onRestore: () => void;
}) {
  const palette = useAppTheme();
  const title = work.title ?? 'Без названия';
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
          imageLabel={title}
          title={title}
          authorSlug={authorName}
        />
      ) : (
        <>
          <View style={coverCaptionCardFrameStyle(palette)}>
            <ImagePlaceholder
              ratio={designTokens.ratio.ownerCardMedia}
              label="Обложка работы не добавлена"
            />
          </View>
          <View style={coverCaptionBlockStyle()}>
            <AppText
              numberOfLines={1}
              style={[
                { color: palette.ink },
                designTokens.typography.coverCaptionAuthor,
              ]}
            >
              {authorName}
            </AppText>
            <AppText
              numberOfLines={1}
              style={[
                { color: palette.gray2 },
                designTokens.typography.authorRowBio,
              ]}
            >
              {title}
            </AppText>
          </View>
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
        <SecondaryButton label="Скрыть" width="block" onPress={onHide} />
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
    </View>
  );
}
