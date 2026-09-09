import {
  AppText,
  FormSection,
  PrimaryButton,
  SecondaryButton,
  TextField,
} from '../../components/ui';

export function ProductDraftStoryStep({
  editable,
  story,
  onChangeStory,
  savePending,
  saveError,
  onSaveAndContinue,
  onBack,
  onSkip,
}: {
  editable: boolean;
  story: string;
  onChangeStory: (value: string) => void;
  savePending: boolean;
  saveError: boolean;
  onSaveAndContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  return (
    <FormSection
      title="История создания"
      description="Необязательно. Одно текстовое поле; фото-текстовые этапы отложены."
    >
      <TextField
        label="Расскажите историю создания вашей работы"
        value={story}
        onChangeText={onChangeStory}
        placeholder="Расскажите историю создания вашей работы"
        multiline
        editable={editable}
      />
      <PrimaryButton
        label="Продолжить"
        loading={savePending}
        width="full"
        disabled={!editable}
        onPress={onSaveAndContinue}
      />
      <SecondaryButton label="Пропустить" width="full" onPress={onSkip} />
      <SecondaryButton label="Назад" width="full" onPress={onBack} />
      {saveError ? (
        <AppText role="bodySmall" tone="danger">
          Не удалось сохранить историю.
        </AppText>
      ) : null}
    </FormSection>
  );
}
