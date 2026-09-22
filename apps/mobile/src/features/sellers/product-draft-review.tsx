import {
  AppText,
  FormSection,
  PrimaryButton,
  SecondaryButton,
} from '../../components/ui';

export type ProductDraftReviewStepProps = {
  editable: boolean;
  title: string;
  existingProductImagesLength: number;
  hasStory: boolean;
  submitLabel: string;

  wizardSubmitted: boolean;
  submitPending: boolean;
  onSubmitPress: () => void;
  onBackToStory: () => void;
};

export function ProductDraftReviewStep({
  editable,
  title,
  existingProductImagesLength,
  hasStory,
  submitLabel,
  wizardSubmitted,
  submitPending,
  onSubmitPress,
  onBackToStory,
}: ProductDraftReviewStepProps) {
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
      <SecondaryButton
        label="Назад к истории создания"
        disabled={submitPending || wizardSubmitted}
        onPress={() => onBackToStory()}
      />
    </FormSection>
  );
}
