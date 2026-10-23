import { useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { FormProvider, useForm } from 'react-hook-form';

import type { SellerProductDetailResponse, User } from '@bidplace/contracts';

import { AppShell, FormPageShell } from '../../components/layout';
import { InfrastructurePageStatus } from '../../components/shared/InfrastructurePageStatus';
import {
  combineInfrastructurePageStatus,
  infrastructurePageFetchStatus,
} from '../../components/shared/infrastructure-page-status';
import {
  AppDialog,
  AppText,
  PageState,
  PrimaryButton,
  SecondaryButton,
  TextButton,
} from '../../components/ui';
import {
  getUserFacingErrorMessage,
  isNotFoundError,
  readFormFailure,
} from '../../errors';
import { useApiClient } from '../../providers/api-provider';
import { canWritePrivateCache, authKeys } from '../../lib/query-cache';
import {
  FORM_DRAFT_PREFIX,
  clearFormDraft,
  clearFormDraftsByPrefix,
  formDraftKey,
  readFormDraft,
  writeFormDraft,
} from '../../lib/local-form-draft';
import { usePrivateCacheEpoch } from '../../lib/use-private-cache-epoch';
import { ownerWorkQueryKeys } from './owner-work-query';
import { useLocalFormRestore } from './local-form-restore';
import { ProductDraftAboutStep } from './product-draft-about';
import { ProductDraftWriteGuard } from './product-draft-fields';
import {
  emptyProductDraftFormValues,
  productDraftFieldsSchema,
  productDraftFormSchema,
  productToDraftFormValues,
} from './product-draft-form';
import { ProductDraftImagesStep } from './product-draft-images';
import { ProductDraftReviewStep } from './product-draft-review';
import {
  canOwnerEditProduct,
  isNewerModerationDecision,
  ownerModerationReasonNotice,
  ownerProductSubmitLabel,
} from './product-draft-state';
import { ProductDraftStoryStep } from './product-draft-story';
import { ProductDraftScreenChrome } from './product-draft-screen-chrome';
import { useProductDraftData } from './product-draft-data';
import { useProductDraftSaveSession } from './product-draft-save';
import { useProductDraftBrowserHistoryGuard } from './product-draft-browser-guard';
import { useProductDraftImageActions } from './product-draft-image-actions';
import { useProductDraftNavigation } from './product-draft-navigation';
import {
  useProductStoryEditor,
  storyLocalDraftSchema,
  type ProductStoryEditor,
} from './use-product-story-editor';
import {
  canOpenProductWizardStep,
  productWizardStep,
  type ProductWizardStepParam,
} from './product-draft-wizard';

export function ProductDraftScreen({
  productId,
  flow,
  stepParam,
}: {
  productId?: string;
  flow?: string;
  stepParam?: ProductWizardStepParam;
}) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const authEpoch = usePrivateCacheEpoch(queryClient);
  const storyEditorSlot = useRef<ProductStoryEditor | null>(null);
  const retireGuardSlot = useRef<() => Promise<void>>(async () => undefined);
  const form = useForm({
    defaultValues: emptyProductDraftFormValues,
    resolver: zodResolver(productDraftFormSchema),
    mode: 'onChange',
    shouldUnregister: false,
  });

  const data = useProductDraftData({
    api,
    queryClient,
    productId,
    authEpoch,
    form,
  });
  const { productDetail, existingProduct, editorStatus, storyNeedsDraft } =
    data;
  const [copiedRecovery, setCopiedRecovery] = useState<string | null>(null);
  const [recoveryManualVisible, setRecoveryManualVisible] = useState(false);

  // Read the installed session (not an auth context) so the owner specs can
  // mount the screen with only a query cache, like the rest of the save flow.
  const accountId = canWritePrivateCache(queryClient, authEpoch)
    ? (queryClient.getQueryData<User | null>(authKeys.session)?.id ?? null)
    : null;

  const session = useProductDraftSaveSession({
    api,
    queryClient,
    form,
    productId,
    authEpoch,
    storyEditorSlot,
    retireGuardSlot,
    onSavedProduct: (product) => {
      data.notePersisted(product);
      if (!productId) {
        restore.noteEntityCreated(product.id, product.updatedAt);
        migrateStoryDraft(accountId, product.id);
      }
    },
    onSubmittedProduct: (product, isCurrent) => {
      if (isCurrent()) restore.clearDraft();
      if (accountId) {
        // Submit retires every story draft of this product — the current
        // revision's active copy, older revision copies and recovery copies
        // share the product key prefix.
        clearFormDraftsByPrefix(
          `${FORM_DRAFT_PREFIX}${accountId}:product-story:${product.id}`,
        );
      }
      return data.noteSubmitted(product, isCurrent);
    },
  });

  const restore = useLocalFormRestore({
    form,
    accountId,
    scope: 'product-draft',
    entityId: session.persistedProductId() ?? 'new',
    baseToken: existingProduct
      ? (productDetail.data?.editingRevision?.updatedAt ??
        existingProduct.updatedAt)
      : null,
    serverValues: existingProduct
      ? productToDraftFormValues(existingProduct, productDetail.data?.selection)
      : null,
    fields: productDraftFieldsSchema,
    queryClient,
    canWrite: () => canWritePrivateCache(queryClient, authEpoch),
  });

  const storyEditor = useProductStoryEditor({
    api,
    productId,
    revisionId: productDetail.data?.editingRevision?.id,
    // The snapshot's owner revision, from the same response: the hook must
    // never present another revision's snapshot as this revision's baseline.
    storyRevisionId: productDetail.data?.editingRevision?.id,
    authEpoch,
    accountId,
    queryClient,
    canChange: () => !session.transitionLock.current,
    story: productDetail.data?.story,
    onSaved: (savedStory) => {
      if (!productId || !canWritePrivateCache(queryClient, authEpoch)) return;
      queryClient.setQueryData<SellerProductDetailResponse>(
        ownerWorkQueryKeys.detail(productId),
        (current) =>
          current &&
          current.editingRevision?.id ===
            productDetail.data?.editingRevision?.id
            ? { ...current, story: savedStory }
            : current,
      );
    },
  });
  storyEditorSlot.current = storyEditor;

  const imageActions = useProductDraftImageActions({
    api,
    queryClient,
    authEpoch,
    existingProduct,
    editorStatus,
    session,
    storyEditor,
  });

  const uploadBusy =
    imageActions.choosingImages || imageActions.upload.isPending;

  const browserGuard = useProductDraftBrowserHistoryGuard({
    uploadPending: uploadBusy,
    isDirty: form.formState.isDirty,
    storyDirty: storyEditor.dirty,
    storyPending: storyEditor.pending,
    draftEffectivelyClean: () =>
      !form.formState.isDirty && storyEditor.isEffectivelyClean(),
    productId,
    session,
  });
  retireGuardSlot.current = browserGuard.retireBrowserGuard;

  const isCreationFlow = flow === 'creation' || !productId;

  const wizardNavigation = useProductDraftNavigation({
    uploadBusy,
    productId,
    stepParam,
    isCreationFlow,
    existingProduct,
    productDetailLoading: productDetail.isLoading,
    form,
    storyEditor,
    session,
    retireGuard: () => retireGuardSlot.current(),
  });
  const { wizardDraft, wizardStep, stepOneAttempted } = wizardNavigation;

  const categoriesStatus = infrastructurePageFetchStatus(data.categories);
  const productFetchStatus = productId
    ? infrastructurePageFetchStatus(productDetail)
    : 'ready';
  const pageStatus = combineInfrastructurePageStatus(
    productId ? [categoriesStatus, productFetchStatus] : [categoriesStatus],
  );
  const retryDraftPage = () => {
    void data.categories.refetch();
    void productDetail.refetch();
  };

  if (
    productId &&
    isNotFoundError(productDetail.error) &&
    pageStatus !== 'loading'
  ) {
    return (
      <FormPageShell hideDock>
        <PageState title="Предмет не найден" />
      </FormPageShell>
    );
  }

  if (
    pageStatus !== 'ready' ||
    !data.categories.data ||
    (productId &&
      (productDetail.isError || !productDetail.data || !existingProduct))
  ) {
    return (
      <AppShell>
        <InfrastructurePageStatus
          status={pageStatus === 'loading' ? 'loading' : 'error'}
          onRetry={retryDraftPage}
        />
      </AppShell>
    );
  }

  const moderationReopened = Boolean(
    data.submittedRevision &&
    productDetail.data?.editingRevision &&
    isNewerModerationDecision(
      data.submittedRevision,
      productDetail.data.editingRevision,
    ),
  );
  const editable =
    canOwnerEditProduct(existingProduct?.status, data.editingRevisionStatus) &&
    (!data.moderationHold || moderationReopened);
  const moderationNotice = ownerModerationReasonNotice(
    editorStatus,
    productDetail.data?.lastModerationReason,
  );
  const submitLabel = ownerProductSubmitLabel(editorStatus);
  const storyWizardView =
    isCreationFlow && wizardStep === productWizardStep.story;

  return (
    <FormProvider {...form}>
      <ProductDraftWriteGuard guard={session.transitionLock}>
        <FormPageShell
          hideDock
          variant={isCreationFlow ? 'creation' : 'default'}
          bottomAction={
            isCreationFlow && wizardStep === productWizardStep.images ? (
              <PrimaryButton
                label="Продолжить"
                width="block"
                size="creationAction"
                disabled={
                  uploadBusy ||
                  session.inputsLocked ||
                  !canOpenProductWizardStep(
                    productWizardStep.story,
                    wizardDraft,
                  )
                }
                onPress={() =>
                  void wizardNavigation.moveToWizardStep(
                    productWizardStep.story,
                  )
                }
              />
            ) : undefined
          }
        >
          <ProductDraftScreenChrome
            isCreationFlow={isCreationFlow}
            storyWizardView={storyWizardView}
            wizardSubmitted={data.wizardSubmitted}
            wizardStep={wizardStep}
            hasExistingProduct={Boolean(existingProduct)}
            canOpenStep={(step) =>
              !uploadBusy && canOpenProductWizardStep(step, wizardDraft)
            }
            onStepPress={(step) => void wizardNavigation.moveToWizardStep(step)}
            storyBarDisabled={
              storyEditor.pending || session.inputsLocked || uploadBusy
            }
            closeLabel={
              form.formState.isDirty || storyEditor.dirty
                ? 'Сохранить и закрыть'
                : 'Закрыть'
            }
            closeLoading={session.save.isPending || storyEditor.pending}
            closeDisabled={
              session.submit.isPending ||
              uploadBusy ||
              storyEditor.pending ||
              session.inputsLocked
            }
            onClose={() => void wizardNavigation.saveAndClose()}
            delivery={productDetail.data?.publication}
            moderationNotice={moderationNotice}
            editorStatus={editorStatus}
            onRefreshStatus={() => void productDetail.refetch()}
            editable={editable}
            submitLabel={submitLabel}
            submitPending={session.submit.isPending}
            submitDisabled={
              existingProduct
                ? existingProduct.images.length < 1 ||
                  session.save.isPending ||
                  uploadBusy ||
                  session.inputsLocked
                : false
            }
            onSubmit={() => void session.submitCurrentForm()}
            submitErrorVisible={Boolean(session.submit.isError)}
            lockedVisible={
              Boolean(existingProduct) && !editable && !isCreationFlow
            }
          />

          {restore.storageError || storyEditor.storageError ? (
            <AppText role="bodySmall" tone="danger">
              {restore.storageError ?? storyEditor.storageError}
            </AppText>
          ) : null}
          {storyEditor.recoveryText ? (
            // The recovered copy of another revision's draft cannot be
            // applied automatically; copying it out is the honest action.
            // The copied status belongs to one payload only: a new recovered
            // text must not keep claiming it is already copied.
            <TextButton
              label={
                copiedRecovery === storyEditor.recoveryText
                  ? 'Скопировано'
                  : 'Скопировать сохранённый текст'
              }
              onPress={() => {
                const text = storyEditor.recoveryText!;
                const clipboard = navigator.clipboard;
                if (!clipboard?.writeText) {
                  setRecoveryManualVisible(true);
                  return;
                }
                void clipboard.writeText(text).then(
                  () => setCopiedRecovery(text),
                  () => setRecoveryManualVisible(true),
                );
              }}
            />
          ) : null}

          {!isCreationFlow || wizardStep === productWizardStep.about ? (
            <ProductDraftAboutStep
              isCreationFlow={isCreationFlow}
              wizardStep={wizardStep}
              editable={editable && !session.inputsLocked}
              categories={data.categories.data.categories}
              selection={productDetail.data?.selection}
              onCatalogOpen={data.setCatalogOpenRole}
              catalog={{
                MATERIAL: {
                  terms: data.materialsCatalog.data?.terms ?? [],
                  loading: data.materialsCatalog.isPending,
                  error: data.materialsCatalog.isError,
                  onRetry: () => void data.materialsCatalog.refetch(),
                },
                TECHNIQUE: {
                  terms: data.techniquesCatalog.data?.terms ?? [],
                  loading: data.techniquesCatalog.isPending,
                  error: data.techniquesCatalog.isError,
                  onRetry: () => void data.techniquesCatalog.refetch(),
                },
              }}
              stepOneAttempted={stepOneAttempted}
              saveIsPending={session.save.isPending}
              saveIsError={session.save.isError && !session.formAlert}
              saveMessage={session.formAlert}
              onSavePress={() => void wizardNavigation.saveAbout()}
              wizardCanOpenImages={canOpenProductWizardStep(
                productWizardStep.images,
                wizardDraft,
              )}
              onContinueToImages={() =>
                void wizardNavigation.moveToWizardStep(productWizardStep.images)
              }
            />
          ) : null}

          {existingProduct &&
          (!isCreationFlow || wizardStep === productWizardStep.images) ? (
            <ProductDraftImagesStep
              images={existingProduct.images}
              productStatus={editorStatus}
              editable={editable && !session.inputsLocked}
              isCreationFlow={isCreationFlow}
              wizardStep={wizardStep}
              reorderPending={imageActions.reorderImages.isPending}
              removePending={imageActions.removeImage.isPending}
              uploadPending={
                imageActions.upload.isPending || imageActions.choosingImages
              }
              uploadFiles={imageActions.uploadFiles}
              uploadError={imageActions.upload.isError}
              uploadMessage={
                imageActions.upload.error
                  ? (readFormFailure(imageActions.upload.error, [])
                      .formMessage ??
                    getUserFacingErrorMessage(
                      imageActions.upload.error,
                      'Не удалось загрузить изображения.',
                    ))
                  : null
              }
              imageSelectionError={imageActions.imageSelectionError}
              removeOrReorderError={
                imageActions.removeImage.isError ||
                imageActions.reorderImages.isError
              }
              onRetryUpload={() => imageActions.retryUpload()}
              onChooseImages={() => void imageActions.chooseImages()}
              onMoveImage={imageActions.reorder}
              onDeleteImage={(imageId) =>
                imageActions.setImagePendingDelete(imageId)
              }
            />
          ) : null}

          {existingProduct &&
          (!isCreationFlow || wizardStep === productWizardStep.story) ? (
            <ProductDraftStoryStep
              productId={existingProduct.id}
              sessionEpoch={authEpoch}
              isCreationFlow={isCreationFlow}
              images={existingProduct.images}
              blocks={storyEditor.blocks}
              storyNeedsDraft={storyNeedsDraft}
              onStartDraft={
                editable
                  ? () => void session.persistCurrentForm('ordinary')
                  : undefined
              }
              editable={editable && !session.inputsLocked && !storyNeedsDraft}
              savePending={storyEditor.pending || session.save.isPending}
              saveError={storyEditor.error}
              retryUpload={storyEditor.retryUpload}
              onAddText={storyEditor.addText}
              onAddGalleryImage={storyEditor.addGalleryImage}
              onEditText={storyEditor.editText}
              onEditAlt={storyEditor.editAlt}
              onRemove={storyEditor.remove}
              onMove={storyEditor.move}
              onChooseImage={() => void imageActions.chooseStoryImage()}
              onRetryUpload={() => void storyEditor.addImage()}
              onBackToImages={() =>
                void wizardNavigation.moveToWizardStep(productWizardStep.images)
              }
              onSaveAndContinue={() =>
                void wizardNavigation.saveStoryAndContinue()
              }
            />
          ) : null}

          {isCreationFlow &&
          wizardStep === productWizardStep.review &&
          existingProduct ? (
            <ProductDraftReviewStep
              categories={data.categories.data.categories}
              selection={productDetail.data?.selection}
              catalog={{
                materialTerms: data.materialsCatalog.data?.terms ?? [],
                techniqueTerms: data.techniquesCatalog.data?.terms ?? [],
              }}
              productId={existingProduct.id}
              sessionEpoch={authEpoch}
              images={existingProduct.images}
              blocks={storyEditor.blocks}
              editable={editable && !session.inputsLocked}
              submitLabel={submitLabel}
              wizardSubmitted={data.wizardSubmitted}
              submitPending={
                session.submit.isPending ||
                session.save.isPending ||
                storyEditor.pending
              }
              submitError={session.submit.isError}
              onSubmitPress={() => void session.submitCurrentForm()}
              onBackToStory={() =>
                void wizardNavigation.moveToWizardStep(productWizardStep.story)
              }
            />
          ) : null}

          <AppDialog
            open={recoveryManualVisible}
            title="Автоматическое копирование недоступно"
            description="Выделите и скопируйте сохранённый текст вручную."
            onClose={() => setRecoveryManualVisible(false)}
          >
            <AppText role="bodySmall" selectable>
              {storyEditor.recoveryText}
            </AppText>
            <SecondaryButton
              label="Закрыть"
              onPress={() => setRecoveryManualVisible(false)}
            />
          </AppDialog>

          <AppDialog
            open={imageActions.imagePendingDelete !== null}
            title="Удалить изображение?"
            description="Изображение будет удалено из предмета. Это действие нельзя отменить."
            onClose={() => imageActions.setImagePendingDelete(null)}
          >
            <PrimaryButton
              label="Удалить изображение"
              loading={
                imageActions.deleteConfirmLocked ||
                imageActions.removeImage.isPending
              }
              onPress={() => void imageActions.confirmImageDelete()}
            />
            <SecondaryButton
              label="Отмена"
              disabled={
                imageActions.deleteConfirmLocked ||
                imageActions.removeImage.isPending
              }
              onPress={() => imageActions.setImagePendingDelete(null)}
            />
          </AppDialog>
        </FormPageShell>
      </ProductDraftWriteGuard>
    </FormProvider>
  );
}

/** After the first create the story draft moves from the "new" key to the product id. */
function migrateStoryDraft(accountId: string | null, productId: string) {
  if (!accountId) return;
  const previousKey = formDraftKey(accountId, 'product-story', 'new');
  const stored = readFormDraft(previousKey, storyLocalDraftSchema);
  if (!stored) return;
  // The old "new" copy goes away only when the migrated copy landed.
  const written = writeFormDraft(
    formDraftKey(accountId, 'product-story', productId),
    stored,
  );
  if (written === 'ok') clearFormDraft(previousKey);
}
