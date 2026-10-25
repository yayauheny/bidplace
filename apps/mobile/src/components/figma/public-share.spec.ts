import { beforeEach, describe, expect, it, vi } from 'vitest';
import { publicShareTarget } from './public-share';

describe('public share target', () => {
  it.each(['/authors/vex', '/authors/bala_klava', '/works/daliEstate1'])(
    'keeps %s on the current origin with a PNG filename',
    (path) => {
      expect(publicShareTarget(path, 'https://bidplace.test')).toEqual({
        url: `https://bidplace.test${path}`,
        filename: `bidplace-${path.split('/').at(-1)}.png`,
      });
    },
  );
  it.each([
    'https://other.test/authors/anna',
    '//other.test',
    '/admin',
    '/authors/anna?email=x',
    '/works/../admin',
    '/works/short',
  ])('rejects %s', (path) => {
    expect(() => publicShareTarget(path, 'https://bidplace.test')).toThrow(
      'Invalid public share path',
    );
  });
});

const native = vi.hoisted(() => ({
  copy: vi.fn(),
  available: vi.fn(),
  share: vi.fn(),
  file: {
    uri: 'file:///cache/bidplace-daliEstate1.png',
    exists: true,
    create: vi.fn(),
    write: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock('expo-clipboard', () => ({ setStringAsync: native.copy }));
vi.mock('expo-sharing', () => ({
  isAvailableAsync: native.available,
  shareAsync: native.share,
}));
vi.mock('expo-file-system', () => ({
  Paths: { cache: '/cache' },
  File: vi.fn().mockImplementation(function () {
    return native.file;
  }),
}));

import { copyPublicLink, downloadQrPng } from './share-platform.native';

describe('native public share actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    native.available.mockResolvedValue(true);
    native.share.mockResolvedValue(undefined);
  });
  it('copies the supplied canonical URL', async () => {
    await copyPublicLink('https://bid.place/works/daliEstate1');
    expect(native.copy).toHaveBeenCalledWith(
      'https://bid.place/works/daliEstate1',
    );
  });
  it('exports PNG bytes and keeps the cached file available to receiving apps', async () => {
    await downloadQrPng(
      'data:image/png;base64,cG5n',
      'bidplace-daliEstate1.png',
    );
    expect(native.file.write).toHaveBeenCalledWith('cG5n', {
      encoding: 'base64',
    });
    expect(native.share).toHaveBeenCalledWith(
      native.file.uri,
      expect.objectContaining({ mimeType: 'image/png', UTI: 'public.png' }),
    );
    expect(native.file.delete).not.toHaveBeenCalled();
  });
  it('surfaces unavailable sharing without creating a file', async () => {
    native.available.mockResolvedValue(false);
    await expect(
      downloadQrPng('data:image/png;base64,cG5n', 'qr.png'),
    ).rejects.toThrow('PNG sharing unavailable');
    expect(native.file.create).not.toHaveBeenCalled();
  });
  it('surfaces sharing failure for a retry', async () => {
    native.share.mockRejectedValue(new Error('Save failed'));
    await expect(
      downloadQrPng('data:image/png;base64,cG5n', 'qr.png'),
    ).rejects.toThrow('Save failed');
    expect(native.file.delete).not.toHaveBeenCalled();
  });
});
