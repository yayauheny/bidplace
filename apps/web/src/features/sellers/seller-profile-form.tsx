'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useApiClient } from '../../providers/api-provider';
import { PrimaryButton, SelectField, TextAreaField, TextField } from '../../components/ui/controls';
import { Heading, Text } from '../../components/ui/layout';
import { Card } from '../../components/ui/surfaces';
import { spacing } from '../../theme/tokens';
import { YStack } from '../../components/ui/stack';

const sellerProfileFormSchema = z.object({
  slug: z.string().trim().min(1),
  sellerType: z.enum(['creator', 'influencer']),
  storeName: z.string().trim().min(1),
  country: z.string().trim().min(1),
  contactPreference: z.string().trim().min(1),
  socialLink: z.string().trim().optional().or(z.literal('')),
  shortDescription: z.string().trim().optional().or(z.literal('')),
});

export type SellerProfileFormValues = z.infer<typeof sellerProfileFormSchema>;

function toOptional(value?: string | null) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

type SellerProfileFormProps = {
  mode: 'create' | 'update';
  initialValues?: Partial<SellerProfileFormValues>;
};

export function SellerProfileForm({
  mode,
  initialValues,
}: SellerProfileFormProps) {
  const api = useApiClient();
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<SellerProfileFormValues>({
    resolver: zodResolver(sellerProfileFormSchema),
    defaultValues: {
      slug: initialValues?.slug ?? '',
      sellerType: initialValues?.sellerType ?? 'creator',
      storeName: initialValues?.storeName ?? '',
      country: initialValues?.country ?? '',
      contactPreference: initialValues?.contactPreference ?? '',
      socialLink: initialValues?.socialLink ?? '',
      shortDescription: initialValues?.shortDescription ?? '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);

    const payload = {
      slug: values.slug.trim(),
      sellerType: values.sellerType,
      storeName: values.storeName.trim(),
      country: values.country.trim(),
      contactPreference: values.contactPreference.trim(),
      socialLink: toOptional(values.socialLink),
      shortDescription: toOptional(values.shortDescription),
    };

    try {
      if (mode === 'create') {
        await api.sellers.createProfile(payload);
      } else {
        await api.sellers.updateProfile(payload);
      }

      router.replace('/seller');
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Не удалось сохранить профиль',
      );
    }
  });

  return (
    <Card>
      <YStack gap={spacing[2]}>
        <Heading level="h2">
          {mode === 'create' ? 'Создание seller профиля' : 'Редактирование seller профиля'}
        </Heading>
        <Text tone="muted">
          {mode === 'create'
            ? 'Заполните профиль продавца, чтобы открыть создание лотов и аукционов.'
            : 'Обновите реквизиты и публичную информацию о магазине.'}
        </Text>
      </YStack>

      <YStack gap={spacing[3]}>
        <TextField
          label="Slug"
          placeholder="demo-store"
          autoComplete="off"
          {...form.register('slug')}
          error={form.formState.errors.slug?.message}
        />
        <SelectField
          label="Тип продавца"
          {...form.register('sellerType')}
          error={form.formState.errors.sellerType?.message}
        >
          <option value="creator">creator</option>
          <option value="influencer">influencer</option>
        </SelectField>
        <TextField
          label="Название магазина"
          placeholder="Demo Store"
          {...form.register('storeName')}
          error={form.formState.errors.storeName?.message}
        />
        <TextField
          label="Страна"
          placeholder="BY"
          {...form.register('country')}
          error={form.formState.errors.country?.message}
        />
        <TextField
          label="Предпочтительный контакт"
          placeholder="telegram"
          {...form.register('contactPreference')}
          error={form.formState.errors.contactPreference?.message}
        />
        <TextField
          label="Социальная ссылка"
          placeholder="https://..."
          autoComplete="url"
          {...form.register('socialLink')}
          error={form.formState.errors.socialLink?.message}
        />
        <TextAreaField
          label="Короткое описание"
          placeholder="Расскажите о магазине"
          {...form.register('shortDescription')}
          error={form.formState.errors.shortDescription?.message}
        />
        {submitError ? <Text tone="danger">{submitError}</Text> : null}
        <PrimaryButton
          onPress={onSubmit}
          isLoading={form.formState.isSubmitting}
          loadingLabel="Сохраняем"
        >
          {mode === 'create' ? 'Создать профиль' : 'Сохранить изменения'}
        </PrimaryButton>
      </YStack>
    </Card>
  );
}
