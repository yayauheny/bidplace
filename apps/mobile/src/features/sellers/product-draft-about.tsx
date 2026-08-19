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
  story?: string;
  year?: string;
  uniqueness?: string;
  provenance?: string;
  city?: string;
  deliveryInfo?: string;
};

export type ProductDraftAboutStepProps = {
  isCreationFlow: boolean;
  wizardStep: number;

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
  story: string;
  onChangeStory: (value: string) => void;
  uniqueness: string;
  onChangeUniqueness: (value: string) => void;
  condition: string;
  provenance: string;
  onChangeProvenance: (value: string) => void;

  stepOneAttempted: boolean;
  stepOneErrors: StepOneErrors;
  canSaveStepOne: boolean;

  saveIsPending: boolean;
  saveIsError: boolean;

  onSavePress: () => void;

  wizardCanOpenImages: boolean;
  onContinueToImages: () => void;
};

export function ProductDraftAboutStep({
  isCreationFlow,
  wizardStep,
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
  story,
  onChangeStory,
  uniqueness,
  onChangeUniqueness,
  condition,
  provenance,
  onChangeProvenance,
  stepOneAttempted,
  stepOneErrors,
  canSaveStepOne,
  saveIsPending,
  saveIsError,
  onSavePress,
  wizardCanOpenImages,
  onContinueToImages,
}: ProductDraftAboutStepProps) {
  const titleLabel = isCreationFlow
    ? 'Сохранить и продолжить'
    : 'Сохранить изменения';

  return (
    <>
      <FormPageColumns
        sidebar={
          <>
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
              <TextField
                label="Вес"
                value={weight}
                onChangeText={onChangeWeight}
                placeholder="Необязательно"
                editable={editable}
              />
              <TextField
                label="Год создания"
                value={year}
                onChangeText={onChangeYear}
                placeholder="Необязательно"
                keyboardType="number-pad"
                editable={editable}
                error={stepOneAttempted ? stepOneErrors.year : undefined}
              />
            </FormSection>
            <FormSection title="Логистика">
              <TextField
                label="Город"
                value={city}
                onChangeText={onChangeCity}
                placeholder="Город"
                editable={editable}
                required
                error={stepOneAttempted ? stepOneErrors.city : undefined}
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
                placeholder="Передача или доставка"
                multiline
                editable={editable}
                required
                error={
                  stepOneAttempted ? stepOneErrors.deliveryInfo : undefined
                }
              />
            </FormSection>
          </>
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
              width="block"
              onPress={() => onChangeCategoryId(category.id)}
            />
          ))}
          {stepOneAttempted && stepOneErrors.categoryId ? (
            <AppText role="bodySmall" tone="danger">
              {stepOneErrors.categoryId}
            </AppText>
          ) : null}
        </FormSection>

        <FormSection
          title="О работе"
          description="Основная информация для каталога и страницы предмета."
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
          <TextField
            label="История предмета"
            value={story}
            onChangeText={onChangeStory}
            placeholder="История предмета"
            multiline
            editable={editable}
            required
            error={stepOneAttempted ? stepOneErrors.story : undefined}
          />
          <TextField
            label="Уникальность или тираж"
            value={uniqueness}
            onChangeText={onChangeUniqueness}
            placeholder="Уникальность или тираж"
            editable={editable}
            required
            error={
              stepOneAttempted ? stepOneErrors.uniqueness : undefined
            }
          />
          {condition ? (
            <AppText role="bodySmall" tone="secondary">
              Состояние: {condition}
            </AppText>
          ) : null}
          <TextField
            label="Происхождение"
            value={provenance}
            onChangeText={onChangeProvenance}
            placeholder="Происхождение"
            multiline
            editable={editable}
            required
            error={stepOneAttempted ? stepOneErrors.provenance : undefined}
          />
        </FormSection>
      </FormPageColumns>

      {!isCreationFlow || wizardStep === productWizardStep.about ? (
        <AppText role="bodySmall" tone="secondary">
          Дата размещения установится автоматически при первой публичной
          публикации.
        </AppText>
      ) : null}

      {editable && (!isCreationFlow || wizardStep === productWizardStep.about) ? (
        <PrimaryButton
          label={titleLabel}
          loading={saveIsPending}
          width="block"
          onPress={onSavePress}
        />
      ) : null}

      {isCreationFlow &&
      wizardStep === productWizardStep.about &&
      stepOneAttempted &&
      !canSaveStepOne ? (
        <AppText role="bodySmall" tone="danger">
          {productWizardStepOneIncompleteMessage}
        </AppText>
      ) : null}

      {isCreationFlow &&
      wizardStep === productWizardStep.about &&
      wizardCanOpenImages ? (
        <SecondaryButton
          label="Продолжить к изображениям"
          width="block"
          onPress={onContinueToImages}
        />
      ) : null}

      {saveIsError && (!isCreationFlow || wizardStep === productWizardStep.about) ? (
        <AppText role="bodySmall" tone="danger">
          Не удалось сохранить предмет.
        </AppText>
      ) : null}
    </>
  );
}

