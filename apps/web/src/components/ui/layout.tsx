import type { ComponentPropsWithoutRef } from 'react';

import { layout, spacing, typography } from '../../theme/tokens';
import { XStack, YStack } from './stack';

type StackProps = ComponentPropsWithoutRef<typeof YStack>;

export function Screen({ children, ...props }: StackProps) {
  return (
    <YStack
      flex={1}
      minHeight="100vh"
      backgroundColor="var(--background)"
      paddingVertical={spacing[4]}
      paddingHorizontal={spacing[4]}
      {...props}
    >
      {children}
    </YStack>
  );
}

export function PageContainer({ children, ...props }: StackProps) {
  return (
    <YStack
      width="100%"
      maxWidth={layout.pageMaxWidth}
      alignSelf="center"
      gap={spacing[5]}
      {...props}
    >
      {children}
    </YStack>
  );
}

export function Section({ children, ...props }: StackProps) {
  return (
    <YStack
      gap={spacing[4]}
      padding={spacing[4]}
      borderWidth={1}
      borderColor="var(--borderColor)"
      borderRadius={16}
      backgroundColor="var(--surface)"
      shadowColor="rgba(0, 0, 0, 0.16)"
      shadowOpacity={1}
      shadowRadius={24}
      shadowOffset={{ width: 0, height: 8 }}
      {...props}
    >
      {children}
    </YStack>
  );
}

type HeadingLevel = 'display' | 'h1' | 'h2' | 'h3';
type HeadingTag = 'h1' | 'h2' | 'h3';

const headingTokens: Record<
  HeadingLevel,
  { size: number; lineHeight: number; weight: number; letterSpacing: number }
> = {
  display: {
    size: typography.display.size,
    lineHeight: typography.display.lineHeight,
    weight: 700,
    letterSpacing: typography.display.letterSpacing,
  },
  h1: {
    size: typography.heading.size,
    lineHeight: typography.heading.lineHeight,
    weight: 700,
    letterSpacing: typography.heading.letterSpacing,
  },
  h2: {
    size: typography.title.size,
    lineHeight: typography.title.lineHeight,
    weight: 650,
    letterSpacing: typography.title.letterSpacing,
  },
  h3: {
    size: 20,
    lineHeight: 26,
    weight: 600,
    letterSpacing: -0.2,
  },
};

type BaseTextProps = ComponentPropsWithoutRef<'div'>;

type TextProps = BaseTextProps & {
  tone?: 'default' | 'muted' | 'accent' | 'danger' | 'success';
  weight?: 'normal' | 'medium' | 'strong';
  size?: 'small' | 'body' | 'caption';
};

type HeadingProps = BaseTextProps & {
  level?: HeadingLevel;
};

export function Heading({
  level = 'h2',
  children,
  style,
  ...props
}: HeadingProps) {
  const tokens = headingTokens[level];
  const HeadingTag: HeadingTag = level === 'display' ? 'h1' : level;

  return (
    <HeadingTag
      {...props}
      style={{
        color: 'var(--color)',
        fontFamily: 'inherit',
        fontWeight: tokens.weight,
        fontSize: tokens.size,
        lineHeight: `${tokens.lineHeight}px`,
        letterSpacing: `${tokens.letterSpacing}px`,
        margin: 0,
        ...style,
      }}
    >
      {children}
    </HeadingTag>
  );
}

export function Text({
  tone = 'default',
  weight = 'normal',
  size = 'body',
  children,
  style,
  ...props
}: TextProps) {
  const toneColor =
    tone === 'muted'
      ? 'var(--colorMuted)'
      : tone === 'accent'
        ? 'var(--accent)'
        : tone === 'danger'
          ? 'var(--danger)'
          : tone === 'success'
            ? 'var(--success)'
            : 'var(--color)';

  const fontWeight =
    weight === 'medium' ? 500 : weight === 'strong' ? 600 : 400;

  const sizeTokens =
    size === 'small'
      ? typography.small
      : size === 'caption'
        ? typography.caption
        : typography.body;

  return (
    <div
      {...props}
      style={{
        color: toneColor,
        fontFamily: 'inherit',
        fontWeight,
        fontSize: sizeTokens.size,
        lineHeight: `${sizeTokens.lineHeight}px`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function InlineCluster({ children, ...props }: StackProps) {
  return (
    <XStack alignItems="center" gap={spacing[2]} {...props}>
      {children}
    </XStack>
  );
}
