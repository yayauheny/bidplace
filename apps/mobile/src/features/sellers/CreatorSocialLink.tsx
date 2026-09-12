import { Link, type Href } from 'expo-router';

import { figmaTokens } from '@bidplace/design-tokens';

import { FigmaIcon } from '../../components/figma/FigmaIcon';
import { figmaGlassCircleStyle } from '../../components/figma/figma-glass-circle';
import { AppIcon, MotionPressable } from '../../components/ui';

export type CreatorSocialLinkProps = {
  href: string;
  icon: 'send' | 'instagram' | 'globe';
  label: string;
  grouped?: boolean;
};

export function CreatorSocialLink({
  href,
  icon,
  label,
  grouped = false,
}: CreatorSocialLinkProps) {
  return (
    <Link href={href as Href} target="_blank" asChild>
      <MotionPressable
        accessibilityRole="link"
        accessibilityLabel={label}
        preset="icon"
        style={
          grouped
            ? {
                width: figmaTokens.size.control,
                height: figmaTokens.size.control,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: figmaTokens.radius.pill,
              }
            : figmaGlassCircleStyle()
        }
      >
        {icon === 'send' || icon === 'instagram' ? (
          <FigmaIcon
            name={icon === 'send' ? 'telegram' : 'instagram'}
            size={
              grouped ? figmaTokens.size.socialGroupIcon : figmaTokens.size.icon
            }
          />
        ) : (
          <AppIcon
            name={icon}
            size={
              grouped ? figmaTokens.size.socialGroupIcon : figmaTokens.size.icon
            }
            color={figmaTokens.color.ink}
          />
        )}
      </MotionPressable>
    </Link>
  );
}
