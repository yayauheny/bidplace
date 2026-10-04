import { AppText } from '../ui';
import { mediaDeliveryMessage, type MediaDelivery } from './media-delivery';
export function MediaDeliveryNotice({ delivery }: { delivery: MediaDelivery }) {
  const message = mediaDeliveryMessage(delivery);
  return message ? (
    <AppText role="bodySmall" tone="secondary" accessibilityLiveRegion="polite">
      {message}
    </AppText>
  ) : null;
}
