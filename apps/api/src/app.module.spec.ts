import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { MODULE_METADATA } from '@nestjs/common/constants';
import { describe, expect, it } from 'vitest';

import { AppModule } from './app.module';

const COMMERCE_BOOT_MODULES = [
  'ListingsModule',
  'BidsModule',
  'OrdersModule',
  'ActivityModule',
  'RealtimeModule',
  'DiscoveryModule',
  'LifecycleModule',
  'ScheduleModule',
];

function importedModuleNames(): string[] {
  const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, AppModule) as
    | unknown[]
    | undefined;

  return (imports ?? []).flatMap((entry) => {
    if (typeof entry === 'function') {
      return [entry.name];
    }
    if (entry && typeof entry === 'object' && 'module' in entry) {
      const mod = (entry as { module?: { name?: string } }).module;
      return mod?.name ? [mod.name] : [];
    }
    return [];
  });
}

function walkTypeScriptFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) {
      return walkTypeScriptFiles(path);
    }
    if (!path.endsWith('.ts') || path.endsWith('.spec.ts')) {
      return [];
    }
    return [path];
  });
}

describe('AppModule', () => {
  it('does not compose commerce, scheduler, or realtime modules', () => {
    const names = importedModuleNames();

    expect(names).toContain('PortfolioModule');
    expect(names).not.toEqual(expect.arrayContaining(COMMERCE_BOOT_MODULES));
    expect(names.some((name) => name.includes('Schedule'))).toBe(false);
  });

  it('does not register listing-lifecycle cron or a Socket.IO gateway', () => {
    const hits = walkTypeScriptFiles(join(__dirname)).filter((file) => {
      const source = readFileSync(file, 'utf8');
      return (
        source.includes('@Cron') ||
        source.includes('ScheduleModule') ||
        source.includes('IoAdapter') ||
        source.includes('WebSocketGateway') ||
        source.includes('COMMERCE_ENABLED')
      );
    });

    expect(hits).toEqual([]);
  });
});
