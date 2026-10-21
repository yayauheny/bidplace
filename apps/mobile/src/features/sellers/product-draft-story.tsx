import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { STORY_LIMITS } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';

import {
  AppText,
  SecondaryButton,
  productMediaStyle,
} from '../../components/ui';
import { FigmaIconButton } from '../../components/figma/FigmaIconButton';
import { ProductBlockActions } from './product-block-actions';
import { FigmaButton } from '../../components/figma/FigmaButton';
import { PrivateStoryImage } from '../../components/shared/PrivateStoryImage';
import { useAppTheme } from '../../providers/theme-provider';
import type { EditableStoryBlock } from './use-product-story-editor';

type GalleryImage = {
  id: string;
  mediaAssetId?: string | null;
  url: string;
};

export type ProductDraftStoryStepProps = {
  productId: string;
  sessionEpoch: number;
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
  sessionEpoch,
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
  const [galleryOpen, setGalleryOpen] = useState(false);
  const textCount = blocks.filter((block) => block.type !== 'IMAGE').length;
  const imageCount = blocks.length - textCount;
  const canAddText =
    editable && !savePending && textCount < STORY_LIMITS.maxTextBlocks;
  const canAddImage =
    editable && !savePending && imageCount < STORY_LIMITS.maxImages;
  const availableGallery = images.filter((image) => image.mediaAssetId);
  const hasBlocks = blocks.length > 0;
  const palette = useAppTheme();

  return (
    <View style={{ gap: designTokens.space.x10 }}>
      <View style={{ gap: designTokens.space.x2, alignItems: 'center' }}>
        <AppText
          role="mediaSheetTitle"
          style={{ textAlign: 'center' }}
        >
          История создания
        </AppText>
        <AppText
          role="bodySmall"
          tone="subdued"
          style={{ textAlign: 'center' }}
        >
          Расскажите о том как создавалась ваша работа
        </AppText>
      </View>

      {storyNeedsDraft ? (
        <View style={{ gap: designTokens.space.x3 }}>
          <AppText role="bodySmall" tone="secondary">
            Для изменения опубликованной истории создайте новую редакцию работы.
            Опубликованная версия останется прежней до модерации.
          </AppText>
          <SecondaryButton
            label="Начать редактирование истории"
            disabled={savePending || !onStartDraft}
            onPress={() => onStartDraft?.()}
          />
        </View>
      ) : null}

      <View
        style={{
          gap: designTokens.space.x5,
          minHeight: hasBlocks ? undefined : 220,
          justifyContent: hasBlocks ? 'flex-start' : 'center',
        }}
      >
        {blocks.map((block, index) => {
          const disabled = !editable || savePending;
          const galleryImageId =
            block.type === 'IMAGE'
              ? availableGallery.find(
                  (item) => item.mediaAssetId === block.mediaAssetId,
                )?.id
              : undefined;
          return (
            <ProductBlockActions
              key={block.key}
              kind={block.type === 'IMAGE' ? 'image' : 'text'}
              editable={editable}
              disabled={disabled}
              first={index === 0}
              last={index === blocks.length - 1}
              onMove={(direction) => onMove(block.key, direction)}
              onDelete={() => onRemove(block.key)}
              details={
                block.type === 'IMAGE' ? (
                  <TextInput
                    accessibilityLabel="Описание фото"
                    placeholder="Описание фото (необязательно)"
                    placeholderTextColor={palette.fieldLabel}
                    value={block.altText ?? ''}
                    onChangeText={(value) => onEditAlt(block.key, value)}
                    maxLength={STORY_LIMITS.altTextMaxLength}
                    editable={!disabled}
                    style={{
                      ...designTokens.typography.bodySmall,
                      color: palette.inkStrong,
                      padding: 0,
                      minHeight: designTokens.size.touch,
                    }}
                  />
                ) : undefined
              }
            >
              {block.type === 'IMAGE' ? (
                <PrivateStoryImage
                  productId={productId}
                  mediaAssetId={block.mediaAssetId}
                  galleryImageId={galleryImageId}
                  sessionEpoch={sessionEpoch}
                  label={block.altText ?? 'Фото истории работы'}
                  style={{
                    ...productMediaStyle('100%', palette),
                    borderRadius: 0,
                  }}
                />
              ) : (
                <TextInput
                  accessibilityLabel={
                    block.type === 'HEADING'
                      ? 'Заголовок истории'
                      : 'Текст истории'
                  }
                  placeholder={
                    block.type === 'HEADING'
                      ? 'Начните писать здесь'
                      : 'Ваш текст'
                  }
                  placeholderTextColor={palette.fieldLabel}
                  value={block.text}
                  onChangeText={(value) => onEditText(block.key, value)}
                  editable={!disabled}
                  multiline
                  maxLength={
                    block.type === 'HEADING'
                      ? STORY_LIMITS.headingMaxLength
                      : STORY_LIMITS.paragraphMaxLength
                  }
                  textAlignVertical="top"
                  style={{
                    ...(block.type === 'HEADING'
                      ? designTokens.typography.storyHeading
                      : designTokens.typography.bodySmall),
                    color: palette.inkStrong,
                    padding: 0,
                    minHeight: designTokens.size.touch,
                    paddingRight:
                      designTokens.size.touch + designTokens.space.x2,
                  }}
                />
              )}
            </ProductBlockActions>
          );
        })}

        {editable ? (
          <View
            style={{
              alignSelf: 'center',
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: designTokens.space.x1,
              backgroundColor: palette.surface,
              borderColor: palette.toolbarBorder,
              borderWidth: 0.5,
              borderRadius: 31,
              padding: 4,
            }}
          >
            <FigmaIconButton
              surface="muted"
              label="Добавить заголовок"
              icon="heading"
              disabled={!canAddText}
              onPress={() => onAddText('HEADING')}
            />
            <FigmaIconButton
              surface="muted"
              label="Добавить текст"
              icon="text"
              disabled={!canAddText}
              onPress={() => onAddText('PARAGRAPH')}
            />
            <FigmaIconButton
              surface="muted"
              label="Добавить изображение"
              icon="image-01"
              disabled={!canAddImage || retryUpload}
              onPress={() =>
                availableGallery.length
                  ? setGalleryOpen((open) => !open)
                  : onChooseImage()
              }
            />
            <FigmaButton
              label={
                savePending
                  ? 'Сохраняю'
                  : !isCreationFlow
                    ? 'Сохранить'
                    : hasBlocks
                      ? 'Закончить'
                      : 'Пропустить'
              }
              variant="solid"
              icon="arrow-right-01"
              iconPosition="right"
              size="event"
              disabled={savePending}
              onPress={onSaveAndContinue}
            />
          </View>
        ) : null}
        {!hasBlocks && editable ? (
          <AppText
            role="bodySmall"
            tone="subdued"
            style={{ textAlign: 'center' }}
          >
            Начните создавать тут
          </AppText>
        ) : null}
        {galleryOpen && canAddImage ? (
          <View style={{ gap: designTokens.space.x2 }}>
            <SecondaryButton
              label="Загрузить новое фото"
              onPress={onChooseImage}
            />
            {availableGallery.map((image, index) => (
              <SecondaryButton
                key={image.id}
                label={`Из галереи: фото ${index + 1}`}
                onPress={() => {
                  if (image.mediaAssetId) onAddGalleryImage(image.mediaAssetId);
                  setGalleryOpen(false);
                }}
              />
            ))}
          </View>
        ) : null}
        {retryUpload ? (
          <SecondaryButton
            label="Повторить загрузку фото"
            disabled={!editable || savePending}
            onPress={onRetryUpload}
          />
        ) : null}
        {saveError ? (
          <AppText role="bodySmall" tone="danger">
            {saveError}
          </AppText>
        ) : null}
        {isCreationFlow ? (
          <SecondaryButton
            label="Назад к изображениям"
            disabled={savePending}
            onPress={onBackToImages}
          />
        ) : !editable && !storyNeedsDraft ? (
          <AppText role="bodySmall" tone="secondary">
            История сейчас недоступна для изменений.
          </AppText>
        ) : null}
      </View>
    </View>
  );
}
