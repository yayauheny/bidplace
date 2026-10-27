import { useLayoutEffect, useRef, useState } from 'react';
import { Platform, TextInput, View } from 'react-native';

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
  onAddText: (
    type: 'HEADING' | 'PARAGRAPH',
    text?: string,
    key?: string,
  ) => string | void;
  onEditText: (key: string, text: string) => void;
  onEditAlt: (key: string, text: string) => void;
  onRemove: (key: string) => void;
  onMove: (key: string, direction: -1 | 1) => void;
  onChooseImage: () => void;
  onRetryUpload: () => void;
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
  onEditText,
  onEditAlt,
  onRemove,
  onMove,
  onChooseImage,
  onRetryUpload,
  onSaveAndContinue,
}: ProductDraftStoryStepProps) {
  const [openBlock, setOpenBlock] = useState<string | null>(null);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [emptyKey] = useState(() => crypto.randomUUID());
  const virtual = blocks.length === 0 && editable;
  const renderedBlocks: EditableStoryBlock[] = virtual
    ? [{ key: emptyKey, type: 'PARAGRAPH', text: '' }]
    : blocks;
  const addText = (type: 'HEADING' | 'PARAGRAPH', text?: string) => {
    const key = onAddText(type, text, virtual ? emptyKey : undefined);
    if (typeof key === 'string') setFocusKey(key);
  };
  const textCount = blocks.filter((block) => block.type !== 'IMAGE').length;
  const imageCount = blocks.length - textCount;
  const canAddText =
    editable && !savePending && textCount < STORY_LIMITS.maxTextBlocks;
  const canAddImage =
    editable && !savePending && imageCount < STORY_LIMITS.maxImages;
  const availableGallery = images.filter((image) => image.mediaAssetId);
  const hasBlocks = blocks.some(
    (block) => block.type === 'IMAGE' || Boolean(block.text.trim()),
  );
  const palette = useAppTheme();

  return (
    <View
      onTouchStart={() => setOpenBlock(null)}
      style={{ gap: designTokens.space.x10 }}
    >
      <View style={{ gap: designTokens.space.x2, alignItems: 'center' }}>
        <AppText role="mediaSheetTitle" style={{ textAlign: 'center' }}>
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
          overflow: 'visible',
        }}
      >
        {renderedBlocks.map((block, index) => {
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
              open={openBlock === block.key}
              onOpenChange={(open) => setOpenBlock(open ? block.key : null)}
              kind={block.type === 'IMAGE' ? 'image' : 'text'}
              editable={editable && !virtual}
              disabled={disabled}
              first={index === 0}
              last={index === blocks.length - 1}
              onMove={(direction) => onMove(block.key, direction)}
              onDelete={() => {
                setOpenBlock(null);
                onRemove(block.key);
              }}
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
                <StoryTextInput
                  heading={block.type === 'HEADING'}
                  value={block.text}
                  placeholder="Начните писать здесь"
                  disabled={disabled}
                  focus={focusKey === block.key}
                  onFocused={() => setFocusKey(null)}
                  onChange={(value) => {
                    if (virtual) onAddText('PARAGRAPH', value, emptyKey);
                    else onEditText(block.key, value);
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
              onPress={() => addText('HEADING')}
            />
            <FigmaIconButton
              surface="muted"
              label="Добавить текст"
              icon="text"
              disabled={!canAddText}
              onPress={() => addText('PARAGRAPH')}
            />
            <FigmaIconButton
              surface="muted"
              label="Добавить изображение"
              icon="image-01"
              disabled={!canAddImage || retryUpload}
              onPress={onChooseImage}
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
        {!isCreationFlow && !editable && !storyNeedsDraft ? (
          <AppText role="bodySmall" tone="secondary">
            История сейчас недоступна для изменений.
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

function StoryTextInput({
  heading,
  value,
  placeholder,
  disabled,
  focus,
  onFocused,
  onChange,
}: {
  heading: boolean;
  value: string;
  placeholder: string;
  disabled: boolean;
  focus?: boolean;
  onFocused?: () => void;
  onChange: (text: string) => void;
}) {
  const input = useRef<TextInput>(null);
  const [height, setHeight] = useState<number>(designTokens.size.touch);
  const palette = useAppTheme();
  useLayoutEffect(() => {
    if (Platform.OS === 'web') {
      const node = input.current as unknown as HTMLTextAreaElement | null;
      if (node) {
        node.style.height = '0px';
        node.style.height = `${Math.max(designTokens.size.touch, node.scrollHeight)}px`;
      }
    }
    if (focus) {
      input.current?.focus();
      onFocused?.();
    }
  }, [value, focus, onFocused]);
  return (
    <TextInput
      ref={input}
      accessibilityLabel={heading ? 'Заголовок истории' : 'Текст истории'}
      placeholder={placeholder}
      placeholderTextColor={palette.fieldLabel}
      value={value}
      onChangeText={onChange}
      editable={!disabled}
      multiline
      scrollEnabled={false}
      onContentSizeChange={(event) =>
        setHeight(
          Math.max(
            designTokens.size.touch,
            event.nativeEvent.contentSize.height,
          ),
        )
      }
      maxLength={
        heading
          ? STORY_LIMITS.headingMaxLength
          : STORY_LIMITS.paragraphMaxLength
      }
      textAlignVertical="top"
      style={{
        ...(heading
          ? designTokens.typography.storyHeading
          : designTokens.typography.bodySmall),
        color: palette.inkStrong,
        padding: 0,
        minHeight: designTokens.size.touch,
        height,
        paddingRight: designTokens.size.touch + designTokens.space.x2,
      }}
    />
  );
}
