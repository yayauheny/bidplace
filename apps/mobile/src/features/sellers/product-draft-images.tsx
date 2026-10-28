import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Image as LocalPreviewImage, View } from 'react-native';

import { WORK_PHOTO_LIMITS } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';

import {
  AppText,
  ResilientRemoteImage,
  SecondaryButton,
} from '../../components/ui';
import { getApiAssetUrl } from '../../lib/environment';
import { useAppTheme } from '../../providers/theme-provider';

import {
  PaddedGrid,
  gridColumnsFromWidth,
} from '../../components/figma/PaddedGrid';
import { MotionPressable } from '../../components/ui/MotionPressable';
import { FigmaIcon } from '../../components/figma/FigmaIcon';
import { ProductBlockActions } from './product-block-actions';
import { productMediaStyle } from '../../components/ui/product-media-style';
import { FigmaIconButton } from '../../components/figma/FigmaIconButton';
import { CroppedPhoto } from '../../components/shared/CroppedPhoto';
import { getImageUploadErrorMessage } from '../../errors/image-upload-error';
import { PhotoDragSurface } from './photo-drag-surface';
import { PhotoDropArea } from './PhotoDropArea';
import { SortablePhotoTile } from './SortablePhotoTile';
import type { PhotoDragPreview } from './sortable-photo-tile';
import type { WorkPhotoCard } from './work-photo-session';
import { ApiClientError } from '@bidplace/api-client';

// Figma4551:31373: unique gallery tile geometry.
const photoTile = { radius: 22, emptyWidth: 177, minWidth: 140 };

export type DraftImageRowProps = {
  local?: boolean;
  url: string;
  position: number;
  editable: boolean;
  isLast: boolean;
  isReordering: boolean;
  isRemoving: boolean;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
};

export function DraftImageRow({
  local = false,
  url,
  position,
  editable,
  isLast,
  isReordering,
  isRemoving,
  onMove,
  onDelete,
}: DraftImageRowProps) {
  const palette = useAppTheme();
  return (
    <ProductBlockActions
      kind="image"
      variant="tile"
      editable={editable}
      disabled={isReordering || isRemoving}
      first={position === 0}
      last={isLast}
      onMove={onMove}
      onDelete={onDelete}
    >
      {local ? (
        <LocalPreviewImage
          source={{ uri: url }}
          accessibilityLabel={`Выбранное изображение ${position + 1}`}
          resizeMode="cover"
          style={{
            ...productMediaStyle('100%', palette),
            borderRadius: photoTile.radius,
          }}
        />
      ) : (
        <ResilientRemoteImage
          uri={getApiAssetUrl(url)}
          component="ProductGallery"
          accessibilityLabel={`Изображение предмета ${position + 1}`}
          fallbackLabel={`Изображение ${position + 1} недоступно`}
          style={{
            ...productMediaStyle('100%', palette),
            borderRadius: photoTile.radius,
          }}
          contentFit="cover"
        />
      )}
    </ProductBlockActions>
  );
}

// Figma4551:31353: two177px tiles with12px gap at390; use the same measured grid at wider widths.
export function DraftImageGrid({
  images,
  renderItem,
  addAction,
  preview,
  onPreview,
  onMove,
}: {
  preview?: PhotoDragPreview | null;
  onPreview?: (value: PhotoDragPreview | null) => void;
  onMove?: (id: string, index: number) => void;
  addAction?: ReactNode;
  images: DraftImage[];
  renderItem: (image: DraftImage, columns: number) => ReactNode;
}) {
  const [width, setWidth] = useState(0);
  const items: Array<{ id: string; image?: DraftImage }> = images.map(
    (image) => ({ id: image.id, image }),
  );
  const columns = gridColumnsFromWidth(width, {
    minCardWidth: photoTile.minWidth,
    gap: designTokens.space.x3,
    max: 3,
  });
  if (addAction) items.push({ id: 'add-image' });
  return (
    <PhotoDropArea preview={preview} onPreview={onPreview} onMove={onMove}>
      <View
        testID="photo-grid"
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={{ gap: designTokens.space.x3, overflow: 'visible' }}
      >
        {images.length === 0 && addAction ? (
          <View
            style={{
              width: photoTile.emptyWidth,
              maxWidth: '100%',
              alignSelf: 'center',
            }}
          >
            {addAction}
          </View>
        ) : (
          <PaddedGrid
            items={items}
            activeItemId={preview?.id}
            columns={columns}
            gap={designTokens.space.x3}
            keyExtractor={(item) => item.id}
            renderItem={(item) =>
              item.image ? renderItem(item.image, columns) : addAction
            }
          />
        )}
      </View>
    </PhotoDropArea>
  );
}

