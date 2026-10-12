import { type ReactNode } from 'react';

import { AuthorApplicationStepShell } from './author-application-step-shell';

export function AuthorApplicationContactsStep({
  closeDisabled,
  onClose,
  onBack,
  backDisabled,
  fields,
  formAlert,
  action,
  footer,
}: {
  closeDisabled: boolean;
  onClose: () => void;
  onBack?: () => void;
  backDisabled?: boolean;
  fields: ReactNode;
  formAlert: ReactNode;
  action: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <AuthorApplicationStepShell
      profileStep={2}
      closeDisabled={closeDisabled}
      onClose={onClose}
      onBack={onBack}
      backDisabled={backDisabled}
      title="Контакты"
      subtitle={'Эти данные будут видны на\nстранице профиля и для покупателя'}
      footer={footer}
    >
      {fields}
      {formAlert}
      {action}
    </AuthorApplicationStepShell>
  );
}
