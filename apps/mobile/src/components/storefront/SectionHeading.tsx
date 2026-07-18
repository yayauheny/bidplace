import { Text, YStack } from 'tamagui';

import { mobileLayout, mobileSpacing } from '../../theme/tokens';

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
}: SectionHeadingProps) {
  return (
    <YStack style={{ gap: mobileSpacing[2], maxWidth: mobileLayout.readingMaxWidth }}>
      {eyebrow ? (
        <Text
          color="$textMuted"
          style={{
            fontSize: 12,
            letterSpacing: 1.1,
            textTransform: 'uppercase',
            textAlign: align,
          }}
        >
          {eyebrow}
        </Text>
      ) : null}
      <Text
        color="$text"
        fontFamily="$heading"
        style={{ fontSize: 38, lineHeight: 44, textAlign: align }}
      >
        {title}
      </Text>
      {description ? (
        <Text color="$textMuted" style={{ fontSize: 16, lineHeight: 24, textAlign: align }}>
          {description}
        </Text>
      ) : null}
    </YStack>
  );
}
