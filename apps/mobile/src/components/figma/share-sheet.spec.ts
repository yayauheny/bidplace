import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  copyShareUrl,
  shareClipboardStatusMessage,
  shareDownloadStatusMessage,
  triggerBrowserDownload,
} from './share-sheet';

describe('share sheet actions', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('copies the canonical URL and reports clipboard status', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    await copyShareUrl(' https://bidplace.example/authors/vex ');

    expect(writeText).toHaveBeenCalledWith(
      'https://bidplace.example/authors/vex',
    );
    expect(shareClipboardStatusMessage('success')).toBe('Ссылка скопирована.');
    expect(shareClipboardStatusMessage('error')).toBe(
      'Не удалось скопировать ссылку.',
    );
  });

  it('fails closed when clipboard is unavailable', async () => {
    vi.stubGlobal('navigator', {});
    await expect(copyShareUrl('https://bidplace.example/authors/vex')).rejects.toThrow(
      'clipboard-unavailable',
    );
  });

  it('owns browser download of the encoded QR', () => {
    const click = vi.fn();
    const link = {
      href: '',
      download: '',
      click,
    };
    const appendChild = vi.fn();
    const remove = vi.fn();
    vi.stubGlobal('document', {
      createElement: vi.fn(() => ({ ...link, remove })),
      body: { appendChild },
    });

    expect(
      triggerBrowserDownload('data:image/png;base64,abc', 'bidplace-share.png'),
    ).toBe(true);
    expect(appendChild).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(shareDownloadStatusMessage('success')).toBe('QR сохранён.');
  });
});
