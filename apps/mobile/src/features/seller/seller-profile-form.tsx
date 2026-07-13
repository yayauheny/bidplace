import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { SellerProfile } from '@bidplace/contracts';

import { AppButton, AppCard, AppInput, FormField } from '../../components/ui';
import { mobileSpacing } from '../../theme/tokens';
import { Text, XStack, YStack } from 'tamagui';
import { useAppThemePalette } from '../../theme/palette';
import {
  sellerProfileFormSchema,
  type SellerProfileFormValues,
} from './schemas';
import {
  useCreateSellerProfileMutation,
  useUpdateSellerProfileMutation,
} from './hooks';

type SellerProfileFormProps = {
  profile?: SellerProfile | null;
};

export function SellerProfileForm({ profile }: SellerProfileFormProps) {
  const router = useRouter();
  const palette = useAppThemePalette();
  const createMutation = useCreateSellerProfileMutation();
  const updateMutation = useUpdateSellerProfileMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<SellerProfileFormValues>({
    resolver: zodResolver(sellerProfileFormSchema),
    defaultValues: {
      slug: profile?.slug ?? '',
      sellerType: profile?.sellerType ?? 'creator',
      storeName: profile?.storeName ?? '',
      country: profile?.country ?? '',
      contactPreference: profile?.contactPreference ?? '',
      socialLink: profile?.socialLink ?? '',
      shortDescription: profile?.shortDescription ?? '',
    },
  });

  useEffect(() => {
    if (!profile) {
      return;
    }

    form.reset({
      slug: profile.slug,
      sellerType: profile.sellerType,
      storeName: profile.storeName,
      country: profile.country,
      contactPreference: profile.contactPreference,
      socialLink: profile.socialLink ?? '',
      shortDescription: profile.shortDescription ?? '',
    });
  }, [form, profile]);

  const isEditing = Boolean(profile);
  const mutation = isEditing ? updateMutation : createMutation;

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      if (isEditing) {
        await updateMutation.mutateAsync(values);
      } else {
        await createMutation.mutateAsync(values);
      }
      router.back();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Не удалось сохранить профиль');
    }
  });

  return (
    <AppCard>
      <YStack style={{ gap: mobileSpacing[4] }}>
        <YStack style={{ gap: mobileSpacing[1] }}>
          <Text style={{ fontSize: 24, lineHeight: 30, fontWeight: '700', color: palette.text }}>
            {isEditing ? 'Редактировать профиль' : 'Создать профиль продавца'}
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: palette.textMuted }}>
            {isEditing
              ? 'Обновите публичные данные продавца.'
              : 'Создайте seller profile, чтобы открыть lot и auction сценарии.'}
          </Text>
        </YStack>

        <YStack style={{ gap: mobileSpacing[3] }}>
          <AppInput
            label="Slug"
            description="Используется в публичной ссылке профиля."
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="demo-store"
            {...form.register('slug')}
            error={form.formState.errors.slug?.message}
          />

          <FormField
            label="Тип продавца"
            error={form.formState.errors.sellerType?.message}
            description="Выберите один тип, который лучше описывает ваш профиль."
          >
            <XStack style={{ gap: mobileSpacing[2], flexWrap: 'wrap' }}>
              {(['creator', 'influencer'] as const).map((option) => {
                const selected = form.watch('sellerType') === option;

                return (
                  <AppButton
                    key={option}
                    tone={selected ? 'primary' : 'secondary'}
                    onPress={() => form.setValue('sellerType', option, { shouldValidate: true })}
                  >
                    {option === 'creator' ? 'Creator' : 'Influencer'}
                  </AppButton>
                );
              })}
            </XStack>
          </FormField>

          <AppInput
            label="Название магазина"
            placeholder="Demo Store"
            {...form.register('storeName')}
            error={form.formState.errors.storeName?.message}
          />

          <AppInput
            label="Страна"
            placeholder="BY"
            autoCapitalize="characters"
            {...form.register('country')}
            error={form.formState.errors.country?.message}
          />

          <AppInput
            label="Контакт"
            description="Например, Telegram, email или WhatsApp."
            placeholder="telegram"
            {...form.register('contactPreference')}
            error={form.formState.errors.contactPreference?.message}
          />

          <AppInput
            label="Ссылка"
            description="Опционально."
            placeholder="https://example.com"
            autoCapitalize="none"
            autoCorrect={false}
            {...form.register('socialLink', {
              setValueAs: (value) => (value === '' ? null : value),
            })}
            error={form.formState.errors.socialLink?.message as string | undefined}
          />

          <AppInput
            label="Описание"
            description="Опционально."
            placeholder="Коротко о магазине"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            {...form.register('shortDescription', {
              setValueAs: (value) => (value === '' ? null : value),
            })}
            error={form.formState.errors.shortDescription?.message as string | undefined}
          />

          {submitError ? (
            <Text style={{ color: palette.danger, fontSize: 14, lineHeight: 20 }}>
              {submitError}
            </Text>
          ) : null}

          <AppButton
            onPress={onSubmit}
            isLoading={mutation.isPending}
            loadingLabel={isEditing ? 'Сохраняем' : 'Создаём профиль'}
          >
            {isEditing ? 'Сохранить' : 'Создать профиль'}
          </AppButton>
        </YStack>
      </YStack>
    </AppCard>
  );
}
