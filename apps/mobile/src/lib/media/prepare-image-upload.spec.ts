import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ImagePreparationError,
  containedDimensions,
  prepareImageUpload,
} from './prepare-image-upload';

const renderer = vi.hoisted(() => ({
  resize: vi.fn(),
  save: vi.fn(),
  renderRelease: vi.fn(),
  contextRelease: vi.fn(),
  manipulate: vi.fn(),
}));

vi.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg', PNG: 'png' },
  ImageManipulator: { manipulate: renderer.manipulate },
}));

const options = {
  maxDimension: 1600,
  maxBytes: 2 * 1024 * 1024,
  maxSourceBytes: 25 * 1024 * 1024,
  quality: 0.85,
};

describe('image upload preparation', () => {
  beforeEach(() => vi.clearAllMocks());
  it('maintains aspect ratio without upscaling', () => {
    expect(containedDimensions(6000, 4000, 1600)).toEqual({ width: 1600, height: 1067 });
    expect(containedDimensions(200, 400, 1600)).toEqual({ width: 200, height: 400 });
  });

  it('keeps small supported files unchanged', async () => {
    const file = new File(['small'], 'photo.png', { type: 'image/png' });
    const input = { uri: 'blob:small', width: 800, height: 600, file };
    await expect(prepareImageUpload(input, options)).resolves.toEqual({
      uri: 'blob:small',
      blob: file,
    });
    expect(renderer.manipulate).not.toHaveBeenCalled();
  });

  it('rejects an oversized source before decoding it', async () => {
    const file = new File([new Uint8Array(25 * 1024 * 1024 + 1)], 'huge.jpg', { type: 'image/jpeg' });
    await expect(prepareImageUpload({ uri: 'blob:huge', width: 200, height: 200, file }, options))
      .rejects.toBeInstanceOf(ImagePreparationError);
  });

  it('converts unsupported formats and downsizes large images', async () => {
    const input = new File(['heic'], 'image.heic', { type: 'image/heic' });
    const output = new Blob(['jpeg'], { type: 'image/jpeg' });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      blob: async () => output,
    } as Response);
    renderer.save.mockResolvedValue({ uri: 'blob:converted' });
    renderer.manipulate.mockReturnValue({
      resize: renderer.resize,
      renderAsync: async () => ({
        saveAsync: renderer.save,
        release: renderer.renderRelease,
      }),
      release: renderer.contextRelease,
    });

    try {
      const result = await prepareImageUpload({
        uri: 'blob:heic',
        width: 4000,
        height: 3000,
        file: input,
      }, options);
      expect(renderer.resize).toHaveBeenCalledWith({ width: 1600, height: 1200 });
      expect(renderer.renderRelease).toHaveBeenCalled();
      expect(renderer.contextRelease).toHaveBeenCalled();
      expect(result.blob.type).toBe('image/jpeg');
      expect(result.uri).toBe('blob:converted');
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('supports lossless PNG output for callers that need transparency', async () => {
    const input = new File(['heic'], 'image.heic', { type: 'image/heic' });
    const output = new Blob(['png'], { type: 'image/png' });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      blob: async () => output,
    } as Response);
    renderer.save.mockResolvedValue({ uri: 'blob:png' });
    renderer.manipulate.mockReturnValue({
      resize: renderer.resize,
      renderAsync: async () => ({
        saveAsync: renderer.save,
        release: renderer.renderRelease,
      }),
      release: renderer.contextRelease,
    });
    try {
      const result = await prepareImageUpload(
        { uri: 'blob:heic', width: 2000, height: 1200, file: input },
        { ...options, format: 'png' },
      );
      expect(renderer.save).toHaveBeenCalledWith({
        format: 'png',
        compress: options.quality,
      });
      expect(result.blob.type).toBe('image/png');
    } finally {
      fetchSpy.mockRestore();
    }
  });

});
