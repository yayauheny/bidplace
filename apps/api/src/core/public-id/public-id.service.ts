import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
export const PUBLIC_ID_LENGTH = 11;
@Injectable()
export class PublicIdService { generate(): string { return randomBytes(8).toString('base64url'); } }
