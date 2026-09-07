import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { CommerceCapability } from './commerce-capability';

@Injectable()
export class CommerceEnabledGuard implements CanActivate {
  constructor(private readonly commerce: CommerceCapability) {}

  canActivate(context: ExecutionContext): boolean {
    void context;
    this.commerce.assertEnabled();
    return true;
  }
}
