import { Link, type Href } from 'expo-router';

import { figmaTokens } from '@bidplace/design-tokens';

import { FigmaIcon } from '../../components/figma/FigmaIcon';
import { figmaGlassCircleStyle } from '../../components/figma/figma-glass-circle';
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
        style={figmaGlassCircleStyle()}
      >
        {icon === 'send' ? (
          <FigmaIcon name="telegram" />
        ) : (
          <AppIcon
            name={icon}
            size={figmaTokens.size.icon}
            color={figmaTokens.color.ink}
          />
        )}
      </MotionPressable>
    </Link>
  );
}
