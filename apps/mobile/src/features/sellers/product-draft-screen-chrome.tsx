import type { ComponentProps } from 'react';
import { Platform, View } from 'react-native';

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
import { MotionPressable } from '../../components/ui/MotionPressable';
import { BackButton } from '../../components/figma/BackButton';
import { FigmaIconButton } from '../../components/figma/FigmaIconButton';
import { useAppTheme } from '../../providers/theme-provider';

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
  hasExistingProduct,
  canOpenStep,
  onStepPress,
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
  hasExistingProduct: boolean;
  canOpenStep: (step: number) => boolean;
  onStepPress: (step: number) => void;
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
  const palette = useAppTheme();
  return (
    <>
      {isCreationFlow ? (
        <View style={{ gap: designTokens.space.x2 }}>
          <View
            style={{
              height:
                Platform.OS === 'web'
                  ? designTokens.authorApplication.chromeFrame
                  : designTokens.size.touch,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <BackButton
              surface="plain"
              label={wizardStep === 3 ? 'Назад к изображениям' : 'Назад'}
              disabled={storyBarDisabled || wizardSubmitted}
              onPress={() =>
                wizardStep > 1 ? onStepPress(wizardStep - 1) : onClose()
              }
            />
            <View
              accessibilityLabel={`Шаг ${wizardStep} из 4`}
              style={{ flexDirection: 'row' }}
            >
              {WIZARD_STEP_LABELS.map((label, index) => (
                <MotionPressable
                  key={label}
                  accessibilityRole="button"
                  accessibilityLabel={`${index + 1}. ${label}`}
                  accessibilityState={{
                    selected: index + 1 === wizardStep,
                    disabled: wizardSubmitted || !canOpenStep(index + 1),
                  }}
                  disabled={
                    wizardSubmitted ||
                    storyBarDisabled ||
                    !canOpenStep(index + 1)
                  }
                  onPress={() => onStepPress(index + 1)}
                  preset="icon"
                  style={{
                    width: designTokens.size.touch,
                    height: designTokens.size.touch,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <View
                    style={{
                      width: designTokens.size.stepDot,
                      height: designTokens.size.stepDot,
                      borderRadius: designTokens.radius.pill,
                      backgroundColor:
                        index + 1 === wizardStep
                          ? palette.inkStrong
                          : palette.border,
                    }}
                  />
                </MotionPressable>
              ))}
            </View>
            <FigmaIconButton
              icon="x"
              label={closeLabel}
              disabled={closeDisabled || closeLoading}
              onPress={onClose}
            />
          </View>
          {!storyWizardView ? (
            <AppText role="workTitle" style={{ textAlign: 'center' }}>
              {wizardSubmitted
                ? 'Работа отправлена'
                : [
                    'Основная информация',
                    'Подготовка фотографий',
                    'История создания',
                    'Проверка',
                  ][wizardStep - 1]}
            </AppText>
          ) : null}
        </View>
      ) : null}

      {!isCreationFlow ? (
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
          <SecondaryButton label="Обновить" onPress={onRefreshStatus} />
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
