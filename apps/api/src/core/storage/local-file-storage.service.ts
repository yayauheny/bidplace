import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';

import { FileStorageService, type StoredFile } from './file-storage.service';

function sanitizeFileName(fileName: string): string {
  const normalized = fileName.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-');
  const trimmed = normalized.replace(/-+/g, '-').replace(/^-|-$/g, '');

  return trimmed.length > 0 ? trimmed.toLowerCase() : 'file';
}

function imageExtensionForMimeType(mimetype: string): string {
  switch (mimetype) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    default:
      throw new BadRequestException('Unsupported image type');
  }
}

@Injectable()
export class LocalFileStorageService extends FileStorageService {
  constructor(private readonly rootDir: string = join(process.cwd(), 'uploads')) {
    super();
  }

  async storeImages(files: readonly StoredFile[]): Promise<string[]> {
    if (files.length === 0) {
      return [];
    }

    const directory = join(this.rootDir, 'lots');
    await mkdir(directory, { recursive: true });

    return Promise.all(
      files.map(async (file) => {
        const originalBaseName = sanitizeFileName(
          basename(file.originalname, extname(file.originalname)),
        );
        const extension = imageExtensionForMimeType(file.mimetype);
        const fileName = `${randomUUID()}-${originalBaseName}${extension}`;
        const absolutePath = join(directory, fileName);

        await writeFile(absolutePath, file.buffer);

        return `/uploads/lots/${fileName}`;
      }),
    );
  }
}
