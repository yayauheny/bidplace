import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';

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

const STORY_TOOLBAR_HEIGHT = 52;
const STORY_TEXT_BLOCK_GAP = designTokens.space.workChipGap;
const STORY_MIXED_BLOCK_GAP = designTokens.space.x5;

function storyBlockGapBefore(
  previous: EditableStoryBlock | undefined,
  current: EditableStoryBlock,
): number {
  if (!previous) return 0;
  const previousText = previous.type !== 'IMAGE';
  const currentText = current.type !== 'IMAGE';
  return previousText && currentText
    ? STORY_TEXT_BLOCK_GAP
    : STORY_MIXED_BLOCK_GAP;
}

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
  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const selectBlock = (key: string) => {
    setActiveBlock(key);
    setOpenBlock((open) => (open === key ? open : null));
  };
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
    <View>
      <View style={{ gap: designTokens.space.x2, alignItems: 'center' }}>
        <AppText role="mediaSheetTitle" style={{ textAlign: 'center' }}>
          История создания
        </AppText>
        <AppText
          role="subtitle"
          tone="subdued"
          style={{ textAlign: 'center' }}
        >
          Расскажите о том как создавалась ваша работа
        </AppText>
      </View>

      {storyNeedsDraft ? (
        <View
          style={{
            gap: designTokens.space.x3,
            marginTop: designTokens.space.x10,
          }}
        >
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
        onTouchStart={() => setOpenBlock(null)}
        style={{
          marginTop: designTokens.space.x10,
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
          const textBlock = block.type !== 'IMAGE';
          const selected = activeBlock === block.key;
          return (
            <View
              key={block.key}
              style={{
                marginTop: storyBlockGapBefore(renderedBlocks[index - 1], block),
                zIndex: openBlock === block.key ? 2 : selected ? 1 : 0,
                overflow: 'visible',
              }}
            >
            <ProductBlockActions
              open={openBlock === block.key}
              onOpenChange={(open) => setOpenBlock(open ? block.key : null)}
              kind={textBlock ? 'text' : 'image'}
              menuVisible={selected}
              triggerFrame={designTokens.size.touch}
              triggerStrokeWidthPx={designTokens.stroke.icon}
              blockKey={block.key}
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
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Выбрать изображение истории"
                  disabled={disabled}
                  onFocus={() => selectBlock(block.key)}
                  onPress={() => selectBlock(block.key)}
                  style={{ width: '100%' }}
                >
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
                </Pressable>
              ) : (
                <StoryTextInput
                  heading={block.type === 'HEADING'}
                  value={block.text}
                  placeholder="Начните писать здесь"
                  disabled={disabled}
                  focus={focusKey === block.key}
                  onFocused={() => setFocusKey(null)}
                  onActivate={() => selectBlock(block.key)}
                  onChange={(value) => {
                    if (virtual) onAddText('PARAGRAPH', value, emptyKey);
                    else onEditText(block.key, value);
                  }}
                />
              )}
            </ProductBlockActions>
            </View>
          );
        })}

        {editable ? (
          <View
            testID="story-toolbar"
            style={{
              marginTop: STORY_MIXED_BLOCK_GAP,
              alignSelf: 'center',
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: designTokens.space.x1,
              minHeight: STORY_TOOLBAR_HEIGHT,
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
              strokeWidthPx={designTokens.stroke.icon}
              disabled={!canAddText}
              onPress={() => addText('HEADING')}
            />
            <FigmaIconButton
              surface="muted"
              label="Добавить текст"
              icon="text"
              strokeWidthPx={designTokens.stroke.icon}
              disabled={!canAddText}
              onPress={() => addText('PARAGRAPH')}
            />
            <FigmaIconButton
              surface="muted"
              label="Добавить изображение"
              icon="image-02"
              strokeWidthPx={designTokens.stroke.icon}
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
              size="compactIcon"
              disabled={savePending}
              onPress={onSaveAndContinue}
            />
          </View>
        ) : null}
        {retryUpload ? (
          <View style={{ marginTop: designTokens.space.x3 }}>
            <SecondaryButton
              label="Повторить загрузку фото"
              disabled={!editable || savePending}
              onPress={onRetryUpload}
            />
          </View>
        ) : null}
        {saveError ? (
          <View style={{ marginTop: designTokens.space.x3 }}>
            <AppText role="bodySmall" tone="danger">
              {saveError}
            </AppText>
          </View>
        ) : null}
        {!isCreationFlow && !editable && !storyNeedsDraft ? (
          <View style={{ marginTop: designTokens.space.x3 }}>
            <AppText role="bodySmall" tone="secondary">
              История сейчас недоступна для изменений.
            </AppText>
          </View>
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
  onActivate,
  onChange,
}: {
  heading: boolean;
  value: string;
  placeholder: string;
  disabled: boolean;
  focus?: boolean;
  onFocused?: () => void;
  onActivate?: () => void;
  onChange: (text: string) => void;
}) {
  const input = useRef<TextInput>(null);
  const inputWidth = useRef(0);
  const palette = useAppTheme();
  const typography = heading
    ? designTokens.typography.storyHeading
    : designTokens.typography.bodySmall;
  const lineHeight = typography.lineHeight as number;
  const [height, setHeight] = useState<number>(lineHeight);
  const resizeWebInput = useCallback(() => {
    if (Platform.OS === 'web') {
      const node = input.current as unknown as HTMLTextAreaElement | null;
      if (node) {
        node.style.height = '0px';
        node.style.height = `${Math.max(lineHeight, node.scrollHeight)}px`;
      }
    }
  }, [lineHeight]);
  useLayoutEffect(() => {
    resizeWebInput();
  }, [value, resizeWebInput]);
  useLayoutEffect(() => {
    if (focus) {
      input.current?.focus();
      onFocused?.();
    }
  }, [focus, onFocused]);
  return (
    <View
      style={{ flexDirection: 'row' }}
      {...(Platform.OS === 'web'
        ? {
            onClick: (event: { target: EventTarget | null }) => {
              const target = event.target as {
                closest?: (selector: string) => unknown;
              } | null;
              if (target?.closest?.('textarea, input')) return;
              input.current?.focus();
            },
          }
        : {})}
    >
      <View
        style={{ flex: 1, marginRight: designTokens.space.x2, minWidth: 0 }}
      >
        <TextInput
          ref={input}
          accessibilityLabel={heading ? 'Заголовок истории' : 'Текст истории'}
          placeholder={placeholder}
          placeholderTextColor={palette.fieldLabel}
          value={value}
          onChangeText={onChange}
          onLayout={Platform.OS === 'web' ? (event) => {
            const width = event.nativeEvent.layout.width;
            if (inputWidth.current === width) return;
            inputWidth.current = width;
            resizeWebInput();
          } : undefined}
          onFocus={() => onActivate?.()}
          editable={!disabled}
          multiline
          scrollEnabled={false}
          onContentSizeChange={
            Platform.OS === 'web'
              ? undefined
              : (event) =>
                  setHeight(
                    Math.max(lineHeight, event.nativeEvent.contentSize.height),
                  )
          }
          maxLength={
            heading
              ? STORY_LIMITS.headingMaxLength
              : STORY_LIMITS.paragraphMaxLength
          }
          textAlignVertical="top"
          style={{
            ...typography,
            color: palette.inkStrong,
            padding: 0,
            width: '100%',
            ...(Platform.OS === 'web'
              ? { minHeight: lineHeight }
              : {
                  minHeight: lineHeight,
                  height,
                }),
          }}
        />
      </View>
      <View
        pointerEvents="none"
        testID="story-control-gutter"
        style={{ width: designTokens.size.touch }}
      />
    </View>
  );
}
