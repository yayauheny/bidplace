import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { LocalFileStorageService } from './local-file-storage.service';

describe('LocalFileStorageService', () => {
  it('stores uploaded files on disk and returns public paths', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'bidplace-storage-'));
    const service = new LocalFileStorageService(rootDir);

    const [storedPath] = await service.storeImages([
      {
        buffer: Buffer.from('image-bytes'),
        originalname: 'Signed Vase.JPG',
        mimetype: 'image/jpeg',
      },
    ]);

    expect(storedPath).toMatch(/^\/uploads\/lots\/.+\.jpg$/);

    const absolutePath = join(
      rootDir,
      storedPath.replace('/uploads/', ''),
    );
    const content = await readFile(absolutePath, 'utf8');

    expect(content).toBe('image-bytes');
  });

  it('rejects unsupported image mimetypes', async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'bidplace-storage-'));
    const service = new LocalFileStorageService(rootDir);

    await expect(
      service.storeImages([
        {
          buffer: Buffer.from('<svg></svg>'),
          originalname: 'vector.svg',
          mimetype: 'image/svg+xml',
        },
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
