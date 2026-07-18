import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { XStack, YStack } from 'tamagui';
import type { SellerProfile } from '@bidplace/contracts';

import {
  AppButton,
  AppCard,
  ControlledAppInput,
  FormField,
  PageIntro,
} from '../../components/ui';
import { getUserFacingErrorMessage } from '../../lib/errors';
import { mobileSpacing } from '../../theme/tokens';
import { useCreateSellerProfileMutation, useUpdateSellerProfileMutation } from './hooks';
import {
  sellerProfileFormSchema,
  type SellerProfileFormValues,
} from './schemas';

type SellerProfileFormProps = {
  profile?: SellerProfile | null;
};

function parseOptionalText(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue === '' ? null : value;
}

export function SellerProfileForm({ profile }: SellerProfileFormProps) {
  const router = useRouter();
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
      setSubmitError(getUserFacingErrorMessage(error, 'Не удалось сохранить профиль'));
    }
  });

  return (
    <AppCard>
      <YStack style={{ gap: mobileSpacing[4] }}>
        <PageIntro
          title={isEditing ? 'Редактировать профиль' : 'Создать профиль продавца'}
          description={
            isEditing
              ? 'Обновите публичные данные продавца.'
              : 'Создайте seller profile, чтобы открыть lot и auction сценарии.'
          }
        />

        <YStack style={{ gap: mobileSpacing[3] }}>
          <ControlledAppInput
            control={form.control}
            name="slug"
            label="Slug"
            description="Используется в публичной ссылке профиля."
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="demo-store"
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

          <ControlledAppInput
            control={form.control}
            name="storeName"
            label="Название магазина"
            placeholder="Demo Store"
            error={form.formState.errors.storeName?.message}
          />

          <ControlledAppInput
            control={form.control}
            name="country"
            label="Страна"
            placeholder="BY"
            autoCapitalize="characters"
            error={form.formState.errors.country?.message}
          />

          <ControlledAppInput
            control={form.control}
            name="contactPreference"
            label="Контакт"
            description="Например, Telegram, email или WhatsApp."
            placeholder="telegram"
            error={form.formState.errors.contactPreference?.message}
          />

          <ControlledAppInput
            control={form.control}
            name="socialLink"
            label="Ссылка"
            description="Опционально."
            placeholder="https://example.com"
            autoCapitalize="none"
            autoCorrect={false}
            parseValue={parseOptionalText}
            error={form.formState.errors.socialLink?.message}
          />

          <ControlledAppInput
            control={form.control}
            name="shortDescription"
            label="Описание"
            description="Опционально."
            placeholder="Коротко о магазине"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            parseValue={parseOptionalText}
            error={form.formState.errors.shortDescription?.message}
          />

          {submitError ? (
            <YStack>
              <AppButton tone="subtle" disabled>
                {submitError}
              </AppButton>
            </YStack>
          ) : null}

          <AppButton
            onPress={onSubmit}
            isLoading={mutation.isPending}
            loadingLabel={isEditing ? 'Сохраняем' : 'Создаём профиль'}
            buttonSize="large"
          >
            {isEditing ? 'Сохранить' : 'Создать профиль'}
          </AppButton>
        </YStack>
      </YStack>
    </AppCard>
  );
}
