import {
  Controller,
  ForbiddenException,
  Get,
  UseGuards,
} from '@nestjs/common';

import { BearerAuthGuard, CurrentUser } from '../auth';
import { CommerceEnabledGuard } from '../core/commerce';
import { ActivityService } from './activity.service';

@Controller('me')
@UseGuards(CommerceEnabledGuard, BearerAuthGuard)
export class ActivityController {
  constructor(private readonly activity: ActivityService) {}

  @Get('activity')
  get(@CurrentUser() auth: { sub: string; role: 'admin' | 'user' }) {
    if (auth.role === 'admin')
      throw new ForbiddenException('Administrators do not have buyer activity');
    return this.activity.get(auth.sub);
  }
}
