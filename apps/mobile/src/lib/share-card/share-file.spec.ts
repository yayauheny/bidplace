/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { shareFile } from './share-file';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('shareFile', () => {
  it('shares the file when the browser supports file sharing', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(true);
    vi.stubGlobal('navigator', { canShare, share });
    const file = new File(['image'], 'work.jpg', { type: 'image/jpeg' });
    expect(await shareFile(file)).toBe('shared');
    expect(canShare).toHaveBeenCalledWith({ files: [file] });
    expect(share).toHaveBeenCalledWith({ files: [file] });
  });

  it('treats a dismissed share as cancellation', async () => {
    vi.stubGlobal('navigator', { canShare: () => true, share: vi.fn().mockRejectedValue(new DOMException('dismissed', 'AbortError')) });
    expect(await shareFile(new File(['image'], 'work.jpg'))).toBe('cancelled');
  });

  it('downloads and releases its object URL when file sharing is unavailable', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('navigator', {});
    const create = vi.fn().mockReturnValue('blob:temporary');
    const revoke = vi.fn();
    vi.stubGlobal('URL', { createObjectURL: create, revokeObjectURL: revoke });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    expect(await shareFile(new File(['image'], 'work.jpg'))).toBe('downloaded');
    expect(click).toHaveBeenCalledTimes(1);
    await vi.runAllTimersAsync();
    expect(revoke).toHaveBeenCalledWith('blob:temporary');
  });

  it('surfaces share failures other than a user cancellation', async () => {
    vi.stubGlobal('navigator', { canShare: () => true, share: vi.fn().mockRejectedValue(new Error('share failed')) });
    await expect(shareFile(new File(['image'], 'work.jpg'))).rejects.toThrow('share failed');
  });

  it('releases the object URL even if triggering a download fails', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('navigator', {});
    const revoke = vi.fn();
    vi.stubGlobal('URL', { createObjectURL: () => 'blob:temporary', revokeObjectURL: revoke });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => { throw new Error('download failed'); });
    await expect(shareFile(new File(['image'], 'work.jpg'))).rejects.toThrow('download failed');
    await vi.runAllTimersAsync();
    expect(revoke).toHaveBeenCalledWith('blob:temporary');
  });

});
