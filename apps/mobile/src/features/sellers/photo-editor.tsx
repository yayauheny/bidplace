import { useEffect, useRef, useState, type ElementRef } from 'react';
import { BackHandler, Platform, View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';
import { CroppedPhoto } from '../../components/shared/CroppedPhoto';
import { FormPageShell } from '../../components/layout';
import { AppText, MotionPressable, PrimaryButton } from '../../components/ui';
import { FigmaIcon } from '../../components/figma/FigmaIcon';
import { FigmaIconButton } from '../../components/figma/FigmaIconButton';
import { FigmaTabs } from '../../components/figma/FigmaTabs';
import { useReturnFocus } from '../../components/ui/use-return-focus';
import { useAppTheme } from '../../providers/theme-provider';
import { PhotoCropSurface } from '../../lib/media/PhotoCropSurface';
import type { PhotoCropSurfaceHandle } from '../../lib/media/photo-crop-surface';
import {
  composePhotoEdit,
  originalPhotoEdit,
  type PhotoEdit,
} from '../../lib/media/photo-edit';
import type { ImageUploadInput } from '../../lib/media/prepare-image-upload';

export function PhotoEditor({
  input,
  confirmed,
  avatar = false,
  name,
  position,
  count,
  pending,
  error,
  onConfirm,
  onCancel,
}: {
  input: ImageUploadInput;
  confirmed: PhotoEdit;
  avatar?: boolean;
  name?: string;
  position?: number;
  count?: number;
  pending: boolean;
  error?: string | null;
  onConfirm: (edit: PhotoEdit) => void;
  onCancel: () => void;
}) {
  const palette = useAppTheme();
  const editor = useRef<PhotoCropSurfaceHandle>(null);
  const close = useRef<ElementRef<typeof FigmaIconButton>>(null);
  const focus = useReturnFocus({
    focusOnOpen: () =>
      typeof HTMLElement !== 'undefined' && close.current instanceof HTMLElement
        ? close.current
        : null,
    fallback: () =>
      typeof document === 'undefined'
        ? null
        : document.querySelector<HTMLElement>(
            '[aria-label="Добавить изображения"], [aria-label="Изменить фото"], [aria-label="Загрузить фото"]',
          ),
  });
  useEffect(() => {
    if (Platform.OS === 'web') {
      focus.onOpenAutoFocus(new Event('open', { cancelable: true }));
      const escape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onCancel();
        }
      };
      window.addEventListener('keydown', escape);
      return () => {
        window.removeEventListener('keydown', escape);
        focus.onCloseAutoFocus(new Event('close', { cancelable: true }));
      };
    }
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      onCancel();
      return true;
    });
    return () => back.remove();
  }, []);
  const [draft, setDraft] = useState<PhotoEdit>({
    ...originalPhotoEdit,
    crop: confirmed.crop,
  });
  const [reset, setReset] = useState(0);
  const [cropEnabled, setCropEnabled] = useState(
    avatar || confirmed.crop !== null,
  );
  const [width, setWidth] = useState(366);
  const viewportHeight = (width * (avatar ? 418 : 436)) / 366;
  const inputWidth = input.width ?? 1,
    inputHeight = input.height ?? 1;
  return (
    <FormPageShell
      hideDock
      variant="creation"
      bottomAction={
        <PrimaryButton
          label={avatar ? 'Установить фото' : 'Готово'}
          width="block"
          size="creationAction"
          loading={pending}
          disabled={pending}
          onPress={() => {
            const change = editor.current?.getEdit();
            if (change) onConfirm(composePhotoEdit(confirmed, change));
          }}
        />
      }
    >
      {/* 7329:822/824: header36, title24, caption18; OS insets belong to FormPageShell. */}
      <View style={{ gap: 0 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: avatar ? 'flex-end' : 'flex-start',
            height: 36,
          }}
        >
          <FigmaIconButton
            ref={close}
            icon={avatar ? 'x' : 'arrow-left-02'}
            label={avatar ? 'Закрыть редактор' : 'Назад'}
            onPress={onCancel}
          />
        </View>
        <View style={{ gap: 14, paddingBottom: avatar ? 24 : 14 }}>
          <AppText role="workTitle" style={{ textAlign: 'center' }}>
            {avatar ? 'Фотография автора' : 'Настроить фото'}
          </AppText>
          <AppText
            role="mediaCaption"
            tone="secondary"
            style={{ textAlign: 'center' }}
          >
            {avatar
              ? 'Перемещайте фото внутри круга'
              : `Фото ${(position ?? 0) + 1} из ${count ?? 1}`}
          </AppText>
        </View>
        <View
          onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)}
          style={{
            height: viewportHeight,
            borderRadius: 22,
            overflow: 'hidden',
            backgroundColor: palette.mediaStage,
          }}
        >
          <PhotoCropSurface
            key={reset}
            ref={editor}
            uri={input.uri}
            width={inputWidth}
            height={inputHeight}
            viewportWidth={width}
            viewportHeight={viewportHeight}
            openingCrop={confirmed.crop}
            cropEnabled={cropEnabled}
            avatar={avatar}
            onChange={setDraft}
          />
        </View>
        {error ? (
          <AppText
            role="feedbackBody"
            tone="danger"
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            {error}
          </AppText>
        ) : null}
        {!avatar ? (
          <View style={{ marginTop: 18 }}>
            <FigmaTabs
              variant="segmented"
              fill
              label="Режим кадрирования"
              panelId="photo-crop-mode"
              appearance="plain"
              value={cropEnabled ? 'crop' : 'original'}
              tabs={[
                { value: 'original', label: 'Оригинал' },
                { value: 'crop', label: 'Кадрировать' },
              ]}
              onChange={(value) => setCropEnabled(value === 'crop')}
            />
          </View>
        ) : null}
        <View
          style={{
            flexDirection: 'row',
            gap: designTokens.space.x3,
            marginTop: avatar ? 28 : 20,
          }}
        >
          {(
            [
              {
                icon: 'rotate',
                label: 'Повернуть 90°',
                action: () => editor.current?.rotate(),
              },
              {
                icon: 'flip',
                label: 'Отразить',
                action: () => editor.current?.flip(),
              },
              {
                icon: 'reset',
                label: 'Сбросить',
                action: () => {
                  setCropEnabled(avatar || confirmed.crop !== null);
                  setDraft({ ...originalPhotoEdit, crop: confirmed.crop });
                  setReset((value) => value + 1);
                },
              },
            ] as const
          ).map((tool) => (
            <MotionPressable
              key={tool.icon}
              accessibilityRole="button"
              accessibilityLabel={tool.label}
              disabled={pending}
              onPress={tool.action}
              preset="icon"
              style={{
                flex: 1,
                minHeight: 64,
                borderRadius: 16,
                backgroundColor: palette.surfaceMuted,
                alignItems: 'center',
                justifyContent: 'flex-start',
                paddingTop: 7,
                gap: 10,
              }}
            >
              <FigmaIcon name={tool.icon} size={24} />
              <AppText role="toolLabel">{tool.label}</AppText>
            </MotionPressable>
          ))}
        </View>
        {avatar ? (
          <View
            style={{
              borderWidth: 1,
              borderColor: palette.previewBorder,
              borderRadius: 16,
              marginTop: 12,
              padding: 5,
              backgroundColor: palette.previewSurface,
              gap: designTokens.space.x3,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <CroppedPhoto
              uri={input.uri}
              loading="eager"
              component="AuthorPhoto"
              accessibilityLabel="Превью фото автора"
              fallbackLabel="Превью недоступно"
              crop={draft.crop}
              orientation={draft}
              sourceWidth={inputWidth}
              sourceHeight={inputHeight}
              style={{
                width: 48,
                height: 48,
                flexShrink: 0,
                borderRadius: 24,
                overflow: 'hidden',
              }}
            />
            <View style={{ flex: 1, gap: designTokens.space.x1 }}>
              <AppText role="segmentLabel">
                Как будет выглядеть в профиле
              </AppText>
              <AppText role="feedbackBody" tone="secondary">
                {name ?? ''}
              </AppText>
            </View>
          </View>
        ) : null}
      </View>
    </FormPageShell>
  );
}
