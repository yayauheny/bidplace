import {
  AppText,
  FormSection,
  PrimaryButton,
  SecondaryButton,
} from '../../components/ui';

import type { DraftCreationStep } from './product-draft-creation';

export type ProductDraftReviewStepProps = {
  editable: boolean;
  existingProductTitle: string | null | undefined;
  existingProductImagesLength: number;
  creationSteps: DraftCreationStep[];
  submitLabel: string;

  wizardSubmitted: boolean;
  submitPending: boolean;
  onSubmitPress: () => void;
  onBackToCreation: () => void;
};

export function ProductDraftReviewStep({
  editable,
  existingProductTitle,
  existingProductImagesLength,
  creationSteps,
  submitLabel,
  wizardSubmitted,
  submitPending,
  onSubmitPress,
  onBackToCreation,
}: ProductDraftReviewStepProps) {
  return (
    <FormSection
      title="Проверка перед модерацией"
      description="Проверьте обязательные поля, изображения и историю создания. После отправки редактирование будет ограничено статусом модерации."
    >
      <AppText role="label">
        Название: {existingProductTitle ?? 'Не заполнено'}
      </AppText>
      <AppText role="bodySmall" tone="secondary">
        Изображения: {existingProductImagesLength}/10 · Этапы истории:{' '}
        {
          creationSteps.filter(
            (step) => step.title.trim() && step.body.trim(),
          ).length
        }
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
      <SecondaryButton
        label="Назад к истории создания"
        disabled={submitPending || wizardSubmitted}
        onPress={() => onBackToCreation()}
      />
    </FormSection>
  );
}

