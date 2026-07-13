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

const lotFormSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  condition: z.string().trim().min(1),
});

type LotFormValues = z.infer<typeof lotFormSchema>;

export function LotCreateForm() {
  const api = useApiClient();
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);

  const form = useForm<LotFormValues>({
    resolver: zodResolver(lotFormSchema),
    defaultValues: {
      categoryId: '',
      title: '',
      description: '',
      condition: 'good',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);

    if (images.length === 0) {
      setSubmitError('Добавьте хотя бы одно изображение');
      return;
    }

    try {
      await api.lots.create(values, images);
      router.replace('/seller');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Не удалось создать лот');
    }
  });

  return (
    <Card>
      <YStack gap={spacing[2]}>
        <Heading level="h2">Создание лота</Heading>
        <Text tone="muted">
          Укажите базовые данные и загрузите изображения. Категория задается UUID,
          потому что backend пока не отдает отдельный справочник.
        </Text>
      </YStack>

      <YStack gap={spacing[3]}>
        <TextField
          label="Category ID"
          placeholder="UUID категории"
          autoComplete="off"
          {...form.register('categoryId')}
          error={form.formState.errors.categoryId?.message}
        />
        <TextField
          label="Название"
          placeholder="Название лота"
          {...form.register('title')}
          error={form.formState.errors.title?.message}
        />
        <TextAreaField
          label="Описание"
          placeholder="Подробное описание"
          {...form.register('description')}
          error={form.formState.errors.description?.message}
        />
        <SelectField
          label="Состояние"
          {...form.register('condition')}
          error={form.formState.errors.condition?.message}
        >
          <option value="excellent">excellent</option>
          <option value="good">good</option>
          <option value="fair">fair</option>
          <option value="poor">poor</option>
        </SelectField>
        <TextField
          label="Изображения"
          type="file"
          multiple
          accept="image/*"
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files ?? []);
            setImages(files);
          }}
        />
        {images.length > 0 ? (
          <YStack gap={spacing[1]}>
            {images.map((file) => (
              <Text key={file.name} size="caption" tone="muted">
                {file.name}
              </Text>
            ))}
          </YStack>
        ) : null}
        {submitError ? <Text tone="danger">{submitError}</Text> : null}
        <PrimaryButton
          onPress={onSubmit}
          isLoading={form.formState.isSubmitting}
          loadingLabel="Создаем лот"
        >
          Создать лот
        </PrimaryButton>
      </YStack>
    </Card>
  );
}
