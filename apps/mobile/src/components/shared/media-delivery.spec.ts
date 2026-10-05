import { describe, expect, it } from 'vitest';
import {
  mediaDeliveryMessage,
  mediaDeliveryPending,
  mediaDeliveryRefetchInterval,
} from './media-delivery';
describe('media delivery state', () => {
  it.each(['PENDING', 'RUNNING', 'FAILED'] as const)(
    'announces %s without scheduling another poll',
    (state) => {
      const delivery = {
        id: 'operation',
        kind: 'PUBLISH' as const,
        state,
        attemptCount: 1,
      };
      expect(mediaDeliveryPending(delivery)).toBe(true);
      expect(mediaDeliveryRefetchInterval(delivery)).toBe(false);
      expect(mediaDeliveryMessage(delivery)).toContain('Повторите действие');
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
