import {
  ExitConfirmDialog,
  type ExitConfirmCopy,
} from '../../components/ui/ExitConfirmDialog';

export type AuthExitCopy = ExitConfirmCopy;

export function AuthExitConfirm({
  open,
  copy,
  onLeave,
  onContinue,
}: {
  open: boolean;
  copy: AuthExitCopy;
  onLeave: () => void;
  onContinue: () => void;
}) {
  return (
    <ExitConfirmDialog
      open={open}
      dialogId="auth-exit-confirm"
      copy={copy}
      onLeave={onLeave}
      onContinue={onContinue}
    />
  );
}
