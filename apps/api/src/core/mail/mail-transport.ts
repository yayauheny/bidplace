import type { MailMessage } from './mail-message';

export class MailDeliveryDisabledError extends Error {}

export abstract class MailTransport {
  abstract send(message: MailMessage): Promise<void>;
}

export class DisabledMailTransport extends MailTransport {
  async send(): Promise<void> {
    throw new MailDeliveryDisabledError(
      'Email delivery is disabled in staging',
    );
  }
}
