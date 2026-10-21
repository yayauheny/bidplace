import {
  type AcceptRulesRequest,
  ApiErrorCode,
  type AuthResponse,
  type LoginRequest,
  type RegisterRequest,
  type LegalDocumentsResponse,
  type ServiceRulesResponse,
  authResponseSchema,
  CURRENT_RULES_VERSION,
  type User as ContractUser,
} from '@bidplace/contracts';
import {
  ConflictException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { type Prisma } from '@bidplace/database';

import {
  authCredentialsSelect,
  authUserContractSelect,
  type AuthCredentialsRecord,
  toContractUser,
} from './auth.mapper';
import { PasswordHasherService } from './password-hasher.service';
import { AuthAbuseService } from '../auth-abuse/auth-abuse.service';
import { SERVER_ENV, type ServerEnv } from '../core/config';
import {
  PrismaService,
  isPrismaUniqueConstraintError,
  prismaUniqueTargets,
} from '../core/database';
import { AppException } from '../core/errors';
import { resolveServiceRules } from '../core/rules';
import {
  readPublishedLegalDocuments,
  readRegistrationLegalVersion,
} from './legal-documents';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string | null | undefined): string | null {
  const trimmed = phone?.trim();
  return trimmed ? trimmed : null;
}

export interface AuthSessionResult {
  sessionVersion: number;
  user: ContractUser;
}

