import type { ComponentProps } from 'react';
import { View } from 'react-native';

import type { ProductStatus } from '@bidplace/contracts';
import { designTokens } from '@bidplace/design-tokens';

import { MediaDeliveryNotice } from '../../components/shared/MediaDeliveryNotice';
import {
  AppText,
  FormSection,
  PrimaryButton,
  SecondaryButton,
} from '../../components/ui';
import { presentEnum, productStatusLabels } from '../../lib/presentation';
import { FigmaIconButton } from '../../components/figma/FigmaIconButton';

const WIZARD_STEP_LABELS = [
  'О работе',
  'Изображения',
  'История создания',
  'Проверка',
] as const;

export function ProductDraftScreenChrome({
  isCreationFlow,
  storyWizardView,
  wizardSubmitted,
  wizardStep,
  draftTitle,
  hasExistingProduct,
  canOpenStep,
  onStepPress,
  onBackToImages,
  storyBarDisabled,
  closeLabel,
  closeLoading,
  closeDisabled,
  onClose,
  delivery,
  moderationNotice,
  editorStatus,
  onRefreshStatus,
  editable,
  submitLabel,
  submitPending,
  submitDisabled,
  onSubmit,
  submitErrorVisible,
  lockedVisible,
}: {
  isCreationFlow: boolean;
  storyWizardView: boolean;
  wizardSubmitted: boolean;
  wizardStep: number;
  draftTitle: string;
  hasExistingProduct: boolean;
  canOpenStep: (step: number) => boolean;
  onStepPress: (step: number) => void;
  onBackToImages: () => void;
  storyBarDisabled: boolean;
  closeLabel: string;
  closeLoading: boolean;
  closeDisabled: boolean;
  onClose: () => void;
  delivery: ComponentProps<typeof MediaDeliveryNotice>['delivery'];
  moderationNotice: { title: string; body: string } | null;
  editorStatus: ProductStatus | null | undefined;
  onRefreshStatus: () => void;
  editable: boolean;
  submitLabel: string;
  submitPending: boolean;
  submitDisabled: boolean;
  onSubmit: () => void;
  submitErrorVisible: boolean;
  lockedVisible: boolean;
}) {
  return (
    <>
      {isCreationFlow && !storyWizardView ? (
        <FormSection
          title={wizardSubmitted ? 'Предмет отправлен' : 'Создание предмета'}
          description={
            wizardSubmitted
              ? 'Черновик отправлен на модерацию. Дальше команда проверит его содержание и изображения.'
              : 'Заполните предмет по шагам, сохраните промежуточные изменения и проверьте публикацию перед отправкой.'
          }
        >
          <View
            accessibilityRole="tablist"
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: designTokens.space.x2,
            }}
          >
            {WIZARD_STEP_LABELS.map((label, index) => {
              const currentStep = index + 1;
              return (
                <SecondaryButton
                  key={label}
                  label={`${currentStep}. ${label}`}
                  disabled={wizardSubmitted || !canOpenStep(currentStep)}
                  onPress={() => onStepPress(currentStep)}
                />
              );
            })}
          </View>
          {hasExistingProduct ? (
            <AppText role="metadata" tone="secondary">
              Шаг {wizardStep} из 4 · {draftTitle.trim() || 'Без названия'}
            </AppText>
          ) : null}
          <SecondaryButton
            label={closeLabel}
            loading={closeLoading}
            disabled={closeDisabled}
            onPress={onClose}
          />
        </FormSection>
      ) : null}

      {storyWizardView ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: designTokens.space.x2,
          }}
        >
          <FigmaIconButton
            icon="arrow-left-01"
            label="Назад к изображениям"
            disabled={storyBarDisabled}
            onPress={onBackToImages}
          />
          <View
            accessibilityLabel="Шаг 3 из 4"
            style={{ flexDirection: 'row', gap: designTokens.space.x2 }}
          >
            {[1, 2, 3, 4].map((index) => (
              <View
                key={index}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 6,
                  backgroundColor:
                    index === 2
                      ? designTokens.color.inkStrong
                      : designTokens.color.border,
                }}
              />
            ))}
          </View>
          <FigmaIconButton
            icon="x"
            label="Сохранить и закрыть"
            disabled={storyBarDisabled}
            onPress={onClose}
          />
        </View>
      ) : null}

      {!storyWizardView ? (
        <View style={{ gap: designTokens.space.x2 }}>
          <AppText role="screenTitle">
            {hasExistingProduct ? 'Редактировать предмет' : 'Новый предмет'}
          </AppText>
          <AppText role="bodySmall" tone="secondary">
            Черновик можно сохранить неполным. Для модерации нужны название,
            категория и хотя бы одно изображение.
          </AppText>
        </View>
      ) : null}

      <MediaDeliveryNotice delivery={delivery} />
      {moderationNotice ? (
        <FormSection title={moderationNotice.title}>
          <AppText role="bodySmall" tone="danger">
            {moderationNotice.body}
          </AppText>
        </FormSection>
      ) : null}

      {hasExistingProduct && !isCreationFlow ? (
        <FormSection title="Статус предмета">
          <AppText
            role="bodySmall"
            tone={
              editorStatus === 'APPROVED'
                ? 'success'
                : editorStatus === 'CHANGES_REQUESTED' ||
                    editorStatus === 'REJECTED'
                  ? 'danger'
                  : 'secondary'
            }
          >
            {editorStatus
              ? presentEnum(
                  editorStatus,
                  productStatusLabels,
                  'Неизвестный статус предмета',
                )
              : null}
          </AppText>
          <SecondaryButton
            label="Обновить"
            onPress={onRefreshStatus}
          />
          {editable ? (
            <PrimaryButton
              label={submitLabel}
              loading={submitPending}
              disabled={submitDisabled}
              onPress={onSubmit}
            />
          ) : null}
          {submitErrorVisible ? (
            <AppText role="bodySmall" tone="danger">
              Не удалось сохранить и отправить предмет на модерацию.
            </AppText>
          ) : null}
        </FormSection>
      ) : null}

      {lockedVisible ? (
        <AppText role="bodySmall" tone="danger">
          Предмет уже нельзя редактировать или изменять его изображения.
        </AppText>
      ) : null}
    </>
  );
}
