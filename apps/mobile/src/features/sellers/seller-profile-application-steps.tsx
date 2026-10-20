import type { ReactNode } from 'react';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppText, PrimaryButton } from '../../components/ui';
import { AccountLogoutButton } from '../auth/AccountLogoutButton';
import { AuthorApplicationAboutStep } from './author-application-about-step';
import { AuthorApplicationStepShell } from './author-application-step-shell';
import { AuthorApplicationBasicsStep } from './author-application-basics-step';
import { AuthorApplicationContactsStep } from './author-application-contacts-step';
import {
  ProfileAboutFields,
  ProfileBasicsFields,
  ProfileContactsFields,
} from './seller-profile-steps';

export type SellerProfileWizardStep =
  | 'basics'
  | 'contacts'
  | 'about'
  | 'achievements';

export type SellerProfileStepBusy = {
  savePending: boolean;
  accountBusy: boolean;
  revisionSubmitActive: boolean;
  inputsLocked: boolean;
  achievementWriteActive: boolean;
};

export type SellerProfileStepPhoto = {
  uri: string | null;
  local: boolean;
  failed: boolean;
  disabled: boolean;
  onChoose: () => void;
  onFailed: () => void;
};

export type SellerProfileDirectionLabel = { id: string; name: string };

export function SellerProfileApplicationSteps({
  step,
  busy,
  introOpen,
  requestExit,
  goToPreviousStep,
  fieldsEditable,
  slugEditable,
  photo,
  formAlert,
  basicsAction,
  contactsAction,
  aboutAction,
  directionLabels,
  directionsError,
  onRemoveDirection,
  onOpenDirections,
  achievements,
  achievementsVisible,
  editable,
  canSubmitRevision,
  submitPending,
  submitDisabled,
  onSubmit,
  achievementDraftDirty,
}: {
  step: SellerProfileWizardStep | null;
  busy: SellerProfileStepBusy;
  introOpen: boolean;
  requestExit: (intent: 'home' | 'logout') => void;
  goToPreviousStep: () => void;
  fieldsEditable: boolean;
  slugEditable: boolean;
  photo: SellerProfileStepPhoto;
  formAlert: ReactNode;
  basicsAction: ReactNode;
  contactsAction: ReactNode;
  aboutAction: ReactNode;
  directionLabels: SellerProfileDirectionLabel[];
  directionsError: string | undefined;
  onRemoveDirection: (id: string) => void;
  onOpenDirections: () => void;
  achievements: ReactNode;
  achievementsVisible: boolean;
  editable: boolean;
  canSubmitRevision: boolean;
  submitPending: boolean;
  submitDisabled: boolean;
  onSubmit: () => void;
  achievementDraftDirty: boolean;
}) {
  if (!step) return null;
  const closeDisabled =
    busy.revisionSubmitActive || busy.inputsLocked || busy.achievementWriteActive;
  const backDisabled =
    busy.savePending ||
    busy.accountBusy ||
    busy.revisionSubmitActive ||
    busy.inputsLocked ||
    busy.achievementWriteActive;
  const logoutFooter = introOpen ? null : (
    <AccountLogoutButton
      variant="ghost"
      width="content"
      pending={
        busy.savePending || busy.accountBusy || busy.revisionSubmitActive
      }
      onPress={() => requestExit('logout')}
    />
  );

  return (
    <>
      {step === 'basics' ? (
        <AuthorApplicationBasicsStep
          closeDisabled={closeDisabled}
          onClose={() => requestExit('home')}
          photo={photo}
          fields={
            <ProfileBasicsFields
              editable={fieldsEditable}
              slugEditable={slugEditable}
            />
          }
          formAlert={formAlert}
          action={basicsAction}
          footer={logoutFooter}
        />
      ) : null}
      {step === 'contacts' ? (
        <AuthorApplicationContactsStep
          onBack={goToPreviousStep}
          backDisabled={backDisabled}
          closeDisabled={closeDisabled}
          onClose={() => requestExit('home')}
          fields={<ProfileContactsFields editable={fieldsEditable} />}
          formAlert={formAlert}
          action={contactsAction}
          footer={logoutFooter}
        />
      ) : null}
      {step === 'about' ? (
        <AuthorApplicationAboutStep
          onBack={goToPreviousStep}
          backDisabled={backDisabled}
          closeDisabled={closeDisabled}
          onClose={() => requestExit('home')}
          fields={<ProfileAboutFields editable={fieldsEditable} />}
          directionLabels={directionLabels}
          directionsError={directionsError}
          directionsDisabled={!fieldsEditable}
          onRemoveDirection={onRemoveDirection}
          onOpenDirections={onOpenDirections}
          formAlert={formAlert}
          action={aboutAction}
          footer={logoutFooter}
        />
      ) : null}
      {step === 'achievements' ? (
        <AuthorApplicationStepShell
          onBack={goToPreviousStep}
          backDisabled={backDisabled}
          profileStep={4}
          closeDisabled={closeDisabled}
          onClose={() => requestExit('home')}
          title="Биография и достижения"
          subtitle="Напишите ваши большие достижения, выставки и расскажите о себе в годах"
          footer={logoutFooter}
        >
          <View
            style={{
              gap: designTokens.authorApplication.finalActionGap,
            }}
          >
            {achievementsVisible ? achievements : null}
            {formAlert}
            {editable && canSubmitRevision ? (
              <PrimaryButton
                loading={submitPending}
                disabled={submitDisabled}
                onPress={onSubmit}
                label="Сохранить и завершить"
                size="auth"
                width="block"
              />
            ) : null}
            {achievementDraftDirty ? (
              <AppText role="bodySmall" tone="secondary">
                Добавьте событие или очистите его поля, чтобы завершить заявку.
              </AppText>
            ) : null}
          </View>
        </AuthorApplicationStepShell>
      ) : null}
    </>
  );
}
