import { Link } from 'expo-router';
import type { SellerStatus } from '@bidplace/contracts';
import { AppText, MotionPressable } from '../ui';
import { designTokens } from '@bidplace/design-tokens';

import {
  createWorkActionInteractionStyle,
  createWorkActionStyle,
} from './header-layout';
import { canShowDesktopCreateWork } from './header-chrome';

export function CreateWorkAction({
  isAdmin,
  sellerStatus,
}: {
  isAdmin: boolean;
  sellerStatus: SellerStatus | null;
}) {
  const canCreate = canShowDesktopCreateWork({ isAdmin, sellerStatus });
  if (!canCreate) return null;

  return (
    <Link href="/products/new" asChild>
      <MotionPressable
        accessibilityRole="link"
        accessibilityLabel="Добавить работу"
        preset="primaryAction"
        style={createWorkActionStyle()}
        interactionStyle={createWorkActionInteractionStyle()}
      >
        <AppText
          role="button"
          numberOfLines={1}
          style={{ color: designTokens.color.surface }}
        >
          Создать
        </AppText>
      </MotionPressable>
    </Link>
  );
}
