import { Link, type Href } from 'expo-router';

import { designTokens, figmaTokens } from '@bidplace/design-tokens';

import { FigmaIcon } from '../../components/figma/FigmaIcon';
import { figmaGlassCircleStyle } from '../../components/figma/figma-glass-circle';
import { MotionPressable } from '../../components/ui';

export type CreatorSocialLinkProps = {
  href: string;
  icon: 'send' | 'instagram' | 'globe';
  label: string;
  grouped?: boolean;
  testID?: string;
};

export function CreatorSocialLink({
  href,
  icon,
  label,
  grouped = false,
  testID,
}: CreatorSocialLinkProps) {
  return (
    <Link href={href as Href} target="_blank" asChild>
      <MotionPressable
        accessibilityRole="link"
        testID={testID}
        accessibilityLabel={label}
        preset="icon"
        style={
          grouped
            ? {
                width: 43,
                height: 43,
                borderWidth: 0.5,
                borderColor: designTokens.color.divider,
                backgroundColor: designTokens.color.white,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: figmaTokens.radius.pill,
              }
            : figmaGlassCircleStyle()
        }
      >
        <FigmaIcon
          name={
            icon === 'send'
              ? 'telegram'
              : icon === 'globe'
                ? 'internet'
                : 'instagram'
          }
          size={
            grouped ? figmaTokens.size.dockIcon : figmaTokens.size.icon
          }
        />
      </MotionPressable>
    </Link>
  );
}
