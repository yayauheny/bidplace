import { useWatch } from 'react-hook-form';

import {
  AppText,
  FormSection,
  PrimaryButton,
  SecondaryButton,
} from '../../components/ui';
import type { ProductDraftFormValues } from './product-draft-form';

export type ProductDraftReviewStepProps = {
  editable: boolean;
  existingProductImagesLength: number;
  submitLabel: string;

  wizardSubmitted: boolean;
  submitPending: boolean;
  submitError: boolean;
  onSubmitPress: () => void;
  onBackToStory: () => void;
};

export function ProductDraftReviewStep({
  editable,
  existingProductImagesLength,
  submitLabel,
  wizardSubmitted,
  submitPending,
  submitError,
  onSubmitPress,
  onBackToStory,
}: ProductDraftReviewStepProps) {
  const [title = '', story = ''] = useWatch<ProductDraftFormValues, ['title', 'story']>({
    name: ['title', 'story'],
  });
  const hasStory = Boolean(story.trim());
  return (
    <FormSection
      title="Проверка перед модерацией"
      description="Проверьте обязательные поля, изображения и историю создания. После отправки редактирование будет ограничено статусом модерации."
    >
      <AppText role="label">Название: {title.trim() || 'Не заполнено'}</AppText>
      <AppText role="bodySmall" tone="secondary">
        Изображения: {existingProductImagesLength}/10 · История:{' '}
        {hasStory ? 'заполнена' : 'не заполнена'}
      </AppText>
      {wizardSubmitted ? (
        <AppText role="bodySmall" tone="success">
          Предмет отправлен на модерацию.
        </AppText>
      ) : (
        <PrimaryButton
          label={submitLabel}
          loading={submitPending}
          disabled={!editable || existingProductImagesLength < 1}
          onPress={() => onSubmitPress()}
        />
      )}
      {submitError ? (
        <AppText role="bodySmall" tone="danger">
          Не удалось отправить предмет на модерацию. Проверьте обязательные поля
          и попробуйте ещё раз.
        </AppText>
      ) : null}
      <SecondaryButton
        label="Назад к истории создания"
        disabled={submitPending || wizardSubmitted}
        onPress={() => onBackToStory()}
      />
    </FormSection>
  );
}
