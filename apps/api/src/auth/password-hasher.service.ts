import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import argon2 from 'argon2';

const DUMMY_PASSWORD = 'bidplace-login-timing-dummy';

@Injectable()
export class PasswordHasherService implements OnApplicationBootstrap {
  private dummyHashPromise: Promise<string> | undefined;

  onApplicationBootstrap(): Promise<void> {
    return this.dummyHash().then(() => undefined);
  }

  hash(password: string): Promise<string> {
    return argon2.hash(password);
  }

  dummyHash(): Promise<string> {
    this.dummyHashPromise ??= argon2.hash(DUMMY_PASSWORD);
    return this.dummyHashPromise;
  }

  verify(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }
}
