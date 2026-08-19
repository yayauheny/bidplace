import { Link } from 'expo-router';
import type { SellerStatus } from '@bidplace/contracts';
import { AppText, MotionPressable } from '../ui';
import { designTokens } from '@bidplace/design-tokens';

import {
  createListingActionInteractionStyle,
  createListingActionStyle,
} from './header-layout';
import { canShowDesktopCreateListing } from './header-chrome';

export function CreateListingAction({
  isAdmin,
  sellerStatus,
}: {
  isAdmin: boolean;
  sellerStatus: SellerStatus | null;
}) {
  const canCreate = canShowDesktopCreateListing({ isAdmin, sellerStatus });
  if (!canCreate) return null;

  return (
    <Link href="/products/new" asChild>
      <MotionPressable
        accessibilityRole="link"
        accessibilityLabel="Добавить работу"
        preset="primaryAction"
        style={createListingActionStyle()}
        interactionStyle={createListingActionInteractionStyle()}
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

