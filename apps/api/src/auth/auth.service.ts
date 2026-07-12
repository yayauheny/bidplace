import {
  type AuthResponse,
  type LoginRequest,
  type RegisterRequest,
  type User as ContractUser,
} from '@bidplace/contracts';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthTokenService } from './auth-token.service';
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

type PrismaUser = {
  id: string;
  email: string;
  passwordHash: string;
  phone: string;
  displayName: string;
  role: ContractUser['role'];
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly authTokenService: AuthTokenService,
  ) {}

  async register(input: RegisterRequest): Promise<AuthResponse> {
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
      const user = await this.prisma.user.create({
        data: {
          email,
          phone: input.phone,
          displayName: input.displayName,
          passwordHash,
        },
      });

      return this.createAuthResponse(user);
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Email or phone already in use');
      }

      throw error;
    }
  }

  async login(input: LoginRequest): Promise<AuthResponse> {
    const email = normalizeEmail(input.email);
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
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
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.toContractUser(user);
  }

  private createAuthResponse(user: PrismaUser): AuthResponse {
    return {
      accessToken: this.authTokenService.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
      }),
      user: this.toContractUser(user),
    };
  }

  private toContractUser(user: PrismaUser): ContractUser {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
