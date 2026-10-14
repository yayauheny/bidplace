import type { ReactNode } from 'react';
import { Image as LocalPreviewImage } from 'react-native';
import { Link } from 'expo-router';

import { designTokens } from '@bidplace/design-tokens';

import {
  FormPageColumns,
} from '../../components/layout';
import {
  AppText,
  FormSection,
  ImagePlaceholder,
  PrimaryButton,
  ResilientRemoteImage,
  SecondaryButton,
} from '../../components/ui';
import { SellerProfileFormSteps } from './seller-profile-steps';
import type { SellerProfileDirectionLabel } from './seller-profile-application-steps';

export function SellerProfileCabinetForm({
  photo,
  fieldsEditable,
  slugEditable,
  profileStep,
  directionLabels,
  directionsError,
  onOpenDirections,
  editable,
  revisionPending,
  achievements,
  achievementsVisible,
  savePending,
  saveDisabled,
  onSave,
  canSubmitRevision,
  submitPending,
  submitDisabled,
  onSubmit,
  showCreate,
}: {
  photo: {
    uri: string | null;
    local: boolean;
    failed: boolean;
    disabled: boolean;
    onChoose: () => void;
    onFailed: () => void;
  };
  fieldsEditable: boolean;
  slugEditable: boolean;
  profileStep: 1 | 2 | 3 | 4;
  directionLabels: SellerProfileDirectionLabel[];
  directionsError: string | undefined;
  onOpenDirections: () => void;
  editable: boolean;
  revisionPending: boolean;
  achievements: ReactNode;
  achievementsVisible: boolean;
  savePending: boolean;
  saveDisabled: boolean;
  onSave: () => void;
  canSubmitRevision: boolean;
  submitPending: boolean;
  submitDisabled: boolean;
  onSubmit: () => void;
  showCreate: boolean;
}) {
  return (
    <>
      <FormPageColumns
        sidebarFirstOnCompact
        sidebar={
          <FormSection
            title="Фото профиля"
            description="Квадратный портрет или логотип автора."
          >
            {photo.uri && !photo.failed ? (
              photo.local ? (
                <LocalPreviewImage
                  source={{ uri: photo.uri }}
                  resizeMode="cover"
                  style={{
                    width: '100%',
                    aspectRatio: 1,
                    borderRadius: designTokens.radius.image,
                  }}
                  onError={photo.onFailed}
                />
              ) : (
                <ResilientRemoteImage
                  uri={photo.uri}
                  component="AuthorPhoto"
                  accessibilityLabel="Фото профиля"
                  fallbackLabel="Фото профиля недоступно"
                  style={{
                    width: '100%',
                    aspectRatio: 1,
                    borderRadius: designTokens.radius.image,
                  }}
                  contentFit="cover"
                />
              )
            ) : (
              <ImagePlaceholder
                ratio={1}
                label="Фото профиля недоступно или не выбрано"
                style={{ width: '100%', aspectRatio: 1 }}
              />
            )}
            <SecondaryButton
              label={photo.uri ? 'Изменить фото' : 'Добавить фото'}
              disabled={!fieldsEditable}
              width="block"
              onPress={photo.onChoose}
            />
          </FormSection>
        }
      >
        <SellerProfileFormSteps
          profileStep={profileStep}
          showAllSteps
          editable={fieldsEditable}
          slugEditable={slugEditable}
          directionLabels={directionLabels}
          directionsError={directionsError}
          onOpenDirections={onOpenDirections}
        />
      </FormPageColumns>
      {achievementsVisible ? achievements : null}
      {!editable ? (
        <AppText role="bodySmall" tone="secondary">
          {revisionPending
            ? 'Заявка на проверке. Редактирование откроется, если модератор запросит правки.'
            : 'Сейчас профиль нельзя редактировать.'}
        </AppText>
      ) : null}
      {editable ? (
        <PrimaryButton
          loading={savePending}
          disabled={saveDisabled}
          onPress={onSave}
          label="Сохранить"
          width="block"
        />
      ) : null}
      {canSubmitRevision ? (
        <PrimaryButton
          loading={submitPending}
          disabled={submitDisabled}
          onPress={onSubmit}
          label="Отправить на проверку"
          width="block"
        />
      ) : null}
      {showCreate ? (
        <Link href="/products/new" asChild>
          <PrimaryButton
            label="Создать предмет"
            width="block"
            onPress={() => undefined}
          />
        </Link>
      ) : null}
    </>
  );
}
