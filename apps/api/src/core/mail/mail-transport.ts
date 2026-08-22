import type { MailMessage } from './mail-message';

export abstract class MailTransport {
  abstract send(message: MailMessage): Promise<void>;
}
