import { type ReactNode } from 'react';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { ProfileDirectionsControl } from './seller-profile-steps';
import { AuthorApplicationStepShell } from './author-application-step-shell';

export function AuthorApplicationAboutStep({
  closeDisabled,
  onClose,
  onBack,
  backDisabled,
  fields,
  directionLabels,
  directionsError,
  onOpenDirections,
  onRemoveDirection,
  directionsDisabled = false,
  formAlert,
  action,
  footer,
}: {
  closeDisabled: boolean;
  onClose: () => void;
  onBack?: () => void;
  backDisabled?: boolean;
  fields: ReactNode;
  directionLabels: readonly { id: string; name: string }[];
  directionsError?: string;
  onOpenDirections: () => void;
  onRemoveDirection?: (id: string) => void;
  directionsDisabled?: boolean;
  formAlert: ReactNode;
  action: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <AuthorApplicationStepShell
      profileStep={3}
      closeDisabled={closeDisabled}
      onClose={onClose}
      onBack={onBack}
      backDisabled={backDisabled}
      title="Раскройте себя как автора"
      subtitle="Заполняйте с душой, а если устанете, сохраните и сможете заполнить позже"
      footer={footer}
    >
      <View style={{ gap: designTokens.authorApplication.bodyFieldGap }}>
        {fields}
        <ProfileDirectionsControl
          labels={directionLabels}
          error={directionsError}
          editable={!directionsDisabled}
          onOpen={onOpenDirections}
          onRemove={onRemoveDirection}
        />
        {formAlert}
        {action}
      </View>
    </AuthorApplicationStepShell>
  );
}
