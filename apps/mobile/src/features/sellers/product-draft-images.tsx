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
  renderItem: (image: DraftImage) => ReactNode;
}) {
  const [width, setWidth] = useState(0);
  const items: Array<{ id: string; image?: DraftImage }> = images.map(
    (image) => ({ id: image.id, image }),
  );
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
          columns={gridColumnsFromWidth(width, {
            minCardWidth: photoTile.minWidth,
            gap: designTokens.space.x3,
            max: 3,
          })}
          gap={designTokens.space.x3}
          keyExtractor={(item) => item.id}
          renderItem={(item) =>
            item.image ? renderItem(item.image) : addAction
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
  onRetryUpload?: () => void;
  onMoveImage: (imageId: string, direction: -1 | 1) => void;
  onDeleteImage: (imageId: string) => void;
};

export function ProductDraftImagesStep({
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
  onMoveImage,
  onDeleteImage,
}: ProductDraftImagesStepProps) {
  const palette = useAppTheme();
  const displayImages = [
    ...images,
    ...uploadFiles
      .filter((file) => file.status !== 'done')
      .map((file, index) => ({
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
                disabled={uploadPending || reorderPending || removePending}
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
                      position: 'absolute',
                      left: designTokens.space.x2,
                      right: designTokens.space.x2,
                      bottom: designTokens.space.x2,
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
