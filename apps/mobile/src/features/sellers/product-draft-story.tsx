import { View } from 'react-native';

import { STORY_LIMITS } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';

import {
  AppText,
  FormSection,
  PrimaryButton,
  ResilientRemoteImage,
  SecondaryButton,
  TextField,
  productMediaStyle,
} from '../../components/ui';
import { getApiAssetUrl } from '../../lib/environment';
import type { EditableStoryBlock } from './use-product-story-editor';

type GalleryImage = {
  id: string;
  mediaAssetId?: string | null;
  url: string;
};

export type ProductDraftStoryStepProps = {
  productId: string;
  isCreationFlow: boolean;
  storyNeedsDraft: boolean;
  onStartDraft?: () => void;
  blocks: EditableStoryBlock[];
  images: GalleryImage[];
  editable: boolean;
  savePending: boolean;
  saveError: string | null;
  retryUpload: boolean;
  onAddText: (type: 'HEADING' | 'PARAGRAPH') => void;
  onAddGalleryImage: (mediaAssetId: string) => void;
  onEditText: (key: string, text: string) => void;
  onEditAlt: (key: string, text: string) => void;
  onRemove: (key: string) => void;
  onMove: (key: string, direction: -1 | 1) => void;
  onChooseImage: () => void;
  onRetryUpload: () => void;
  onBackToImages: () => void;
  onSaveAndContinue: () => void;
};

export function ProductDraftStoryStep({
  productId,
  isCreationFlow,
  storyNeedsDraft,
  onStartDraft,
  blocks,
  images,
  editable,
  savePending,
  saveError,
  retryUpload,
  onAddText,
  onAddGalleryImage,
  onEditText,
  onEditAlt,
  onRemove,
  onMove,
  onChooseImage,
  onRetryUpload,
  onBackToImages,
  onSaveAndContinue,
}: ProductDraftStoryStepProps) {
  const textCount = blocks.filter((block) => block.type !== 'IMAGE').length;
  const imageCount = blocks.length - textCount;
  const canAddText = editable && !savePending && textCount < STORY_LIMITS.maxTextBlocks;
  const canAddImage = editable && !savePending && imageCount < STORY_LIMITS.maxImages;
  const availableGallery = images.filter((image) => image.mediaAssetId);

  return (
    <FormSection
      title="История создания"
      description="Соберите историю из текста и фотографий. Этот шаг необязательный."
    >
      <View style={{ gap: designTokens.space.x5 }}>
        {storyNeedsDraft ? (
          <>
            <AppText role="bodySmall" tone="secondary">
              Для изменения опубликованной истории создайте новую редакцию работы.
              Опубликованная версия останется прежней до модерации.
            </AppText>
            <SecondaryButton
              label="Начать редактирование истории"
              disabled={savePending || !onStartDraft}
              onPress={() => onStartDraft?.()}
            />
          </>
        ) : null}
        {blocks.map((block, index) => {
          const disabled = !editable || savePending;
          const imageUrl = block.type === 'IMAGE'
            ? availableGallery.find((image) => image.mediaAssetId === block.mediaAssetId)?.url
              ?? `/api/products/${productId}/story-images/${block.mediaAssetId}`
            : null;
          return (
            <View key={block.key} style={{ gap: designTokens.space.x2 }}>
              <AppText role="label">
                {index + 1}. {block.type === 'HEADING'
                  ? 'Заголовок'
                  : block.type === 'PARAGRAPH'
                    ? 'Текст'
                    : 'Изображение'}
              </AppText>
              {block.type === 'IMAGE' ? (
                <>
                  <ResilientRemoteImage
                    uri={getApiAssetUrl(imageUrl!)}
                    component="ProductGallery"
                    accessibilityLabel={block.altText ?? 'Фото истории работы'}
                    fallbackLabel="Изображение недоступно"
                    style={productMediaStyle()}
                  />
                  <TextField
                    label="Описание фото"
                    value={block.altText ?? ''}
                    onChangeText={(text) => onEditAlt(block.key, text)}
                    maxLength={STORY_LIMITS.altTextMaxLength}
                    editable={!disabled}
                  />
                </>
              ) : (
                <TextField
                  label={block.type === 'HEADING' ? 'Заголовок' : 'Абзац'}
                  value={block.text}
                  onChangeText={(text) => onEditText(block.key, text)}
                  maxLength={block.type === 'HEADING'
                    ? STORY_LIMITS.headingMaxLength
                    : STORY_LIMITS.paragraphMaxLength}
                  multiline={block.type === 'PARAGRAPH'}
                  editable={!disabled}
                />
              )}
              {editable ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: designTokens.space.x2 }}>
                  <SecondaryButton
                    label="Выше"
                    disabled={disabled || index === 0}
                    onPress={() => onMove(block.key, -1)}
                  />
                  <SecondaryButton
                    label="Ниже"
                    disabled={disabled || index === blocks.length - 1}
                    onPress={() => onMove(block.key, 1)}
                  />
                  <SecondaryButton
                    label="Удалить блок"
                    disabled={disabled}
                    onPress={() => onRemove(block.key)}
                  />
                </View>
              ) : null}
            </View>
          );
        })}
        {editable ? (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: designTokens.space.x2 }}>
              <SecondaryButton
                label="Добавить заголовок"
                disabled={!canAddText}
                onPress={() => onAddText('HEADING')}
              />
              <SecondaryButton
                label="Добавить текст"
                disabled={!canAddText}
                onPress={() => onAddText('PARAGRAPH')}
              />
              <SecondaryButton
                label="Загрузить фото"
                disabled={!canAddImage || retryUpload}
                onPress={onChooseImage}
              />
            </View>
            {availableGallery.length > 0 && canAddImage ? (
              <View style={{ gap: designTokens.space.x2 }}>
                <AppText role="bodySmall" tone="secondary">Или используйте фото из галереи работы:</AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: designTokens.space.x2 }}>
                  {availableGallery.map((image, index) => (
                    <SecondaryButton
                      key={image.id}
                      label={`Фото ${index + 1}`}
                      disabled={!canAddImage}
                      onPress={() => onAddGalleryImage(image.mediaAssetId!)}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </>
        ) : null}
        {retryUpload ? (
          <SecondaryButton
            label="Повторить загрузку фото"
            disabled={!editable || savePending}
            onPress={onRetryUpload}
          />
        ) : null}
        {saveError ? <AppText role="bodySmall" tone="danger">{saveError}</AppText> : null}
        {isCreationFlow ? (
          <SecondaryButton
            label="Назад к изображениям"
            disabled={savePending}
            onPress={onBackToImages}
          />
        ) : null}
        <PrimaryButton
          label={isCreationFlow ? 'Сохранить и перейти к проверке' : 'Сохранить историю'}
          loading={savePending}
          disabled={!editable}
          onPress={onSaveAndContinue}
        />
      </View>
    </FormSection>
  );
}
