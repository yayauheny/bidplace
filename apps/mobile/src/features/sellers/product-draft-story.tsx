import {
  AppText,
  FormSection,
  PrimaryButton,
  SecondaryButton,
} from '../../components/ui';
import { ProductDraftTextField } from './product-draft-fields';

export type ProductDraftStoryStepProps = {
  editable: boolean;
  savePending: boolean;
  saveError: boolean;
  onBackToImages: () => void;
  onSaveAndContinue: () => void;
};

export function ProductDraftStoryStep({
  editable,
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
      <ProductDraftTextField
        name="story"
        label="История создания"
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
