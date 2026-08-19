import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import {
  AppText,
  FormSection,
  PrimaryButton,
  ResilientRemoteImage,
  SecondaryButton,
  TextButton,
  TextField,
} from '../../components/ui';
import { getApiAssetUrl } from '../../lib/environment';

export type DraftCreationStep = {
  id?: string;
  title: string;
  body: string;
  imageUrl?: string | null;
};

export type ProductDraftCreationStepProps = {
  editable: boolean;
  creationIntro: string;
  onChangeCreationIntro: (value: string) => void;

  creationSteps: DraftCreationStep[];
  creationAttempted: boolean;

  updateCreationStep: (
    index: number,
    field: 'title' | 'body',
    value: string,
  ) => void;
  onDeleteCreationStep: (index: number) => void;
  onAddCreationStep: () => void;

  replaceCreationPending: boolean;
  replaceCreationError: boolean;
  creationStorySaved: boolean;
  onSaveCreationPress: () => void;

  uploadCreationStepImagePending: boolean;
  uploadCreationStepImageError: boolean;
  creationImageSelectionError: string | null;
  onChooseCreationStepImage: (stepId: string) => void;

  onBackToImages: () => void;
  onContinueToReview: () => void;
};

export function ProductDraftCreationStep({
  editable,
  creationIntro,
  onChangeCreationIntro,
  creationSteps,
  creationAttempted,
  updateCreationStep,
  onDeleteCreationStep,
  onAddCreationStep,
  replaceCreationPending,
  replaceCreationError,
  creationStorySaved,
  onSaveCreationPress,
  uploadCreationStepImagePending,
  uploadCreationStepImageError,
  creationImageSelectionError,
  onChooseCreationStepImage,
  onBackToImages,
  onContinueToReview,
}: ProductDraftCreationStepProps) {
  return (
    <FormSection
      title="История создания"
      description="Добавьте контекст, который поможет зрителю понять путь работы. Этот шаг можно оставить пустым."
    >
      <TextField
        label="Введение"
        value={creationIntro}
        onChangeText={(value) => onChangeCreationIntro(value)}
        placeholder="Расскажите о замысле и процессе"
        multiline
        editable={editable}
      />

      {creationSteps.map((step, index) => (
        <View
          key={step.id ?? `draft-step-${index}`}
          style={{ gap: designTokens.space.x2 }}
        >
          <AppText role="label">Этап {index + 1}</AppText>
          <TextField
            label="Название этапа"
            value={step.title}
            onChangeText={(value) =>
              updateCreationStep(index, 'title', value)
            }
            placeholder="Например: Первый эскиз"
            editable={editable}
            error={
              creationAttempted && !step.title.trim()
                ? 'Введите название этапа'
                : undefined
            }
          />
          <TextField
            label="Описание этапа"
            value={step.body}
            onChangeText={(value) =>
              updateCreationStep(index, 'body', value)
            }
            placeholder="Что происходило на этом этапе"
            multiline
            editable={editable}
            error={
              creationAttempted && !step.body.trim()
                ? 'Добавьте описание этапа'
                : undefined
            }
          />
          {step.id ? (
            <>
              {step.imageUrl ? (
                <ResilientRemoteImage
                  uri={getApiAssetUrl(step.imageUrl)}
                  component="CreationStep"
                  accessibilityLabel={`Фотография этапа ${index + 1}`}
                  fallbackLabel={`Фотография этапа ${index + 1} недоступна`}
                  style={{
                    width: '100%',
                    height: 220,
                    borderRadius: designTokens.radius.image,
                  }}
                  contentFit="cover"
                />
              ) : null}
              <SecondaryButton
                label={step.imageUrl ? 'Заменить фотографию' : 'Добавить фотографию'}
                loading={uploadCreationStepImagePending}
                disabled={uploadCreationStepImagePending || !editable}
                onPress={() => onChooseCreationStepImage(step.id!)}
              />
            </>
          ) : null}

          {creationSteps.length > 1 ? (
            <TextButton
              label="Удалить этап"
              disabled={replaceCreationPending}
              onPress={() => onDeleteCreationStep(index)}
            />
          ) : null}
        </View>
      ))}

      {creationSteps.length < 20 ? (
        <SecondaryButton
          label={
            creationSteps.length === 0 ? 'Добавить первый этап' : 'Добавить этап'
          }
          disabled={replaceCreationPending}
          onPress={() => onAddCreationStep()}
        />
      ) : null}

      {replaceCreationError ? (
        <AppText role="bodySmall" tone="danger">
          Не удалось сохранить историю создания.
        </AppText>
      ) : null}

      {uploadCreationStepImageError ? (
        <AppText role="bodySmall" tone="danger">
          Не удалось загрузить фотографию этапа.
        </AppText>
      ) : null}

      {creationImageSelectionError ? (
        <AppText role="bodySmall" tone="danger">
          {creationImageSelectionError}
        </AppText>
      ) : null}

      {creationStorySaved ? (
        <AppText role="bodySmall" tone="success">
          История сохранена. Теперь можно добавить фотографии к новым этапам
          или перейти к проверке.
        </AppText>
      ) : null}

      <SecondaryButton
        label="Назад к изображениям"
        disabled={replaceCreationPending}
        onPress={() => onBackToImages()}
      />
      <PrimaryButton
        label="Сохранить историю"
        loading={replaceCreationPending}
        disabled={!editable || creationStorySaved}
        onPress={onSaveCreationPress}
      />
      <SecondaryButton
        label="Продолжить к проверке"
        disabled={
          !creationStorySaved ||
          replaceCreationPending ||
          uploadCreationStepImagePending
        }
        onPress={() => onContinueToReview()}
      />
    </FormSection>
  );
}

