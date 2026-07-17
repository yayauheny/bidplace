import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { AppButton, AppCard, ControlledAppInput, EmptyState, ErrorState, FormField, LoadingState } from '../../components/ui';
import { mobileSpacing } from '../../theme/tokens';
import { Text, XStack, YStack } from 'tamagui';
import { useAppThemePalette } from '../../theme/palette';
import {
  useCreateLotMutation,
  useSellerCategoriesQuery,
} from './hooks';
import {
  getUserFacingErrorMessage,
} from '../../lib/errors';
import { lotFormSchema, type LotFormValues } from './schemas';
import {
  assetToBlob,
  getImageAssetKey,
  mergeSelectedImages,
} from './form-helpers';
import { useSellerProfileRequirement } from './profile-requirement';
import { SelectedLotImages } from './selected-lot-images';

export function LotCreateForm() {
  const router = useRouter();
  const palette = useAppThemePalette();
  const profileRequirement = useSellerProfileRequirement(
    'Не удалось проверить seller profile',
  );
  const categoriesQuery = useSellerCategoriesQuery();
  const createLotMutation = useCreateLotMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<ImagePicker.ImagePickerAsset[]>([]);

  const categories = categoriesQuery.data?.categories ?? [];

  const form = useForm<LotFormValues>({
    resolver: zodResolver(lotFormSchema),
    defaultValues: {
      categoryId: '',
      title: '',
      description: '',
      condition: '',
    },
  });

  const selectedCategoryId = form.watch('categoryId');
  const canSubmit = useMemo(
    () => categories.length > 0 && !createLotMutation.isPending,
    [categories.length, createLotMutation.isPending],
  );

  if (profileRequirement.kind === 'loading') {
    return <LoadingState label="Проверяем seller profile" />;
  }

  if (profileRequirement.kind === 'missing') {
    return (
      <EmptyState
        title="Сначала создайте профиль продавца"
        description="Lot creation доступен только после настройки seller profile."
        actionLabel="Создать профиль"
        onAction={() => router.push('/profile')}
      />
    );
  }

  if (profileRequirement.kind === 'error') {
    return (
      <ErrorState
        description={profileRequirement.message}
        onAction={() => profileRequirement.retry()}
      />
    );
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      setImageError(null);
      const images = await Promise.all(selectedImages.map(assetToBlob));
      await createLotMutation.mutateAsync({
        input: values,
        images,
      });
      router.back();
    } catch (error) {
      setSubmitError(getUserFacingErrorMessage(error, 'Не удалось создать lot'));
    }
  });

  if (categoriesQuery.isLoading) {
    return <LoadingState label="Загружаем категории" />;
  }

  if (categoriesQuery.isError) {
    return (
      <AppCard>
        <YStack style={{ gap: mobileSpacing[2] }}>
          <Text style={{ fontSize: 16, lineHeight: 24, fontWeight: '700', color: palette.text }}>
            Категории недоступны
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: palette.textMuted }}>
            {getUserFacingErrorMessage(
              categoriesQuery.error,
              'Не удалось загрузить категории',
            )}
          </Text>
          <AppButton tone="secondary" onPress={() => categoriesQuery.refetch()}>
            Повторить
          </AppButton>
        </YStack>
      </AppCard>
    );
  }

  return (
    <AppCard>
      <YStack style={{ gap: mobileSpacing[4] }}>
        <YStack style={{ gap: mobileSpacing[1] }}>
          <Text style={{ fontSize: 24, lineHeight: 30, fontWeight: '700', color: palette.text }}>
            Создать lot
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: palette.textMuted }}>
            Lot создаётся как draft и может быть опубликован позже через auction flow.
          </Text>
        </YStack>

        <YStack style={{ gap: mobileSpacing[3] }}>
          <FormField
            label="Категория"
            error={form.formState.errors.categoryId?.message}
            description="Выберите категорию из seed-списка."
            required
          >
            <YStack style={{ gap: mobileSpacing[2] }}>
              {categories.map((category) => {
                const selected = selectedCategoryId === category.id;
                return (
                  <AppButton
                    key={category.id}
                    tone={selected ? 'primary' : 'secondary'}
                    onPress={() =>
                      form.setValue('categoryId', category.id, { shouldValidate: true })
                    }
                  >
                    {category.name}
                  </AppButton>
                );
              })}
            </YStack>
          </FormField>

          <ControlledAppInput
            control={form.control}
            name="title"
            label="Название"
            placeholder="Signed Ceramic Vase"
            error={form.formState.errors.title?.message}
          />

          <ControlledAppInput
            control={form.control}
            name="description"
            label="Описание"
            placeholder="Handmade ceramic vase."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            error={form.formState.errors.description?.message}
          />

          <ControlledAppInput
            control={form.control}
            name="condition"
            label="Состояние"
            placeholder="excellent"
            error={form.formState.errors.condition?.message}
          />

          <YStack style={{ gap: mobileSpacing[2] }}>
            <AppButton
              tone="secondary"
              onPress={async () => {
                try {
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsMultipleSelection: true,
                    quality: 0.85,
                  });

                  if (!result.canceled) {
                    setSelectedImages((currentImages) =>
                      mergeSelectedImages(currentImages, result.assets),
                    );
                  }
                } catch (error) {
                  setImageError(
                    getUserFacingErrorMessage(
                      error,
                      'Не удалось выбрать изображения',
                    ),
                  );
                }
              }}
            >
              Добавить изображения
            </AppButton>
            {imageError ? (
              <Text style={{ color: palette.danger, fontSize: 12, lineHeight: 16 }}>
                {imageError}
              </Text>
            ) : null}
            <SelectedLotImages
              images={selectedImages}
              onRemove={(imageKey) =>
                setSelectedImages((currentImages) =>
                  currentImages.filter(
                    (image) => getImageAssetKey(image) !== imageKey,
                  ),
                )
              }
            />
            {selectedImages.length > 0 ? (
              <AppButton tone="subtle" onPress={() => setSelectedImages([])}>
                Очистить выбор
              </AppButton>
            ) : null}
          </YStack>

          {submitError ? (
            <Text style={{ color: palette.danger, fontSize: 14, lineHeight: 20 }}>
              {submitError}
            </Text>
          ) : null}

          <XStack style={{ gap: mobileSpacing[2] }}>
            <AppButton tone="secondary" onPress={() => router.back()}>
              Отмена
            </AppButton>
            <AppButton onPress={onSubmit} isLoading={createLotMutation.isPending} disabled={!canSubmit}>
              Создать lot
            </AppButton>
          </XStack>
        </YStack>
      </YStack>
    </AppCard>
  );
}
