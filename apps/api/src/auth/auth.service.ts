import {
  type LoginRequest,
  type RegisterRequest,
  type User as ContractUser,
} from '@bidplace/contracts';
import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthTokenService } from './auth-token.service';
import { type RawAuthUserRecord, toContractUser } from './auth.mapper';
import { PasswordHasherService } from './password-hasher.service';
import { PrismaService } from '../core/database';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isUniqueConstraintError(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'P2002'
  );
}

export interface AuthRepository {
  user: {
    findFirst: PrismaService['user']['findFirst'];
    create: PrismaService['user']['create'];
    findUnique: PrismaService['user']['findUnique'];
    update: PrismaService['user']['update'];
  };
}

export type AuthSessionResult = {
  accessToken: string;
  user: ContractUser;
};

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: AuthRepository,
    private readonly passwordHasher: PasswordHasherService,
    private readonly authTokenService: AuthTokenService,
  ) {}

  async register(input: RegisterRequest): Promise<AuthSessionResult> {
    const email = normalizeEmail(input.email);

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone: input.phone }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Email or phone already in use');
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    try {
      const user = (await this.prisma.user.create({
        data: {
          email,
          phone: input.phone,
          displayName: input.displayName,
          passwordHash,
          status: 'active',
          sessionVersion: 0,
        },
      })) as RawAuthUserRecord;

      return this.createAuthResponse(user);
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Email or phone already in use');
      }

      throw error;
    }
  }

  async login(input: LoginRequest): Promise<AuthSessionResult> {
    const email = normalizeEmail(input.email);
    const user = (await this.prisma.user.findUnique({
      where: {
        email,
      },
    })) as RawAuthUserRecord | null;

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
    const user = (await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    })) as RawAuthUserRecord | null;

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return toContractUser(user);
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        sessionVersion: {
          increment: 1,
        },
      },
    });
  }

  private createAuthResponse(user: RawAuthUserRecord): AuthSessionResult {
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