type DraftImage = {
  id: string;
  url: string;
  position: number;
};

export type ProductDraftImagesStepProps = {
  photoCards: WorkPhotoCard[];
  photoOrderError?: unknown;
  photoPreparationError?: unknown;
  photoOrderConfirmed?: boolean;
  photoOperationPending?: boolean;
  onPhotoLoadState?: (
    id: string,
    uri: string,
    state: 'loading' | 'loaded' | 'failed',
  ) => void;
  onEditPhoto?: (id: string) => void;
  onMovePhotoTo?: (id: string, index: number) => void;
  onRemovePhoto?: (id: string) => void;
  onStartUpload?: () => void;
  images: DraftImage[];
  productStatus: string | undefined;
  editable: boolean;
  isCreationFlow: boolean;
  wizardStep: number;

  reorderPending: boolean;
  removePending: boolean;
  uploadPending: boolean;
  uploadError: boolean;
  uploadMessage?: string | null;
  imageSelectionError: string | null;
  removeOrReorderError: boolean;

  onChooseImages: () => void;
  onRetryUpload?: (id?: string) => void;
  onCancelUpload?: () => void;
  onMoveImage: (imageId: string, direction: -1 | 1) => void;
  onDeleteImage: (imageId: string) => void;
};

export function ProductDraftImagesStep({
  photoCards,
  photoOrderError,
  photoPreparationError,
  photoOrderConfirmed = true,
  photoOperationPending = false,
  onEditPhoto,
  onPhotoLoadState,
  onMovePhotoTo,
  onRemovePhoto,
  onStartUpload,
  editable,
  isCreationFlow,
  uploadPending,
  imageSelectionError,
  onChooseImages,
  onRetryUpload,
}: ProductDraftImagesStepProps) {
  const palette = useAppTheme();
  const [dragPreview, setDragPreview] = useState<PhotoDragPreview | null>(null);
  const errors = photoCards.filter((card) => card.status === 'error');
    return (
      <View
        style={{
          gap: designTokens.space.x5,
          paddingBottom: designTokens.space.x3,
        }}
      >
        <View
          testID="photo-status"
          style={{ minHeight: designTokens.typography.mediaCaption.lineHeight }}
          accessibilityLiveRegion="polite"
        >
          <AppText
            role="mediaCaption"
            tone="secondary"
            style={{ textAlign: 'center' }}
          >
            {photoOperationPending
              ? photoCards.some((card) => card.status === 'uploading')
                ? 'Загрузка фотографий'
                : photoCards.every((card) => card.status === 'done')
                  ? 'Сохранение порядка'
                  : 'Подготовка фотографий'
              : photoCards.some((card) => card.status !== 'local')
                ? `Загружено ${photoCards.filter((card) => card.status === 'done').length} из ${photoCards.length}`
                : ' '}
          </AppText>
        </View>
        <DraftImageGrid
          preview={dragPreview}
          onPreview={setDragPreview}
          onMove={onMovePhotoTo}
          images={photoCards.map((card, index) => ({
            id: card.id,
            url: card.uri,
            position: index,
          }))}
          addAction={
            editable && photoCards.length < WORK_PHOTO_LIMITS.maxPhotos ? (
              <MotionPressable
                accessibilityRole="button"
                accessibilityLabel="Добавить изображения"
                disabled={uploadPending}
                onPress={onChooseImages}
                preset="card"
                style={{
                  aspectRatio: designTokens.ratio.productPortrait,
                  borderRadius: photoTile.radius,
                  backgroundColor: palette.surfaceMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: designTokens.space.x3,
                }}
              >
                <FigmaIcon name="image-add-02" size={40} />
                <AppText role="body">Добавить фото</AppText>
              </MotionPressable>
            ) : undefined
          }
          renderItem={(image, columns) => {
            const card = photoCards.find((card) => card.id === image.id)!;
            const failed = card.status === 'error',
              busy =
                card.status === 'uploading' ||
                card.status === 'preparing' ||
                (card.status === 'done' &&
                  Boolean(card.preview && !card.preview.failed));
            return (
              <SortablePhotoTile
                id={card.id}
                index={image.position}
                count={photoCards.length}
                columns={columns}
                disabled={
                  !editable || uploadPending || Boolean(card.preview?.failed)
                }
                preview={dragPreview}
                onPreview={(next) =>
                  setDragPreview((previous) =>
                    previous?.id === next?.id &&
                    previous?.from === next?.from &&
                    previous?.to === next?.to
                      ? previous
                      : next,
                  )
                }
                onMove={onMovePhotoTo ?? (() => undefined)}
              >
                <View
                  style={{
                    aspectRatio: designTokens.ratio.productPortrait,
                    borderRadius: photoTile.radius,
                    overflow: 'hidden',
                    backgroundColor: palette.surfaceMuted,
                  }}
                >
                  <PhotoDragSurface>
                    <CroppedPhoto
                      uri={
                        card.uri.startsWith('/api/')
                          ? getApiAssetUrl(card.uri)
                          : card.uri
                      }
                      component="ProductGallery"
                      accessibilityLabel={`Фото ${image.position + 1}`}
                      fallbackLabel="Фото недоступно"
                      retryPosition="center"
                      onLoad={() =>
                        onPhotoLoadState?.(card.id, card.uri, 'loaded')
                      }
                      onLoadStart={() =>
                        onPhotoLoadState?.(card.id, card.uri, 'loading')
                      }
                      onLoadError={() =>
                        onPhotoLoadState?.(card.id, card.uri, 'failed')
                      }
                      crop={card.edit.crop}
                      sourceWidth={card.width}
                      sourceHeight={card.height}
                      style={{ width: '100%', height: '100%' }}
                    />
                    {card.preview && !card.preview.failed ? (
                      <View
                        pointerEvents="none"
                        style={{ position: 'absolute', inset: 0 }}
                      >
                        <CroppedPhoto
                          uri={
                            card.preview.uri.startsWith('/api/')
                              ? getApiAssetUrl(card.preview.uri)
                              : card.preview.uri
                          }
                          component="ProductGallery"
                          accessibilityLabel="Локальное превью фото"
                          fallbackLabel="Превью недоступно"
                          crop={card.preview.crop}
                          sourceWidth={card.preview.width}
                          sourceHeight={card.preview.height}
                          style={{ width: '100%', height: '100%' }}
                        />
                      </View>
                    ) : null}
                  </PhotoDragSurface>
                  {image.position === 0 ? (
                    <View
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        top: 10,
                        left: 9,
                        borderRadius: designTokens.radius.pill,
                        paddingVertical: 6,
                        paddingHorizontal: 11,
                        backgroundColor: palette.overlayScrim,
                      }}
                    >
                      <AppText
                        role="feedbackTitle"
                        style={{ color: palette.white }}
                      >
                        Главная
                      </AppText>
                    </View>
                  ) : null}
                  {failed ? (
                    <View
                      style={{
                        position: 'absolute',
                        inset: 0,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: palette.overlayOnSolid,
                      }}
                    >
                      {card.retryable ? (
                        <MotionPressable
                          accessibilityRole="button"
                          accessibilityLabel={`Повторить загрузку фото ${image.position + 1}`}
                          disabled={uploadPending}
                          onPress={() => onRetryUpload?.(card.id)}
                          preset="icon"
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: 26,
                            backgroundColor: palette.white,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <FigmaIcon name="reset" size={24} />
                        </MotionPressable>
                      ) : null}
                    </View>
                  ) : null}
                  {busy ? (
                    <View
                      style={{
                        position: 'absolute',
                        left: 9,
                        bottom: 12,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 14,
                        backgroundColor: palette.overlayScrim,
                        flexDirection: 'row',
                        gap: 5,
                      }}
                    >
                      <ActivityIndicator
                        size="small"
                        color={palette.white}
                        style={{ width: 16, height: 16 }}
                      />
                      <AppText
                        role="toolLabel"
                        style={{ color: palette.white }}
                      >
                        {card.status === 'preparing'
                          ? 'Подготовка'
                          : 'Загрузка'}
                      </AppText>
                    </View>
                  ) : (
                    <View
                      style={{
                        position: 'absolute',
                        right: 8,
                        bottom: 8,
                        flexDirection: 'row',
                        gap: 10,
                      }}
                    >
                      {!failed ? (
                        <View
                          style={{
                            backgroundColor: palette.surface,
                            borderRadius: designTokens.radius.pill,
                          }}
                        >
                          <FigmaIconButton
                            icon="edit-03"
                            iconSize={22}
                            surface="outline"
                            label={`Редактировать фото ${image.position + 1}`}
                            disabled={uploadPending || !editable}
                            onPress={() => onEditPhoto?.(card.id)}
                          />
                        </View>
                      ) : null}
                      <FigmaIconButton
                        icon="delete-02"
                        iconSize={22}
                        surface="destructive"
                        label={`Удалить фото ${image.position + 1}`}
                        disabled={uploadPending || !editable}
                        onPress={() => onRemovePhoto?.(card.id)}
                      />
                    </View>
                  )}
                </View>
              </SortablePhotoTile>
            );
          }}
        />
        {errors.length ||
        photoOrderError ||
        photoPreparationError ||
        imageSelectionError ? (
          <View
            accessibilityRole="alert"
            style={{
              flexDirection: 'row',
              padding: designTokens.space.x3,
              gap: designTokens.space.x2,
              borderRadius: 15,
              backgroundColor: palette.feedbackDangerSurface,
            }}
          >
            <FigmaIcon
              name="alert"
              size={23}
              color={palette.feedbackDangerTitle}
            />
            <View style={{ flex: 1, gap: 4 }}>
              <AppText
                role="feedbackTitle"
                style={{ color: palette.feedbackDangerTitle }}
              >
                {imageSelectionError
                  ? 'Не удалось выбрать фото'
                  : photoPreparationError
                    ? 'Не удалось начать загрузку'
                    : errors.length
                      ? 'Не удалось загрузить фото'
                      : 'Не удалось сохранить порядок'}
              </AppText>
              {(
                <AppText
                  role="feedbackBody"
                  style={{ color: palette.feedbackDangerText }}
                >
                  {imageSelectionError ??
                    photoFailureMessage(
                      photoPreparationError ??
                        errors[0]?.error ??
                        photoOrderError,
                      Boolean(photoOrderError) &&
                        !photoPreparationError &&
                        !errors.length,
                    )}
                </AppText>
              )}
            </View>
          </View>
        ) : null}
        {!isCreationFlow &&
        onStartUpload &&
        (photoCards.some((card) => card.status === 'local') ||
          !photoOrderConfirmed) ? (
          <SecondaryButton
            label={
              photoCards.some((card) => card.status === 'local')
                ? 'Загрузить фото'
                : 'Сохранить порядок'
            }
            disabled={
              uploadPending ||
              (photoCards.some((card) => card.status === 'error') &&
                !photoCards.some((card) => card.status === 'local'))
            }
            onPress={onStartUpload}
          />
        ) : null}
      </View>
    );
}

function photoFailureMessage(error: unknown, order: boolean) {
  if (error instanceof ApiClientError) {
    if (error.status === 401)
      return order
        ? 'Войдите в аккаунт снова. Фото загружены, но порядок ещё не подтверждён.'
        : 'Войдите в аккаунт снова. Не закрывайте страницу: локальные фото ещё не загружены.';
    if (error.status === 403)
      return 'Нет доступа к изменению фото этой работы. Локальные фото сохранены на этой странице.';
    if (error.status === 409)
      return 'Работа изменилась в другой сессии. Локальные фото остаются на этой странице. «Закрыть» предложит отменить их изменения; не закрывайте страницу, если они ещё нужны.';
    if (error.status === 415)
      return 'Этот формат изображения не поддерживается. Выберите JPG, PNG или WebP.';
  }
  return (
    getImageUploadErrorMessage(error) ??
    (order
      ? 'Фото загружены. Проверьте соединение и повторите сохранение порядка.'
      : 'Проверьте соединение и повторите загрузку проблемного фото.')
  );
}
