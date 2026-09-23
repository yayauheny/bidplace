import {
  AppText,
  FormSection,
  PrimaryButton,
  SecondaryButton,
  TextField,
} from '../../components/ui';

export type ProductDraftStoryStepProps = {
  editable: boolean;
  story: string;
  onChangeStory: (value: string) => void;
  savePending: boolean;
  saveError: boolean;
  onBackToImages: () => void;
  onSaveAndContinue: () => void;
};

export function ProductDraftStoryStep({
  editable,
  story,
  onChangeStory,
  savePending,
  saveError,
  onBackToImages,
  onSaveAndContinue,
}: ProductDraftStoryStepProps) {
  return (
    <FormSection
      title="История создания"
      description="Расскажите о замысле и процессе обычным текстом. Этот шаг можно оставить пустым."
    >
      <TextField
        label="История создания"
        value={story}
        onChangeText={onChangeStory}
        placeholder="Необязательно"
        multiline
        editable={editable}
      />
      {saveError ? (
        <AppText role="bodySmall" tone="danger">
          Не удалось сохранить историю создания.
        </AppText>
      ) : null}
      <SecondaryButton
        label="Назад к изображениям"
        disabled={savePending}
        onPress={onBackToImages}
      />
      <PrimaryButton
        label="Сохранить и перейти к проверке"
        loading={savePending}
        disabled={!editable}
        onPress={onSaveAndContinue}
      />
    </FormSection>
  );
}
