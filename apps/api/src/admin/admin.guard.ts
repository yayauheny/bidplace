import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
@Injectable() export class AdminGuard implements CanActivate { canActivate(context: ExecutionContext): boolean { const auth = context.switchToHttp().getRequest<{ auth?: { role?: string } }>().auth; if (auth?.role !== 'admin') throw new ForbiddenException('Admin access required'); return true; } }
