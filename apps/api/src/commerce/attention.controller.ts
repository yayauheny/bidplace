import type { AuthPrincipal } from '@bidplace/contracts';
import {
  adminAttentionResponseSchema,
  attentionResponseSchema,
} from '@bidplace/contracts';
import { Controller, Get, Header, UseGuards } from '@nestjs/common';

import { AdminGuard } from '../admin/admin.guard';
import { CurrentUser, SessionAuthGuard, VerifiedEmailGuard } from '../auth';
import { AttentionService } from './attention.service';

@Controller()
export class AttentionController {
  constructor(private readonly attention: AttentionService) {}

  @Get('me/attention')
  @Header('Cache-Control', 'private, no-store')
  @UseGuards(SessionAuthGuard, VerifiedEmailGuard)
  async mine(@CurrentUser() auth: AuthPrincipal) {
    return attentionResponseSchema.parse(
      await this.attention.forUser(auth.sub),
    );
  }

  @Get('admin/attention')
  @Header('Cache-Control', 'private, no-store')
  @UseGuards(SessionAuthGuard, VerifiedEmailGuard, AdminGuard)
  async admin() {
    return adminAttentionResponseSchema.parse(await this.attention.forAdmin());
  }
}