const authUserExistsSelect = {
  id: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly abuse: AuthAbuseService,
    @Inject(SERVER_ENV) private readonly env: ServerEnv,
  ) {}

  async register(
    input: RegisterRequest & { ip?: string },
  ): Promise<AuthSessionResult> {
    const registrationVersion = readRegistrationLegalVersion();
    const { agreement, privacy, dataConsent } = input.legal;
    if (
      [agreement.version, privacy.version, dataConsent.version].some(
        (version) => version !== undefined && version !== registrationVersion,
      )
    ) {
      throw new ConflictException({
        code: ApiErrorCode.CONFLICT,
        message: 'Legal document version is stale',
        details: { reason: 'legal_version_stale' },
      });
    }
    const email = normalizeEmail(input.email);
    const phone = normalizePhone(input.phone);
    await this.abuse.assertRegistration({
      email,
      turnstileToken: input.turnstileToken,
      ip: input.ip ?? 'unknown',
    });

    const existingUser = await this.prisma.user.findFirst({
      where: phone
        ? {
            OR: [{ email }, { phone }],
          }
        : { email },
      select: authUserExistsSelect,
    });

    if (existingUser) {
      throw new ConflictException('Email or phone already in use');
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const acceptedAt = new Date();

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          phone,
          slug: input.slug,
          displayName: null,
          passwordHash,
          status: 'active',
          sessionVersion: 0,
          emailVerifiedAt: null,
          phoneVerifiedAt: null,
          registrationLegalEvidence: {
            create: {
              agreementVersion: registrationVersion,
              agreementAcceptedAt: acceptedAt,
              privacyVersion: registrationVersion,
              privacyAcknowledgedAt: acceptedAt,
              dataConsentVersion: registrationVersion,
              dataConsentedAt: acceptedAt,
              age18ConfirmedAt: acceptedAt,
            },
          },
        },
        select: authCredentialsSelect,
      });

      return this.createAuthResponse(user);
    } catch (error: unknown) {
      if (isPrismaUniqueConstraintError(error)) {
        const slugTaken = prismaUniqueTargets(error).some((target) =>
          /(^|_)slug($|_)/.test(target),
        );
        if (slugTaken) {
          throw new ConflictException({
            code: ApiErrorCode.CONFLICT,
            message: 'Nickname is already taken',
            details: { reason: 'slug_taken' },
          });
        }
        throw new ConflictException('Email or phone already in use');
      }

      throw error;
    }
  }

  async slugAvailability(slug: string): Promise<{ available: boolean }> {
    const existing = await this.prisma.user.findUnique({
      where: { slug },
      select: { id: true },
    });
    return { available: existing === null };
  }

  async claimSlug(userId: string, slug: string): Promise<{ slug: string }> {
    try {
      const updated = await this.prisma.user.updateMany({
        where: { id: userId, slug: null },
        data: { slug },
      });
      if (updated.count === 1) return { slug };
    } catch (error: unknown) {
      if (!isPrismaUniqueConstraintError(error)) throw error;
      const current = await this.storedSlug(userId);
      if (current) return { slug: current };
      throw new ConflictException({
        code: ApiErrorCode.CONFLICT,
        message: 'Nickname is already taken',
        details: { reason: 'slug_taken' },
      });
    }

    const current = await this.storedSlug(userId);
    if (!current) {
      throw new UnauthorizedException('User not found');
    }
    return { slug: current };
  }

  async login(
    input: LoginRequest & { ip?: string },
  ): Promise<AuthSessionResult> {
    const email = normalizeEmail(input.email);
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: authCredentialsSelect,
    });
    let passwordAccepted = false;
    if (user && toContractUser(user).status === 'active') {
      passwordAccepted = await this.passwordHasher.verify(
        user.passwordHash,
        input.password,
      );
    } else {
      await this.passwordHasher.verify(
        await this.passwordHasher.dummyHash(),
        input.password,
      );
    }

    const decision = await this.abuse.assessLogin({
      email,
      ip: input.ip ?? 'unknown',
      passwordAccepted,
      turnstileToken: input.turnstileToken,
    });

    if (decision.outcome === 'paused') {
      throw new AppException({
        status: HttpStatus.TOO_MANY_REQUESTS,
        code: ApiErrorCode.LOGIN_PAUSED,
        message: 'Login pause is active',
        details: { pausedUntil: decision.pausedUntil.toISOString() },
      });
    }
    if (decision.outcome === 'turnstile_required') {
      throw new AppException({
        status: HttpStatus.FORBIDDEN,
        code: ApiErrorCode.TURNSTILE_REQUIRED,
        message: 'Turnstile token is required',
      });
    }
    if (decision.outcome === 'turnstile_rejected') {
      throw new AppException({
        status: HttpStatus.FORBIDDEN,
        code: ApiErrorCode.TURNSTILE_FAILED,
        message: 'Turnstile verification failed',
      });
    }
    if (decision.outcome === 'turnstile_unavailable') {
      throw new AppException({
        status: HttpStatus.SERVICE_UNAVAILABLE,
        code: ApiErrorCode.TURNSTILE_UNAVAILABLE,
        message: 'Turnstile verification is unavailable',
      });
    }
    if (decision.outcome !== 'accepted' || !user || !passwordAccepted) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.createAuthResponse(user);
  }

  async me(userId: string): Promise<ContractUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: authUserContractSelect,
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return toContractUser(user);
  }

  getLegalDocuments(): LegalDocumentsResponse {
    return readPublishedLegalDocuments();
  }

  async getRules(): Promise<ServiceRulesResponse> {
    return {
      rules: resolveServiceRules(this.env),
    };
  }

  async acceptRules(
    userId: string,
    input: AcceptRulesRequest,
  ): Promise<AuthResponse> {
    if (input.rulesVersion !== CURRENT_RULES_VERSION) {
      throw new ConflictException('Rules version is stale');
    }

    await this.prisma.termsAcceptance.upsert({
      where: {
        userId_rulesVersion: {
          userId,
          rulesVersion: input.rulesVersion,
        },
      },
      create: {
        userId,
        rulesVersion: input.rulesVersion,
        acceptedAt: new Date(),
      },
      update: {
        acceptedAt: new Date(),
      },
    });

    return authResponseSchema.parse({
      user: await this.me(userId),
    });
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        sessionVersion: {
          increment: 1,
        },
      },
    });
  }

  private async storedSlug(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { slug: true },
    });
    if (!user) throw new UnauthorizedException('User not found');
    return user.slug;
  }

  private createAuthResponse(user: AuthCredentialsRecord): AuthSessionResult {
    const contractUser = toContractUser(user);

    return {
      sessionVersion: user.sessionVersion,
      user: contractUser,
    };
  }
}
