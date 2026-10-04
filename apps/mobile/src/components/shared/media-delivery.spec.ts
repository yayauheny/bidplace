import { describe, expect, it } from 'vitest';
import { mediaDeliveryMessage, mediaDeliveryPending } from './media-delivery';
describe('media delivery state', () => {
  it.each(['PENDING', 'RUNNING', 'FAILED'] as const)(
    'announces %s and continues polling',
    (state) => {
      const delivery = {
        id: 'operation',
        kind: 'PUBLISH' as const,
        state,
        attemptCount: 1,
      };
      expect(mediaDeliveryPending(delivery)).toBe(true);
      expect(mediaDeliveryMessage(delivery)).toContain(
        state === 'FAILED' ? 'Повторим автоматически' : 'ожидает доставки',
      );
    },
  );
  it.each(['DONE', 'CANCELLED'] as const)('stops polling after %s', (state) => {
    const delivery = {
      id: 'operation',
      kind: 'PUBLISH' as const,
      state,
      attemptCount: 1,
    };
    expect(mediaDeliveryPending(delivery)).toBe(false);
    expect(mediaDeliveryMessage(delivery)).toBeNull();
  });
});
