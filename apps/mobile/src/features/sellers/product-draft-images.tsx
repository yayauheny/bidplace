import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import {
  AppText,
  FormSection,
  PrimaryButton,
  ResilientRemoteImage,
  SecondaryButton,
  TextButton,
} from '../../components/ui';
import { getApiAssetUrl } from '../../lib/environment';

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
  const mediaStyle = {
    width: 160,
    height: 200,
    borderRadius: designTokens.radius.image,
    backgroundColor: designTokens.color.placeholder,
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: designTokens.space.x3,
      }}
    >
      <ResilientRemoteImage
        uri={getApiAssetUrl(url)}
        component="ProductGallery"
        accessibilityLabel={`Изображение предмета ${position + 1}`}
        fallbackLabel={`Изображение ${position + 1} недоступно`}
        style={mediaStyle}
        contentFit="contain"
      />
      {editable ? (
        <View style={{ flex: 1, minWidth: 0, gap: designTokens.space.x1 }}>
          <TextButton
            label="Переместить выше"
            disabled={position === 0 || isReordering}
            onPress={() => onMove(-1)}
          />
          <TextButton
            label="Переместить ниже"
            disabled={isLast || isReordering}
            onPress={() => onMove(1)}
          />
          <TextButton
            label="Удалить изображение"
            disabled={isRemoving}
            onPress={onDelete}
          />
        </View>
      ) : null}
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
  imageSelectionError: string | null;
  removeOrReorderError: boolean;

  onChooseImages: () => void;
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
  imageSelectionError,
  removeOrReorderError,
  onChooseImages,
  onMoveImage,
  onDeleteImage,
  onBackToAbout,
  onContinueToStory,
}: ProductDraftImagesStepProps) {
  const showWizardNavigation =
    isCreationFlow && wizardStep === productWizardStep.images;

  return (
    <View style={{ gap: designTokens.space.x2 }}>
      <FormSection title="Изображения">
        <AppText role="bodySmall" tone="secondary">
          {images.length}/10 изображений
        </AppText>
        {productStatus === 'PENDING_REVIEW' ? (
          <AppText role="bodySmall" tone="secondary">
            Изображения нельзя изменить во время модерации.
          </AppText>
        ) : null}
        {images.map((image) => (
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
        ))}
        {editable ? (
          <SecondaryButton
            label="Добавить изображения"
            loading={uploadPending}
            onPress={() => onChooseImages()}
          />
        ) : null}
        {uploadError ? (
          <AppText role="bodySmall" tone="danger">
            Не удалось загрузить изображения.
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
      </FormSection>

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
