import {
  type AcceptRulesRequest,
  type AuthResponse,
  type LoginRequest,
  type RegisterRequest,
  type ServiceRulesResponse,
  authResponseSchema,
  CURRENT_RULES_VERSION,
  type User as ContractUser,
} from '@bidplace/contracts';
import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { type Prisma } from '@bidplace/database';

import { AuthTokenService } from './auth-token.service';
import {
  authCredentialsSelect,
  authUserContractSelect,
  type AuthCredentialsRecord,
  toContractUser,
} from './auth.mapper';
import { PasswordHasherService } from './password-hasher.service';
import { SERVER_ENV, type ServerEnv } from '../core/config';
import { PrismaService, isPrismaUniqueConstraintError } from '../core/database';
import { resolveServiceRules } from '../core/rules';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string | null | undefined): string | null {
  const trimmed = phone?.trim();
  return trimmed ? trimmed : null;
}

export interface AuthSessionResult {
  accessToken: string;
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
    private readonly authTokenService: AuthTokenService,
    @Inject(SERVER_ENV) private readonly env: ServerEnv,
  ) {}

  async register(input: RegisterRequest): Promise<AuthSessionResult> {
    const email = normalizeEmail(input.email);
    const phone = normalizePhone(input.phone);

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

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          phone,
          displayName: input.displayName,
          passwordHash,
          status: 'active',
          sessionVersion: 0,
          emailVerifiedAt: null,
          phoneVerifiedAt: null,
        },
        select: authCredentialsSelect,
      });

      return this.createAuthResponse(user);
    } catch (error: unknown) {
      if (isPrismaUniqueConstraintError(error)) {
        throw new ConflictException('Email or phone already in use');
      }

      throw error;
    }
  }

  async login(input: LoginRequest): Promise<AuthSessionResult> {
    const email = normalizeEmail(input.email);
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: authCredentialsSelect,
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const contractUser = toContractUser(user);

    if (contractUser.status !== 'active') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.passwordHasher.verify(
      user.passwordHash,
      input.password,
    );

    if (!isPasswordValid) {
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

  private createAuthResponse(user: AuthCredentialsRecord): AuthSessionResult {
    const contractUser = toContractUser(user);

    return {
      accessToken: this.authTokenService.sign({
        sub: user.id,
        email: user.email,
        role: contractUser.role,
        sessionVersion: user.sessionVersion,
      }),
      user: contractUser,
    };
  }
}
