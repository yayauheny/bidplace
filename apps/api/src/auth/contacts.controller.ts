import { randomUUID } from 'node:crypto';

import type { AuthPrincipal } from '@bidplace/contracts';
import {
  userContactsRequestSchema,
  userContactsResponseSchema,
} from '@bidplace/contracts';
import { Prisma } from '@bidplace/database';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { AntifraudService, RateLimit, RateLimitGuard } from '../antifraud';
import { PrismaService, runReadCommittedTransaction } from '../core/database';
import { parseBody } from '../core/validation';
import { enqueueNotification } from '../notifications/notification-outbox';
import { CurrentUser } from './current-user.decorator';
import { SessionAuthGuard } from './session-auth.guard';
import type { SessionRequest } from './session.service';
import { VerifiedEmailGuard } from './verified-email.guard';

const CONTACT_FRESHNESS_MS = 5 * 60_000;

async function readOwnContacts(db: Prisma.TransactionClient, userId: string) {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      contactPhone: true,
      contactTelegram: true,
      contactInstagram: true,
      contactVk: true,
    },
  });
  const seller = await db.sellerProfile.findUnique({
    where: { userId },
    select: { showContactsToBuyer: true },
  });
  return {
    phone: user.contactPhone,
    telegram: user.contactTelegram,
    instagram: user.contactInstagram,
    vk: user.contactVk,
    showToBuyer: seller ? seller.showContactsToBuyer : null,
  };
}

function storedTelegram(value: string): string {
  const link = /^https:\/\/t\.me\/([A-Za-z0-9_]{5,32})$/.exec(value);
  if (link?.[1]) return `@${link[1]}`;
  return value;
}

@Controller('me')
@UseGuards(SessionAuthGuard, VerifiedEmailGuard)
export class ContactsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly antifraud: AntifraudService,
  ) {}

  @Get('contacts')
  @Header('Cache-Control', 'private, no-store')
  async read(@CurrentUser() auth: AuthPrincipal) {
    const stored = await runReadCommittedTransaction(this.prisma, (tx) =>
      readOwnContacts(tx, auth.sub),
    );
    return userContactsResponseSchema.parse(stored);
  }

  @Put('contacts')
  @UseGuards(RateLimitGuard)
  @RateLimit({
    keyPrefix: 'auth:contacts',
    limit: 10,
    windowMs: 60 * 60_000,
    scope: 'user',
  })
  @Header('Cache-Control', 'private, no-store')
  async update(
    @CurrentUser() auth: AuthPrincipal,
    @Body() body: unknown,
    @Req() request: SessionRequest,
  ) {
    const authenticatedAt = request.session.principal?.authenticatedAt;
    if (
      !Number.isSafeInteger(authenticatedAt) ||
      Date.now() - authenticatedAt! > CONTACT_FRESHNESS_MS
    ) {
      throw new UnauthorizedException('Для смены контактов войдите в аккаунт заново');
    }
    const input = parseBody(userContactsRequestSchema, body);
    if (Object.keys(input).length === 0) {
      throw new BadRequestException('Contact change is empty');
    }
    const stored = await runReadCommittedTransaction(this.prisma, async (tx) => {
      await this.antifraud.lockUsers(tx, [auth.sub]);
      const profile = await tx.sellerProfile.findUnique({
        where: { userId: auth.sub },
        select: { userId: true },
      });
      if (input.showToBuyer !== undefined && !profile) {
        throw new BadRequestException('Seller profile is required');
      }
      const data: Prisma.UserUpdateInput = {};
      if (input.phone !== undefined) data.contactPhone = input.phone;
      if (input.telegram !== undefined) {
        data.contactTelegram =
          input.telegram === null ? null : storedTelegram(input.telegram);
      }
      if (input.instagram !== undefined) data.contactInstagram = input.instagram;
      if (input.vk !== undefined) data.contactVk = input.vk;
      if (Object.keys(data).length > 0) {
        const updated = await tx.user.updateMany({
          where: { id: auth.sub, status: 'active' },
          data,
        });
        if (updated.count !== 1) {
          throw new UnauthorizedException('Session revoked');
        }
      }
      if (input.showToBuyer !== undefined) {
        const shown = await tx.sellerProfile.updateMany({
          where: { userId: auth.sub },
          data: { showContactsToBuyer: input.showToBuyer },
        });
        if (shown.count !== 1) {
          throw new BadRequestException('Seller profile is required');
        }
      }
      await enqueueNotification(tx, {
        userId: auth.sub,
        kind: 'CONTACTS_CHANGED',
        payload: { eventId: randomUUID() },
      });
      return readOwnContacts(tx, auth.sub);
    });
    return userContactsResponseSchema.parse(stored);
  }
}
