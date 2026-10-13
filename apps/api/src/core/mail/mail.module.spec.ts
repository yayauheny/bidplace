import 'reflect-metadata';
import { Global, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';
import { SERVER_ENV, type ServerEnv } from '../config';
import { syntheticProductionServerEnv } from '../config/synthetic-server-env';
import {
  DisabledMailTransport,
  MailDeliveryDisabledError,
  MailTransport,
} from './mail-transport';
import { MailModule } from './mail.module';
import { SmtpMailTransport } from './smtp-mail-transport';

async function mailContext(env: ServerEnv) {
  class EnvironmentModule {}
  Global()(EnvironmentModule);
  Module({
    providers: [{ provide: SERVER_ENV, useValue: env }],
    exports: [SERVER_ENV],
  })(EnvironmentModule);
  class RootModule {}
  Module({ imports: [EnvironmentModule, MailModule] })(RootModule);
  return NestFactory.createApplicationContext(RootModule, {
    logger: false,
    abortOnError: false,
  });
}

describe('MailModule environment selection', () => {
  it('never creates SMTP or accepts delivery in staging, including configured SMTP relays', async () => {
    const smtp = vi.spyOn(SmtpMailTransport, 'create');
    const app = await mailContext(
      syntheticProductionServerEnv({ APP_ENV: 'staging' }),
    );
    try {
      const mail = app.get(MailTransport);
      expect(mail).toBeInstanceOf(DisabledMailTransport);
      await expect(
        mail.send({
          to: 'fixture@example.test',
          subject: 'OTP',
          text: 'fixture',
        }),
      ).rejects.toBeInstanceOf(MailDeliveryDisabledError);
      expect(smtp).not.toHaveBeenCalled();
    } finally {
      await app.close();
      smtp.mockRestore();
    }
  });

  it('keeps the production SMTP transport', async () => {
    const app = await mailContext(syntheticProductionServerEnv());
    try {
      expect(app.get(MailTransport)).toBeInstanceOf(SmtpMailTransport);
    } finally {
      await app.close();
    }
  });
});
