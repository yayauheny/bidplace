import { createTransport, type Transporter } from 'nodemailer';

import { type ServerEnv } from '../config';
import {
  assertSingleEmailRecipient,
  buildSmtpTransportOptions,
} from '../email';
import type { MailMessage } from './mail-message';
import { MailTransport } from './mail-transport';

export class SmtpMailTransport extends MailTransport {
  constructor(
    private readonly env: ServerEnv,
    private readonly transport: Transporter,
  ) {
    super();
  }

  static create(env: ServerEnv): SmtpMailTransport {
    return new SmtpMailTransport(
      env,
      createTransport(buildSmtpTransportOptions(env)),
    );
  }

  async send(message: MailMessage): Promise<void> {
    assertSingleEmailRecipient(message.to);
    await this.transport.sendMail({
      from: this.env.SMTP_FROM,
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
  }
}
