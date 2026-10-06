import { useFormContext, useFormState, useWatch } from 'react-hook-form';

import { FormPageColumns } from '../../components/layout';
import {
  AppText,
  FormSection,
  PrimaryButton,
  SecondaryButton,
} from '../../components/ui';
import { ProductDraftTextField, useProductDraftWriteGuard } from './product-draft-fields';
import {
  emptyProductDraftFormValues,
  productDraftRequiredErrors,
  type ProductDraftFormValues,
} from './product-draft-form';
import {
  productWizardStep,
  productWizardStepOneIncompleteMessage,
} from './product-draft-wizard';

export type ProductDraftAboutStepProps = {
  isCreationFlow: boolean;
  wizardStep: number;
  editable: boolean;
  categories: Array<{ id: string; name: string }>;
  stepOneAttempted: boolean;
  saveIsPending: boolean;
  saveIsError: boolean;
  saveMessage?: string | null;
  onSavePress: () => void;
  wizardCanOpenImages: boolean;
  onContinueToImages: () => void;
};

export function ProductDraftAboutStep({
  isCreationFlow,
  wizardStep,
  editable,
  categories,
  stepOneAttempted,
  saveIsPending,
  saveIsError,
  saveMessage,
  onSavePress,
  wizardCanOpenImages,
  onContinueToImages,
}: ProductDraftAboutStepProps) {
  const guard = useProductDraftWriteGuard();
  const { control, setValue } = useFormContext<ProductDraftFormValues>();
  const [categoryId = '', title = ''] = useWatch({
    control,
    name: ['categoryId', 'title'],
  });
  const { errors } = useFormState({ control, name: 'year' });
  const requiredErrors = productDraftRequiredErrors({
    ...emptyProductDraftFormValues,
    categoryId,
    title,
  });
  const yearError = typeof errors.year?.message === 'string' ? errors.year.message : undefined;
  const canSaveStepOne = !requiredErrors.categoryId && !requiredErrors.title && !yearError;
  const titleLabel = isCreationFlow ? 'Сохранить и продолжить' : 'Сохранить изменения';

  return (
    <>
      <FormPageColumns
        sidebar={
          <FormSection
            title="Характеристики"
            description="Параметры помогают точно описать работу."
          >
            <ProductDraftTextField
              name="technique"
              label="Техника"
              placeholder="Необязательно"
              editable={editable}
            />
            <ProductDraftTextField
              name="materials"
              label="Материал"
              placeholder="Необязательно"
              editable={editable}
            />
            <ProductDraftTextField
              name="dimensions"
              label="Размеры"
              placeholder="Необязательно"
              editable={editable}
            />
            <ProductDraftTextField
              name="year"
              label="Год создания"
              placeholder="Необязательно"
              keyboardType="number-pad"
              editable={editable}
              error={stepOneAttempted ? yearError : null}
            />
          </FormSection>
        }
      >
        <FormSection title="Категория">
          {categories.map((category) => (
            <SecondaryButton
              key={category.id}
              label={categoryId === category.id ? `✓ ${category.name}` : category.name}
              disabled={!editable}
              width="block"
              onPress={() => {
                if (guard.current) return;
                setValue('categoryId', category.id, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                });
              }}
            />
          ))}
          {stepOneAttempted && requiredErrors.categoryId ? (
            <AppText role="bodySmall" tone="danger">
              {requiredErrors.categoryId}
            </AppText>
          ) : null}
        </FormSection>

        <FormSection
          title="О работе"
          description="Основная информация для каталога и страницы предмета."
        >
          <ProductDraftTextField
            name="title"
            label="Название"
            placeholder="Название"
            editable={editable}
            required
            error={stepOneAttempted ? requiredErrors.title : undefined}
          />
          <ProductDraftTextField
            name="uniqueness"
            label="Уникальность или тираж"
            placeholder="Необязательно"
            editable={editable}
          />
        </FormSection>
      </FormPageColumns>

      {!isCreationFlow || wizardStep === productWizardStep.about ? (
        <AppText role="bodySmall" tone="secondary">
          Дата размещения установится автоматически при первой публичной публикации.
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

      {isCreationFlow && wizardStep === productWizardStep.about && wizardCanOpenImages ? (
        <SecondaryButton
          label="Продолжить к изображениям"
          width="block"
          onPress={onContinueToImages}
        />
      ) : null}

      {(saveMessage || saveIsError) && (!isCreationFlow || wizardStep === productWizardStep.about) ? (
        <AppText role="bodySmall" tone="danger" accessibilityLiveRegion="polite">
          {saveMessage ?? 'Не удалось сохранить предмет.'}
        </AppText>
      ) : null}
    </>
  );
}
