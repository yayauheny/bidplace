import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
@Injectable()
export class PublicIdService { generate(): string { return randomBytes(8).toString('base64url'); } }
