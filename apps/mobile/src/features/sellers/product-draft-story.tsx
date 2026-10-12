import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { STORY_LIMITS } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';

import {
  AppText,
  SecondaryButton,
  productMediaStyle,
} from '../../components/ui';
import { MotionPressable } from '../../components/ui/MotionPressable';
import { FigmaButton } from '../../components/figma/FigmaButton';
import { FigmaIcon } from '../../components/figma/FigmaIcon';
import { PrivateStoryImage } from '../../components/shared/PrivateStoryImage';
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


const toolbarIconSize = 43;
const toolbarColors = designTokens.color;

function StoryTool({
  label,
  glyph,
  disabled,
  onPress,
}: {
  label: string;
  glyph: 'H' | 'T' | 'image';
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <MotionPressable
      preset="icon"
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={{
        height: toolbarIconSize,
        width: toolbarIconSize,
        borderRadius: designTokens.radius.button,
        backgroundColor: toolbarColors.surfaceMuted,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {glyph === 'image' ? (
        <FigmaIcon name="image-01" size={18} color={toolbarColors.inkStrong} />
      ) : (
        <AppText role="body" style={{ fontSize: 18, color: toolbarColors.inkStrong }}>
          {glyph}
        </AppText>
      )}
    </MotionPressable>
  );
}

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
  const [menuKey, setMenuKey] = useState<string | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const textCount = blocks.filter((block) => block.type !== 'IMAGE').length;
  const imageCount = blocks.length - textCount;
  const canAddText = editable && !savePending && textCount < STORY_LIMITS.maxTextBlocks;
  const canAddImage = editable && !savePending && imageCount < STORY_LIMITS.maxImages;
  const availableGallery = images.filter((image) => image.mediaAssetId);
  const hasBlocks = blocks.length > 0;

  return (
    <View style={{ gap: designTokens.space.x10 }}>
      <View style={{ gap: designTokens.space.x2, alignItems: 'center' }}>
        <AppText
          role="sectionTitle"
          style={{ textAlign: 'center', letterSpacing: -0.48 }}
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

      <View style={{ gap: designTokens.space.x5, minHeight: hasBlocks ? undefined : 220, justifyContent: hasBlocks ? 'flex-start' : 'center' }}>
        {blocks.map((block, index) => {
          const disabled = !editable || savePending;
          const active = menuKey === block.key;
          const galleryImageId = block.type === 'IMAGE'
            ? availableGallery.find((item) => item.mediaAssetId === block.mediaAssetId)?.id
            : undefined;
          return (
            <View key={block.key} style={{ gap: designTokens.space.x2 }}>
              <View style={{ position: 'relative', gap: designTokens.space.x1 }}>
                {block.type === 'IMAGE' ? (
                  <PrivateStoryImage
                    productId={productId}
                    mediaAssetId={block.mediaAssetId}
                    galleryImageId={galleryImageId}
                    sessionEpoch={sessionEpoch}
                    label={block.altText ?? 'Фото истории работы'}
                    style={{ ...productMediaStyle(), borderRadius: 0 }}
                  />
                ) : (
                  <TextInput
                    accessibilityLabel={block.type === 'HEADING' ? 'Заголовок истории' : 'Текст истории'}
                    placeholder={block.type === 'HEADING' ? 'Начните писать здесь' : 'Ваш текст'}
                    placeholderTextColor={toolbarColors.fieldLabel}
                    value={block.text}
                    onChangeText={(value) => onEditText(block.key, value)}
                    onFocus={() => setMenuKey(block.key)}
                    editable={!disabled}
                    multiline
                    maxLength={block.type === 'HEADING'
                      ? STORY_LIMITS.headingMaxLength
                      : STORY_LIMITS.paragraphMaxLength}
                    textAlignVertical="top"
                    style={{
                      ...designTokens.typography.bodySmall,
                      fontFamily: block.type === 'HEADING'
                        ? designTokens.typography.mediaSheetTitle.fontFamily
                        : designTokens.typography.bodySmall.fontFamily,
                      fontWeight: block.type === 'HEADING' ? '600' : '400',
                      fontSize: block.type === 'HEADING' ? 15 : 14,
                      lineHeight: block.type === 'HEADING' ? 24 : 20,
                      letterSpacing: -0.15,
                      color: toolbarColors.inkStrong,
                      padding: 0,
                      minHeight: 24,
                      paddingRight: 36,
                    }}
                  />
                )}
                {editable ? (
                  <MotionPressable
                    accessibilityRole="button"
                    accessibilityLabel="Действия с блоком"
                    disabled={disabled}
                    onPress={() => setMenuKey(active ? null : block.key)}
                    preset="icon"
                    style={{
                      position: 'absolute',
                      right: block.type === 'IMAGE' ? 12 : 0,
                      top: block.type === 'IMAGE' ? 12 : 0,
                      height: 43,
                      width: 43,
                      borderRadius: 80,
                      backgroundColor: toolbarColors.surfaceMuted,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AppText role="body" style={{ color: toolbarColors.inkStrong, fontSize: 22 }}>
                      ⋮
                    </AppText>
                  </MotionPressable>
                ) : null}
              </View>
              {active && editable ? (
                <View style={{ alignSelf: 'flex-end', flexDirection: 'row', flexWrap: 'wrap', gap: designTokens.space.x2 }}>
                  <SecondaryButton
                    label="Выше"
                    icon="arrow-up-01"
                    disabled={disabled || index === 0}
                    onPress={() => { onMove(block.key, -1); setMenuKey(null); }}
                  />
                  <SecondaryButton
                    label="Ниже"
                    icon="arrow-down-01"
                    disabled={disabled || index === blocks.length - 1}
                    onPress={() => { onMove(block.key, 1); setMenuKey(null); }}
                  />
                  <SecondaryButton
                    label="Удалить"
                    icon="delete-02"
                    disabled={disabled}
                    onPress={() => { onRemove(block.key); setMenuKey(null); }}
                  />
                </View>
              ) : null}
              {active && block.type === 'IMAGE' && editable ? (
                <TextInput
                  accessibilityLabel="Описание фото"
                  placeholder="Описание фото (необязательно)"
                  placeholderTextColor={toolbarColors.fieldLabel}
                  value={block.altText ?? ''}
                  onChangeText={(value) => onEditAlt(block.key, value)}
                  maxLength={STORY_LIMITS.altTextMaxLength}
                  editable={!disabled}
                  style={{
                    ...designTokens.typography.bodySmall,
                    color: toolbarColors.inkStrong,
                    padding: 0,
                    minHeight: 24,
                  }}
                />
              ) : null}
            </View>
          );
        })}

        {editable ? (
          <View style={{
            alignSelf: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            gap: designTokens.space.x1,
            backgroundColor: toolbarColors.surface,
            borderColor: '#D1D1D1',
            borderWidth: 0.5,
            borderRadius: 31,
            padding: 4,
          }}>
            <StoryTool
              label="Добавить заголовок"
              glyph="H"
              disabled={!canAddText}
              onPress={() => onAddText('HEADING')}
            />
            <StoryTool
              label="Добавить текст"
              glyph="T"
              disabled={!canAddText}
              onPress={() => onAddText('PARAGRAPH')}
            />
            <StoryTool
              label="Добавить изображение"
              glyph="image"
              disabled={!canAddImage || retryUpload}
              onPress={() => availableGallery.length
                ? setGalleryOpen((open) => !open)
                : onChooseImage()}
            />
            <FigmaButton
              label={savePending ? 'Сохраняю' : !isCreationFlow ? 'Сохранить' : hasBlocks ? 'Закончить' : 'Пропустить'}
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
          <AppText role="bodySmall" tone="subdued" style={{ textAlign: 'center' }}>
            Начните создавать тут
          </AppText>
        ) : null}
        {galleryOpen && canAddImage ? (
          <View style={{ gap: designTokens.space.x2 }}>
            <SecondaryButton label="Загрузить новое фото" onPress={onChooseImage} />
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
          <AppText role="bodySmall" tone="danger">{saveError}</AppText>
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
