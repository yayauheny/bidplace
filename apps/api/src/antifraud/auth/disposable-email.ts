import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Injectable } from '@nestjs/common';

import { normalizeEmail } from './auth-abuse.policy';

function packagedListPath(): string {
  return join(__dirname, 'vendor', 'disposable-email-domains.txt');
}

export function loadDisposableDomains(filePath = packagedListPath()): ReadonlySet<string> {
  const domains = new Set<string>();
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const domain = line.trim().toLowerCase();
    if (!domain || domain.startsWith('#') || domain.includes('@')) continue;
    domains.add(domain);
  }
  return domains;
}

@Injectable()
export class DisposableEmailList {
  private readonly domains = loadDisposableDomains();

  contains(email: string): boolean {
    const domain = normalizeEmail(email).split('@')[1];
    if (!domain) return false;
    const labels = domain.split('.').filter(Boolean);
    for (let index = 0; index < labels.length - 1; index += 1) {
      if (this.domains.has(labels.slice(index).join('.'))) return true;
    }
    return false;
  }
}
