import {
  AppText,
  FormSection,
  PrimaryButton,
  SecondaryButton,
} from '../../components/ui';

export type ProductDraftReviewStepProps = {
  editable: boolean;
  existingProductTitle: string | null | undefined;
  existingProductImagesLength: number;
  story: string;
  categoryName?: string;
  submitLabel: string;

  wizardSubmitted: boolean;
  submitPending: boolean;
  onSubmitPress: () => void;
  onBackToStory: () => void;
};

export function ProductDraftReviewStep({
  editable,
  existingProductTitle,
  existingProductImagesLength,
  story,
  categoryName,
  submitLabel,
  wizardSubmitted,
  submitPending,
  onSubmitPress,
  onBackToStory,
}: ProductDraftReviewStepProps) {
  return (
    <FormSection
      title="Проверка перед модерацией"
      description="Проверьте название, фотографии и детали. После отправки редактирование будет ограничено статусом модерации."
    >
      <AppText role="label">
        Название: {existingProductTitle ?? 'Не заполнено'}
      </AppText>
      {categoryName ? (
        <AppText role="bodySmall" tone="secondary">
          Категория: {categoryName}
        </AppText>
      ) : null}
      <AppText role="bodySmall" tone="secondary">
        Изображения: {existingProductImagesLength}/10
      </AppText>
      <AppText role="bodySmall" tone="secondary">
        История: {story.trim() ? 'заполнена' : 'пропущена'}
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
          width="full"
          onPress={() => onSubmitPress()}
        />
      )}
      <SecondaryButton
        label="Назад к истории создания"
        disabled={submitPending || wizardSubmitted}
        width="full"
        onPress={() => onBackToStory()}
      />
    </FormSection>
  );
}
