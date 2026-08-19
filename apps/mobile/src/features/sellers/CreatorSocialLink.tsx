import { Link, type Href } from 'expo-router';

import { designTokens } from '@bidplace/design-tokens';

import { AppIcon, MotionPressable } from '../../components/ui';

export type CreatorSocialLinkProps = {
  href: string;
  icon: 'send' | 'instagram' | 'globe';
  label: string;
};

export function CreatorSocialLink({
  href,
  icon,
  label,
}: CreatorSocialLinkProps) {
  return (
    <Link href={href as Href} target="_blank" asChild>
      <MotionPressable
        accessibilityRole="link"
        accessibilityLabel={label}
        preset="icon"
        style={{
          width: 28,
          height: 28,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: designTokens.color.border,
          borderRadius: 14,
        }}
      >
        <AppIcon
          name={icon}
          size={20}
          color={designTokens.color.textSecondary}
        />
      </MotionPressable>
    </Link>
  );
}

