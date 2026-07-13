import { spacing } from '../../theme/tokens';
import { PrimaryButton, SecondaryButton } from './controls';
import { Heading, Text } from './layout';
import { XStack, YStack } from './stack';

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <YStack
      gap={spacing[3]}
      alignItems="center"
      padding={spacing[5]}
      borderWidth={1}
      borderColor="var(--borderColor)"
      borderRadius={16}
      backgroundColor="var(--surface)"
    >
      <Heading level="h3" style={{ textAlign: 'center' }}>
        {title}
      </Heading>
      <Text tone="muted" style={{ textAlign: 'center' }}>
        {description}
      </Text>
      {actionLabel && onAction ? (
        <PrimaryButton onPress={onAction}>{actionLabel}</PrimaryButton>
      ) : null}
    </YStack>
  );
}

type ErrorStateProps = {
  title?: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function ErrorState({
  title = 'Что-то пошло не так',
  description,
  actionLabel = 'Повторить',
  onAction,
}: ErrorStateProps) {
  return (
    <YStack
      gap={spacing[3]}
      alignItems="center"
      padding={spacing[5]}
      borderWidth={1}
      borderColor="var(--danger)"
      borderRadius={16}
      backgroundColor="var(--surface)"
    >
      <Heading level="h3" style={{ textAlign: 'center' }}>
        {title}
      </Heading>
      <Text tone="danger" style={{ textAlign: 'center' }}>
        {description}
      </Text>
      {onAction ? (
        <SecondaryButton onPress={onAction}>{actionLabel}</SecondaryButton>
      ) : null}
    </YStack>
  );
}

type LoadingBlockProps = {
  label?: string;
};

function Spinner() {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        border: '2px solid var(--borderColor)',
        borderTopColor: 'var(--accent)',
      }}
    />
  );
}

export function LoadingBlock({ label = 'Загрузка' }: LoadingBlockProps) {
  return (
    <XStack
      gap={spacing[2]}
      alignItems="center"
      justifyContent="center"
      padding={spacing[4]}
    >
      <Spinner />
      <Text tone="muted">{label}</Text>
    </XStack>
  );
}
