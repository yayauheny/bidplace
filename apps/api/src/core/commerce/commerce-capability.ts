import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class CommerceCapability {
  constructor(private readonly enabled: boolean) {}

  isEnabled(): boolean {
    return this.enabled;
  }

  assertEnabled(): void {
    if (!this.enabled) {
      throw new NotFoundException('Commerce is unavailable');
    }
  }
}
