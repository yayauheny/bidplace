import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';

import type { SellerProductDetailResponse } from '@bidplace/contracts';

import { FormPageColumns } from '../../components/layout';
import { FigmaSelectField } from '../../components/figma/FigmaSelectField';
import { useApiClient } from '../../providers/api-provider';
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
  stepOneAttempted,
  saveIsPending,
  saveIsError,
  saveMessage,
  onSavePress,
  wizardCanOpenImages,
  onContinueToImages,
}: ProductDraftAboutStepProps) {
  const api = useApiClient();
  const [openRole, setOpenRole] = useState<'MATERIAL' | 'TECHNIQUE' | null>(null);
  const materials = useQuery({
    queryKey: ['catalog', 'terms', 'MATERIAL'],
    queryFn: ({ signal }) => api.catalog.listTerms('MATERIAL', { signal }),
  });
  const techniques = useQuery({
    queryKey: ['catalog', 'terms', 'TECHNIQUE'],
    queryFn: ({ signal }) => api.catalog.listTerms('TECHNIQUE', { signal }),
  });
  const guard = useProductDraftWriteGuard();
  const { control, setValue } = useFormContext<ProductDraftFormValues>();
  const [
    categoryId = '',
    title = '',
    materialTermIds = [],
    techniqueTermIds = [],
    materialProposals = [],
    techniqueProposals = [],
  ] = useWatch({
    control,
    name: [
      'categoryId',
      'title',
      'materialTermIds',
      'techniqueTermIds',
      'materialProposals',
      'techniqueProposals',
    ],
  });
  const activeRoleQuery = openRole === 'MATERIAL' ? materials : techniques;
  const knownTerms = openRole === 'MATERIAL'
    ? (selection?.materialTerms ?? [])
    : (selection?.techniqueTerms ?? []);
  const termLabels = (
    ids: readonly string[],
    names: readonly string[],
    active: typeof materials.data,
    previous: typeof knownTerms,
  ) => {
    const byId = new Map([...(active?.terms ?? []), ...previous].map((term) => [term.id, term.name]));
    const selected = ids.map((id) => byId.get(id) ?? 'Выбранный термин');
    return [...selected, ...names].join(', ');
  };
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
            <FigmaSelectField
              label="Техники"
              placeholder="Выберите или предложите"
              value={termLabels(techniqueTermIds, techniqueProposals, techniques.data, selection?.techniqueTerms ?? [])}
              disabled={!editable}
              onPress={() => setOpenRole('TECHNIQUE')}
            />
            <FigmaSelectField
              label="Материалы"
              placeholder="Выберите или предложите"
              value={termLabels(materialTermIds, materialProposals, materials.data, selection?.materialTerms ?? [])}
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
            <ProductDraftTextField
              name="categoryProposal"
              label="Предложить категорию"
              placeholder="Укажите название, если нужной категории нет"
              editable={editable}
            />
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
          availableTerms={activeRoleQuery.data?.terms ?? []}
          knownTerms={knownTerms}
          loading={activeRoleQuery.isPending}
          error={activeRoleQuery.isError}
          editable={editable}
          onRetry={() => void activeRoleQuery.refetch()}
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
