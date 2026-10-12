import {
  ExitConfirmDialog,
  type ExitConfirmCopy,
} from '../../components/ui/ExitConfirmDialog';

export type AuthorApplicationExitCopy = ExitConfirmCopy;

export function AuthorApplicationExitConfirm({
  open,
  copy,
  onLeave,
  onContinue,
  busy = false,
  continueDisabled = false,
  error,
  returnFocusRef,
}: {
  open: boolean;
  copy: AuthorApplicationExitCopy;
  onLeave: () => void;
  onContinue: () => void;
  busy?: boolean;
  continueDisabled?: boolean;
  error?: string;
  returnFocusRef?: { current: { focus?: () => void } | null };
}) {
  return (
    <ExitConfirmDialog
      open={open}
      dialogId="author-application-exit-confirm"
      copy={copy}
      onLeave={onLeave}
      onContinue={onContinue}
      busy={busy}
      continueDisabled={continueDisabled}
      error={error}
      returnFocusRef={returnFocusRef}
    />
  );
}
