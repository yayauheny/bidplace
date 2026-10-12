import { useState } from 'react';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';

import { normalizeCatalogName, type SellerProductDetailResponse } from '@bidplace/contracts';

import { FormPageColumns } from '../../components/layout';
import { FigmaSelectField } from '../../components/figma/FigmaSelectField';
import { ProductCatalogTermSheet } from './product-catalog-term-sheet';
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
  categories: Array<{ id: string; name: string; slug: string }>;
  selection?: SellerProductDetailResponse['selection'];
  catalog: Record<'MATERIAL' | 'TECHNIQUE', {
    terms: SellerProductDetailResponse['selection']['materialTerms'];
    loading: boolean;
    error: boolean;
    onRetry: () => void;
  }>;
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
  selection,
  catalog,
  stepOneAttempted,
  saveIsPending,
  saveIsError,
  saveMessage,
  onSavePress,
  wizardCanOpenImages,
  onContinueToImages,
}: ProductDraftAboutStepProps) {
  const [openRole, setOpenRole] = useState<'MATERIAL' | 'TECHNIQUE' | null>(null);
  const guard = useProductDraftWriteGuard();
  const { control, setValue } = useFormContext<ProductDraftFormValues>();
  const [
    categoryId = '',
    title = '',
    materialTermIds = [],
    techniqueTermIds = [],
    materialProposals = [],
    techniqueProposals = [],
    categoryProposal = '',
  ] = useWatch({
    control,
    name: [
      'categoryId',
      'title',
      'materialTermIds',
      'techniqueTermIds',
      'materialProposals',
      'techniqueProposals',
      'categoryProposal',
    ],
  });
  const activeRoleQuery = catalog[openRole ?? 'MATERIAL'];
  const knownTerms = openRole === 'MATERIAL'
    ? (selection?.materialTerms ?? [])
    : (selection?.techniqueTerms ?? []);
  const termLabels = (
    ids: readonly string[],
    names: readonly string[],
    active: typeof catalog.MATERIAL.terms,
    previous: typeof knownTerms,
  ) => {
    const byId = new Map([...active, ...previous].map((term) => [term.id, term.name]));
    const selected = ids.map((id) => byId.get(id) ?? 'Выбранный термин');
    return [...selected, ...names].join(', ');
  };
  const { errors } = useFormState({ control, name: 'year' });
  const requiredErrors = productDraftRequiredErrors({
    ...emptyProductDraftFormValues,
    categoryId,
    title,
  });
  const hiddenSelectedCategory =
    selection?.category?.id === categoryId &&
    !categories.some((category) => category.id === categoryId)
      ? selection.category
      : null;
  const rejectedCategoryProposal = selection?.proposals.find(
    (proposal) =>
      proposal.kind === 'CATEGORY' &&
      proposal.selected &&
      proposal.status === 'REJECTED' &&
      proposal.normalizedName === normalizeCatalogName(categoryProposal),
  );
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
            <FigmaSelectField
              label="Техники"
              placeholder="Выберите или предложите"
              value={termLabels(techniqueTermIds, techniqueProposals, catalog.TECHNIQUE.terms, selection?.techniqueTerms ?? [])}
              disabled={!editable}
              onPress={() => setOpenRole('TECHNIQUE')}
            />
            <FigmaSelectField
              label="Материалы"
              placeholder="Выберите или предложите"
              value={termLabels(materialTermIds, materialProposals, catalog.MATERIAL.terms, selection?.materialTerms ?? [])}
              disabled={!editable}
              onPress={() => setOpenRole('MATERIAL')}
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
          {hiddenSelectedCategory ? (
            <AppText role="bodySmall" tone="secondary">
              Ранее выбрана категория «{hiddenSelectedCategory.name}», сейчас она скрыта.
              Можно оставить её или выбрать другую.
            </AppText>
          ) : null}
          {categories.map((category) => (
            <SecondaryButton
              key={category.id}
              label={categoryId === category.id ? `✓ ${category.name}` : category.name}
              disabled={!editable}
              width="block"
              onPress={() => {
                if (guard.current) return;
                if (category.slug !== 'other') {
                  setValue('categoryProposal', '', { shouldDirty: true, shouldValidate: true });
                }
                setValue('categoryId', category.id, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                });
              }}
            />
          ))}
          {categories.find((category) => category.id === categoryId)?.slug === 'other' ||
          (categoryId === selection?.category?.id && selection?.category?.slug === 'other') ? (
            <>
              <ProductDraftTextField
                name="categoryProposal"
                label="Предложить категорию"
                placeholder="Укажите название, если нужной категории нет"
                editable={editable}
              />
              {rejectedCategoryProposal ? (
                <AppText role="bodySmall" tone="danger">
                  {rejectedCategoryProposal.rejectionReason
                    ? `Отклонено: ${rejectedCategoryProposal.rejectionReason}`
                    : 'Предложение категории отклонено. Измените или удалите его.'}
                </AppText>
              ) : null}
            </>
          ) : null}
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
      {openRole ? (
        <ProductCatalogTermSheet
          role={openRole}
          open
          selectedIds={openRole === 'MATERIAL' ? materialTermIds : techniqueTermIds}
          proposals={openRole === 'MATERIAL' ? materialProposals : techniqueProposals}
          availableTerms={activeRoleQuery.terms}
          knownTerms={knownTerms}
          knownProposals={selection?.proposals ?? []}
          loading={activeRoleQuery.loading}
          error={activeRoleQuery.error}
          editable={editable}
          onRetry={activeRoleQuery.onRetry}
          onClose={() => setOpenRole(null)}
          onApply={(ids, names) => {
            if (guard.current) return;
            const idField = openRole === 'MATERIAL' ? 'materialTermIds' : 'techniqueTermIds';
            const proposalField = openRole === 'MATERIAL' ? 'materialProposals' : 'techniqueProposals';
            setValue(idField, ids, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
            setValue(proposalField, names, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
          }}
        />
      ) : null}
    </>
  );
}
