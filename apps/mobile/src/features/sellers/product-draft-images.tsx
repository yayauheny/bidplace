import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image as LocalPreviewImage,
  View,
} from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import {
  AppText,
  ResilientRemoteImage,
  SecondaryButton,
  TextButton,
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
import { SortablePhotoTile } from './SortablePhotoTile';
import type { WorkPhotoCard } from './work-photo-session';
import { ApiClientError } from '@bidplace/api-client';
import type { UploadImageState } from './product-draft-image-actions';
import { productWizardStep } from './product-draft-wizard';

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
      presentation="mediaTile"
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
}: {
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
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{ gap: designTokens.space.x3 }}
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
          columns={columns}
          gap={designTokens.space.x3}
          keyExtractor={(item) => item.id}
          renderItem={(item) =>
            item.image ? renderItem(item.image, columns) : addAction
          }
        />
      )}
    </View>
  );
}

type DraftImage = {
  id: string;
  url: string;
  position: number;
};

export type ProductDraftImagesStepProps = {
  photoCards?: WorkPhotoCard[];
  photoOrderError?: unknown;
  photoOrderConfirmed?: boolean;
  onDiscardLocal?: () => void;
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
  uploadFiles?: UploadImageState[];
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
  photoOrderConfirmed = true,
  onDiscardLocal,
  onEditPhoto,
  onMovePhotoTo,
  onRemovePhoto,
  onStartUpload,
  images,
  productStatus,
  editable,
  isCreationFlow,
  wizardStep,
  reorderPending,
  removePending,
  uploadPending,
  uploadFiles = [],
  uploadError,
  uploadMessage,
  imageSelectionError,
  removeOrReorderError,
  onChooseImages,
  onRetryUpload,
  onCancelUpload,
  onMoveImage,
  onDeleteImage,
}: ProductDraftImagesStepProps) {
  const palette = useAppTheme();
  if (photoCards) {
    const errors = photoCards.filter((card) => card.status === 'error');
    return (
      <View
        style={{
          gap: designTokens.space.x5,
          paddingBottom: designTokens.space.x3,
        }}
      >
        {photoCards.some((card) => card.status !== 'local') ? (
          <AppText
            role="mediaCaption"
            tone="secondary"
            style={{ textAlign: 'center' }}
            accessibilityLiveRegion="polite"
          >
            Загружено{' '}
            {photoCards.filter((card) => card.status === 'done').length} из{' '}
            {photoCards.length}
          </AppText>
        ) : null}
        <DraftImageGrid
          images={photoCards.map((card, index) => ({
            id: card.id,
            url: card.uri,
            position: index,
          }))}
          addAction={
            editable && !uploadPending && photoCards.length < 10 ? (
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
              busy = card.status === 'uploading' || card.status === 'preparing';
            return (
              <SortablePhotoTile
                id={card.id}
                index={image.position}
                count={photoCards.length}
                columns={columns}
                disabled={!editable || uploadPending}
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
                  <CroppedPhoto
                    uri={
                      card.uri.startsWith('/api/')
                        ? getApiAssetUrl(card.uri)
                        : card.uri
                    }
                    component="ProductGallery"
                    accessibilityLabel={`Фото ${image.position + 1}`}
                    fallbackLabel="Фото недоступно"
                    crop={card.edit.crop}
                    sourceWidth={card.width}
                    sourceHeight={card.height}
                    style={{ width: '100%', height: '100%' }}
                  />
                  {image.position === 0 ? (
                    <View
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
                        padding: 6,
                        borderRadius: 14,
                        backgroundColor: palette.overlayScrim,
                        flexDirection: 'row',
                        gap: 6,
                      }}
                    >
                      <ActivityIndicator size="small" color={palette.white} />
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
                            icon="pencil-edit-01"
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
        {errors.length || photoOrderError ? (
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
                Не удалось загрузить фото
              </AppText>
              <AppText
                role="feedbackBody"
                style={{ color: palette.feedbackDangerText }}
              >
                {getImageUploadErrorMessage(
                  errors[0]?.error ?? photoOrderError,
                ) ??
                  ((errors[0]?.error ?? photoOrderError) instanceof
                    ApiClientError &&
                  [401, 403, 409].includes(
                    ((errors[0]?.error ?? photoOrderError) as ApiClientError)
                      .status,
                  )
                    ? 'Сессия или данные работы изменились. Обновите страницу.'
                    : 'Проверьте соединение')}
              </AppText>
            </View>
          </View>
        ) : null}
        {imageSelectionError ? (
          <AppText
            role="feedbackBody"
            tone="danger"
            accessibilityLiveRegion="polite"
          >
            {imageSelectionError}
          </AppText>
        ) : null}
        {onDiscardLocal && photoCards.some((card) => card.status !== 'done') ? (
          <TextButton
            label="Отбросить локальные изменения"
            disabled={uploadPending}
            onPress={onDiscardLocal}
          />
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
  const unfinishedUploadFiles = uploadFiles.filter(
    (file) => file.status !== 'done',
  );
  const displayImages = [
    ...images,
    ...unfinishedUploadFiles.map((file, index) => ({
      id: file.key,
      url: file.uri,
      position: images.length + index,
    })),
  ];
  const showWizardNavigation =
    isCreationFlow && wizardStep === productWizardStep.images;

  return (
    <View style={{ gap: designTokens.space.x2 }}>
      <View style={{ gap: designTokens.space.x3 }}>
        {!showWizardNavigation ? (
          <AppText role="workTitle">Фотографии</AppText>
        ) : null}
        {!showWizardNavigation ? (
          <AppText role="bodySmall" tone="secondary">
            {images.length}/10 изображений
          </AppText>
        ) : null}
        {productStatus === 'PENDING_REVIEW' ? (
          <AppText role="bodySmall" tone="secondary">
            Изображения нельзя изменить во время модерации.
          </AppText>
        ) : null}
        <DraftImageGrid
          images={displayImages}
          addAction={
            editable && displayImages.length < 10 ? (
              <MotionPressable
                accessibilityRole="button"
                accessibilityLabel="Добавить изображения"
                disabled={
                  uploadPending ||
                  unfinishedUploadFiles.length > 0 ||
                  reorderPending ||
                  removePending
                }
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
                {uploadPending ? (
                  <ActivityIndicator color={palette.inkStrong} />
                ) : (
                  <FigmaIcon name="image-add-02" size={40} />
                )}
                <AppText role="body">Добавить фото</AppText>
              </MotionPressable>
            ) : undefined
          }
          renderItem={(image) => {
            const file = uploadFiles.find((entry) => entry.key === image.id);
            return (
              <View style={{ position: 'relative' }}>
                <DraftImageRow
                  key={image.id}
                  url={image.url}
                  position={image.position}
                  local={uploadFiles.some((file) => file.key === image.id)}
                  editable={
                    editable &&
                    !uploadPending &&
                    !uploadFiles.some((file) => file.key === image.id)
                  }
                  isLast={image.position === images.length - 1}
                  isReordering={reorderPending}
                  isRemoving={removePending}
                  onMove={(direction) => onMoveImage(image.id, direction)}
                  onDelete={() => onDeleteImage(image.id)}
                />
                {file && file.status !== 'done' ? (
                  <View
                    style={{
                      ...(file.status === 'error'
                        ? { marginTop: designTokens.space.x2 }
                        : {
                            position: 'absolute',
                            left: designTokens.space.x2,
                            right: designTokens.space.x2,
                            bottom: designTokens.space.x2,
                          }),
                      padding: designTokens.space.x2,
                      borderRadius: designTokens.radius.small,
                      backgroundColor: palette.surfaceStrong,
                      gap: designTokens.space.x2,
                    }}
                  >
                    <AppText
                      role="bodySmall"
                      tone={file.status === 'error' ? 'danger' : 'secondary'}
                      accessibilityLiveRegion="polite"
                    >
                      {file.status === 'error'
                        ? (uploadMessage ?? 'Не удалось загрузить фото')
                        : file.status === 'queued'
                          ? 'Ожидает загрузки'
                          : file.status === 'preparing'
                            ? 'Подготовка фото…'
                            : 'Загрузка фото…'}
                    </AppText>
                    {file.status === 'error' && onRetryUpload ? (
                      <SecondaryButton
                        label="Повторить загрузку"
                        disabled={uploadPending || !editable}
                        onPress={onRetryUpload}
                      />
                    ) : null}
                    {file.status === 'error' && onCancelUpload ? (
                      <TextButton
                        label="Отменить загрузку"
                        disabled={uploadPending || !editable}
                        onPress={onCancelUpload}
                      />
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          }}
        />
        {(uploadError || uploadMessage) &&
        !uploadFiles.some((file) => file.status === 'error') ? (
          <AppText
            role="bodySmall"
            tone="danger"
            accessibilityLiveRegion="polite"
          >
            {uploadMessage ?? 'Не удалось загрузить изображения.'}
          </AppText>
        ) : null}
        {imageSelectionError ? (
          <AppText role="bodySmall" tone="danger">
            {imageSelectionError}
          </AppText>
        ) : null}
        {removeOrReorderError ? (
          <AppText role="bodySmall" tone="danger">
            Не удалось изменить изображения.
          </AppText>
        ) : null}
      </View>
    </View>
  );
}
