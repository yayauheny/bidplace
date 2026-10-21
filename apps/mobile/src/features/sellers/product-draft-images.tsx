import { useState, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import {
  AppText,
  PrimaryButton,
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
import { productWizardStep } from './product-draft-wizard';

export type DraftImageRowProps = {
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
      editable={editable}
      disabled={isReordering || isRemoving}
      first={position === 0}
      last={isLast}
      onMove={onMove}
      onDelete={onDelete}
    >
      <ResilientRemoteImage
        uri={getApiAssetUrl(url)}
        component="ProductGallery"
        accessibilityLabel={`Изображение предмета ${position + 1}`}
        fallbackLabel={`Изображение ${position + 1} недоступно`}
        style={{
          ...productMediaStyle('100%', palette),
          borderRadius: designTokens.radius.mediaTile,
        }}
        contentFit="contain"
      />
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
        <View style={{ width: 177, maxWidth: '100%', alignSelf: 'center' }}>
          {addAction}
        </View>
      ) : (
        <PaddedGrid
          items={items}
          columns={gridColumnsFromWidth(width, {
            minCardWidth: 177,
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
  wizardCanOpenStory: boolean;

  reorderPending: boolean;
  removePending: boolean;
  uploadPending: boolean;
  uploadError: boolean;
  uploadMessage?: string | null;
  imageSelectionError: string | null;
  removeOrReorderError: boolean;

  onChooseImages: () => void;
  onRetryUpload?: () => void;
  onMoveImage: (imageId: string, direction: -1 | 1) => void;
  onDeleteImage: (imageId: string) => void;

  onBackToAbout: () => void;
  onContinueToStory: () => void;
};

export function ProductDraftImagesStep({
  images,
  productStatus,
  editable,
  isCreationFlow,
  wizardStep,
  wizardCanOpenStory,
  reorderPending,
  removePending,
  uploadPending,
  uploadError,
  uploadMessage,
  imageSelectionError,
  removeOrReorderError,
  onChooseImages,
  onRetryUpload,
  onMoveImage,
  onDeleteImage,
  onBackToAbout,
  onContinueToStory,
}: ProductDraftImagesStepProps) {
  const palette = useAppTheme();
  const showWizardNavigation =
    isCreationFlow && wizardStep === productWizardStep.images;

  return (
    <View style={{ gap: designTokens.space.x2 }}>
      <View style={{ gap: designTokens.space.x3 }}>
        {!showWizardNavigation ? (
          <AppText role="workTitle">Фотографии</AppText>
        ) : null}
        <AppText role="bodySmall" tone="secondary">
          {images.length}/10 изображений
        </AppText>
        {productStatus === 'PENDING_REVIEW' ? (
          <AppText role="bodySmall" tone="secondary">
            Изображения нельзя изменить во время модерации.
          </AppText>
        ) : null}
        <DraftImageGrid
          images={images}
          addAction={
            editable && images.length < 10 ? (
              <MotionPressable
                accessibilityRole="button"
                accessibilityLabel="Добавить изображения"
                disabled={uploadPending || reorderPending || removePending}
                onPress={onChooseImages}
                preset="card"
                style={{
                  aspectRatio: designTokens.ratio.productPortrait,
                  borderRadius: designTokens.radius.mediaTile,
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
          renderItem={(image) => (
            <DraftImageRow
              key={image.id}
              url={image.url}
              position={image.position}
              editable={editable}
              isLast={image.position === images.length - 1}
              isReordering={reorderPending}
              isRemoving={removePending}
              onMove={(direction) => onMoveImage(image.id, direction)}
              onDelete={() => onDeleteImage(image.id)}
            />
          )}
        />
        {uploadError || uploadMessage ? (
          <AppText
            role="bodySmall"
            tone="danger"
            accessibilityLiveRegion="polite"
          >
            {uploadMessage ?? 'Не удалось загрузить изображения.'}
          </AppText>
        ) : null}
        {uploadError && onRetryUpload ? (
          <SecondaryButton
            label="Повторить загрузку"
            disabled={uploadPending || !editable}
            onPress={onRetryUpload}
          />
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

      {showWizardNavigation ? (
        <View style={{ gap: designTokens.space.x3 }}>
          <AppText role="bodySmall" tone="secondary">
            Первое изображение обязательно. До 10 изображений можно заменить,
            удалить и переставить местами до отправки на модерацию.
          </AppText>
          <SecondaryButton
            label="Назад к описанию"
            onPress={() => onBackToAbout()}
          />
          <PrimaryButton
            label="Продолжить к истории создания"
            disabled={!wizardCanOpenStory}
            onPress={() => onContinueToStory()}
          />
        </View>
      ) : null}
    </View>
  );
}
