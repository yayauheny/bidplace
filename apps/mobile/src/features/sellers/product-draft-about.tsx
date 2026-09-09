import { FormPageColumns } from '../../components/layout';
import {
  AppText,
  FormSection,
  PrimaryButton,
  SecondaryButton,
  TextField,
} from '../../components/ui';
import {
  productWizardStep,
  productWizardStepOneIncompleteMessage,
} from './product-draft-wizard';

type StepOneErrors = {
  categoryId?: string;
  title?: string;
  year?: string;
  uniqueness?: string;
};

export type ProductDraftAboutSection = 'title' | 'details' | 'all';

export type ProductDraftAboutStepProps = {
  isCreationFlow: boolean;
  wizardStep: number;
  section: ProductDraftAboutSection;

  editable: boolean;
  categories: Array<{ id: string; name: string }>;

  categoryId: string;
  onChangeCategoryId: (id: string) => void;

  technique: string;
  onChangeTechnique: (value: string) => void;
  materials: string;
  onChangeMaterials: (value: string) => void;
  dimensions: string;
  onChangeDimensions: (value: string) => void;
  weight: string;
  onChangeWeight: (value: string) => void;
  year: string;
  onChangeYear: (value: string) => void;

  city: string;
  onChangeCity: (value: string) => void;
  packaging: string;
  onChangePackaging: (value: string) => void;
  deliveryInfo: string;
  onChangeDeliveryInfo: (value: string) => void;

  title: string;
  onChangeTitle: (value: string) => void;
  uniqueness: string;
  onChangeUniqueness: (value: string) => void;
  condition: string;
  provenance: string;
  onChangeProvenance: (value: string) => void;

  stepOneAttempted: boolean;
  stepOneErrors: StepOneErrors;
  canSaveCurrentSection: boolean;

  saveIsPending: boolean;
  saveIsError: boolean;

  onSavePress: () => void;

  wizardCanContinue: boolean;
  continueLabel: string;
  onContinue: () => void;
};

export function ProductDraftAboutStep({
  isCreationFlow,
  wizardStep,
  section,
  editable,
  categories,
  categoryId,
  onChangeCategoryId,
  technique,
  onChangeTechnique,
  materials,
  onChangeMaterials,
  dimensions,
  onChangeDimensions,
  weight,
  onChangeWeight,
  year,
  onChangeYear,
  city,
  onChangeCity,
  packaging,
  onChangePackaging,
  deliveryInfo,
  onChangeDeliveryInfo,
  title,
  onChangeTitle,
  uniqueness,
  onChangeUniqueness,
  condition,
  provenance,
  onChangeProvenance,
  stepOneAttempted,
  stepOneErrors,
  canSaveCurrentSection,
  saveIsPending,
  saveIsError,
  onSavePress,
  wizardCanContinue,
  continueLabel,
  onContinue,
}: ProductDraftAboutStepProps) {
  const showTitle = section === 'title' || section === 'all';
  const showDetails = section === 'details' || section === 'all';
  const showLogistics = section === 'all';
  const saveLabel = isCreationFlow
    ? 'Сохранить и продолжить'
    : 'Сохранить изменения';

  return (
    <>
      {showTitle ? (
        <FormSection
          title={isCreationFlow ? 'Название' : 'О работе'}
          description={
            isCreationFlow
              ? 'Основная информация для каталога.'
              : 'Основная информация для каталога и страницы предмета.'
          }
        >
          <TextField
            label="Название"
            value={title}
            onChangeText={onChangeTitle}
            placeholder="Название"
            editable={editable}
            required
            error={stepOneAttempted ? stepOneErrors.title : undefined}
          />
        </FormSection>
      ) : null}

      {showDetails ? (
        <FormPageColumns
          sidebar={
            <FormSection
              title="Характеристики"
              description="Параметры помогают точно описать работу."
            >
              <TextField
                label="Техника"
                value={technique}
                onChangeText={onChangeTechnique}
                placeholder="Необязательно"
                editable={editable}
              />
              <TextField
                label="Материал"
                value={materials}
                onChangeText={onChangeMaterials}
                placeholder="Необязательно"
                editable={editable}
              />
              <TextField
                label="Размеры"
                value={dimensions}
                onChangeText={onChangeDimensions}
                placeholder="Необязательно"
                editable={editable}
              />
              {section === 'all' ? (
                <TextField
                  label="Вес"
                  value={weight}
                  onChangeText={onChangeWeight}
                  placeholder="Необязательно"
                  editable={editable}
                />
              ) : null}
              <TextField
                label="Год создания"
                value={year}
                onChangeText={onChangeYear}
                placeholder="Необязательно"
                keyboardType="number-pad"
                editable={editable}
                error={stepOneAttempted ? stepOneErrors.year : undefined}
              />
              <TextField
                label="Тираж"
                value={uniqueness}
                onChangeText={onChangeUniqueness}
                placeholder="Единственный экземпляр или тираж"
                editable={editable}
                required
                error={stepOneAttempted ? stepOneErrors.uniqueness : undefined}
              />
              {condition ? (
                <AppText role="bodySmall" tone="secondary">
                  Состояние: {condition}
                </AppText>
              ) : null}
              {section === 'all' ? (
                <TextField
                  label="Происхождение"
                  value={provenance}
                  onChangeText={onChangeProvenance}
                  placeholder="Необязательно"
                  multiline
                  editable={editable}
                />
              ) : null}
            </FormSection>
          }
        >
          <FormSection title="Категория">
            {categories.map((category) => (
              <SecondaryButton
                key={category.id}
                label={
                  categoryId === category.id
                    ? `✓ ${category.name}`
                    : category.name
                }
                disabled={!editable}
                width="full"
                onPress={() => onChangeCategoryId(category.id)}
              />
            ))}
            {stepOneAttempted && stepOneErrors.categoryId ? (
              <AppText role="bodySmall" tone="danger">
                {stepOneErrors.categoryId}
              </AppText>
            ) : null}
          </FormSection>
        </FormPageColumns>
      ) : null}

      {showLogistics ? (
        <FormSection title="Логистика">
          <TextField
            label="Город"
            value={city}
            onChangeText={onChangeCity}
            placeholder="Город"
            editable={editable}
          />
          <TextField
            label="Упаковка"
            value={packaging}
            onChangeText={onChangePackaging}
            placeholder="Необязательно"
            multiline
            editable={editable}
          />
          <TextField
            label="Передача или доставка"
            value={deliveryInfo}
            onChangeText={onChangeDeliveryInfo}
            placeholder="Необязательно"
            multiline
            editable={editable}
          />
        </FormSection>
      ) : null}

      {editable ? (
        <PrimaryButton
          label={saveLabel}
          loading={saveIsPending}
          width="full"
          onPress={onSavePress}
        />
      ) : null}

      {isCreationFlow && stepOneAttempted && !canSaveCurrentSection ? (
        <AppText role="bodySmall" tone="danger">
          {productWizardStepOneIncompleteMessage}
        </AppText>
      ) : null}

      {isCreationFlow &&
      (wizardStep === productWizardStep.photos ||
        wizardStep === productWizardStep.details) &&
      wizardCanContinue ? (
        <SecondaryButton
          label={continueLabel}
          width="full"
          onPress={onContinue}
        />
      ) : null}

      {saveIsError ? (
        <AppText role="bodySmall" tone="danger">
          Не удалось сохранить предмет.
        </AppText>
      ) : null}
    </>
  );
}
