import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ImagePreparationError,
  containedDimensions,
  prepareImageUpload,
  readImageUpload,
} from './prepare-image-upload';
import {
  composePhotoEdit,
  originalPhotoEdit,
  photoPixelCrop,
  preparePhotoEdit,
  transformedPhotoSize,
} from './photo-edit';

const renderer = vi.hoisted(() => ({
  resize: vi.fn(),
  save: vi.fn(),
  renderRelease: vi.fn(),
  contextRelease: vi.fn(),
  manipulate: vi.fn(),
}));

const generated = vi.hoisted(() => ({
  deleteGeneratedImage: vi.fn(async (_uri: string) => undefined),
}));

vi.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg', PNG: 'png' },
  FlipType: { Horizontal: 'horizontal', Vertical: 'vertical' },
  ImageManipulator: { manipulate: renderer.manipulate },
}));

vi.mock('./temporary-image', () => ({
  deleteGeneratedImage: generated.deleteGeneratedImage,
}));

const options = {
  maxDimension: 1600,
  maxBytes: 2 * 1024 * 1024,
  maxSourceBytes: 25 * 1024 * 1024,
  quality: 0.85,
};

vi.mock('react-native', () => ({ Platform: { OS: 'web' } }));

describe('image upload preparation', () => {
  beforeEach(() => vi.clearAllMocks());
  it.each(['work', 'avatar'] as const)(
    'renders confirmed %s transforms once and only crops avatar pixels',
    async (purpose) => {
      const operations: unknown[] = [];
      const output = new Blob(['transparent-output'], { type: 'image/png' });
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue({ ok: true, blob: async () => output } as Response);
      renderer.save.mockResolvedValue({
        uri: 'blob:rendered',
        width: purpose === 'avatar' ? 20 : 40,
        height: purpose === 'avatar' ? 40 : 80,
      });
      renderer.manipulate.mockReturnValue({
        flip: (value: unknown) => operations.push(['flip', value]),
        rotate: (value: unknown) => operations.push(['rotate', value]),
        crop: (value: unknown) => operations.push(['crop', value]),
        renderAsync: async () => ({
          saveAsync: renderer.save,
          release: renderer.renderRelease,
        }),
        release: renderer.contextRelease,
      });
      try {
        const crop = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };
        const result = await preparePhotoEdit(
          {
            uri: 'blob:source',
            file: new File(['source'], 'source.png', { type: 'image/png' }),
            width: 80,
            height: 40,
          },
          { ...originalPhotoEdit, rotate: 90, flipHorizontal: true, crop },
          purpose,
        );
        expect(operations).toEqual([
          ['flip', 'horizontal'],
          ['rotate', 90],
          ...(purpose === 'avatar'
            ? [['crop', { originX: 10, originY: 20, width: 20, height: 40 }]]
            : []),
        ]);
        expect(renderer.manipulate).toHaveBeenCalledOnce();
        expect(renderer.save).toHaveBeenCalledExactlyOnceWith({
          format: 'png',
          compress: 1,
        });
        expect(result.blob).toBe(output);
        expect(result.input).toMatchObject(
          purpose === 'avatar'
            ? { width: 20, height: 40 }
            : { width: 40, height: 80 },
        );
        result.dispose();
      } finally {
        fetchSpy.mockRestore();
      }
    },
  );

  it.each(['png', 'jpeg', 'heic'])(
    'reads an unchanged %s input without dimensions or pixel processing',
    async (format) => {
      const file = new File(['original'], `photo.${format}`, {
        type: `image/${format}`,
      });
      await expect(
        readImageUpload({ uri: 'blob:original', file }, file.size),
      ).resolves.toBe(file);
      expect(renderer.manipulate).not.toHaveBeenCalled();
    },
  );

  it.each([
    { size: 0, code: 'EMPTY_FILE' },
    { size: 11, code: 'SOURCE_TOO_LARGE' },
  ])('rejects a source of $size bytes with $code', async ({ size, code }) => {
    const file = new File([new Uint8Array(size)], 'photo.png');
    await expect(
      readImageUpload({ uri: 'blob:invalid', file }, 10),
    ).rejects.toMatchObject({ code });
    expect(renderer.manipulate).not.toHaveBeenCalled();
  });

  it('rejects the picker byte limit before reading the URI', async () => {
    const read = vi.spyOn(globalThis, 'fetch');
    try {
      await expect(
        readImageUpload({ uri: 'blob:large', fileSize: 11 }, 10),
      ).rejects.toMatchObject({ code: 'SOURCE_TOO_LARGE' });
      expect(read).not.toHaveBeenCalled();
    } finally {
      read.mockRestore();
    }
  });

  it('reports a failed local read without attempting pixel processing', async () => {
    const read = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('unavailable'));
    try {
      await expect(
        readImageUpload({ uri: 'blob:unavailable' }, 10),
      ).rejects.toMatchObject({ code: 'READ_FAILED' });
      expect(renderer.manipulate).not.toHaveBeenCalled();
    } finally {
      read.mockRestore();
    }
  });

  it.each([0, 90, 180, 270])(
    'maps dimensions and crop bounds after %i degrees',
    (rotate) => {
      const size = transformedPhotoSize(801, 603, rotate);
      expect(size).toEqual(
        rotate % 180
          ? { width: 603, height: 801 }
          : { width: 801, height: 603 },
      );
      const crop = photoPixelCrop(
        { x: 0.1, y: 0.2, width: 0.9, height: 0.8 },
        size.width,
        size.height,
      );
      expect(crop.originX + crop.width).toBe(size.width);
      expect(crop.originY + crop.height).toBe(size.height);
      expect(crop.width).toBeGreaterThan(0);
    },
  );

  it('composes reopened edits from the original rather than re-encoding the last output', () => {
    const first = { ...originalPhotoEdit, rotate: 90, flipHorizontal: true };
    const crop = { x: 0.2, y: 0.1, width: 0.5, height: 0.7 };
    const second = { ...originalPhotoEdit, rotate: 270, crop };
    expect(composePhotoEdit(first, second)).toEqual({
      ...originalPhotoEdit,
      flipHorizontal: true,
      crop,
    });
    expect(
      composePhotoEdit(originalPhotoEdit, {
        ...originalPhotoEdit,
        rotate: 180,
        flipHorizontal: true,
        flipVertical: true,
      }),
    ).toEqual(originalPhotoEdit);
  });

  it('leaves Work pixels unchanged for a crop-only edit', async () => {
    const file = new File(['full image'], 'work.png', { type: 'image/png' });
    const input = { uri: 'blob:work', width: 800, height: 600, file };
    const prepared = await preparePhotoEdit(
      input,
      {
        ...originalPhotoEdit,
        crop: { x: 0.1, y: 0.1, width: 0.6, height: 0.6 },
      },
      'work',
    );
    expect(prepared.blob).toBe(file);
    expect(prepared.input).toBe(input);
    expect(renderer.manipulate).not.toHaveBeenCalled();
    expect(() => prepared.dispose()).not.toThrow();
  });

  it('maintains aspect ratio without upscaling', () => {
    expect(containedDimensions(6000, 4000, 1600)).toEqual({
      width: 1600,
      height: 1067,
    });
    expect(containedDimensions(200, 400, 1600)).toEqual({
      width: 200,
      height: 400,
    });
  });

  it.each(['jpeg', 'png', 'webp'])(
    'keeps small supported %s files unchanged',
    async (format) => {
      const file = new File(['small'], `photo.${format}`, {
        type: `image/${format}`,
      });
      const input = { uri: 'blob:small', width: 800, height: 600, file };
      await expect(prepareImageUpload(input, options)).resolves.toEqual({
        uri: 'blob:small',
        blob: file,
      });
      expect(renderer.manipulate).not.toHaveBeenCalled();
    },
  );

  it('rejects an oversized source before decoding it', async () => {
    const file = new File([new Uint8Array(25 * 1024 * 1024 + 1)], 'huge.jpg', {
      type: 'image/jpeg',
    });
    await expect(
      prepareImageUpload(
        { uri: 'blob:huge', width: 200, height: 200, file },
        options,
      ),
    ).rejects.toBeInstanceOf(ImagePreparationError);
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
      const result = await prepareImageUpload(
        {
          uri: 'blob:heic',
          width: 4000,
          height: 3000,
          file: input,
        },
        options,
      );
      expect(renderer.resize).toHaveBeenCalledWith({
        width: 1600,
        height: 1200,
      });
      expect(renderer.renderRelease).toHaveBeenCalled();
      expect(renderer.contextRelease).toHaveBeenCalled();
      expect(result.blob.type).toBe('image/jpeg');
      expect(result.uri).toBe('blob:converted');
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('automatically falls back to a small portrait when larger attempts exceed the byte budget', async () => {
    const file = new File(['source'], 'portrait.png', { type: 'image/png' });
    const oversized = new Blob([new Uint8Array(options.maxBytes + 1)], {
      type: 'image/png',
    });
    const compact = new Blob(['compact'], { type: 'image/png' });
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        blob: async () => oversized,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        blob: async () => oversized,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        blob: async () => oversized,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        blob: async () => compact,
      } as Response);
    renderer.save.mockResolvedValue({ uri: 'blob:prepared' });
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
        { uri: 'blob:source', width: 4000, height: 3000, file },
        options,
      );
      expect(result.blob.size).toBe(compact.size);
      expect(renderer.resize).toHaveBeenLastCalledWith({
        width: 640,
        height: 480,
      });
      expect(renderer.contextRelease).toHaveBeenCalledTimes(4);
    } finally {
      fetchSpy.mockRestore();
    }
  });
  it('honors a requested output format even for small inputs', async () => {
    const file = new File(['jpeg'], 'photo.jpg', { type: 'image/jpeg' });
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
      const prepared = await prepareImageUpload(
        { uri: 'blob:jpeg', width: 300, height: 200, file },
        { ...options, format: 'png' },
      );
      expect(renderer.save).toHaveBeenCalledWith({
        format: 'png',
        compress: options.quality,
      });
      expect(prepared.blob.type).toBe('image/png');
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

  it('rejects invalid dimensions instead of bypassing the pixel limit', async () => {
    const file = new File(['small'], 'photo.png', { type: 'image/png' });
    await expect(
      prepareImageUpload(
        { uri: 'blob:invalid', width: 0, height: 600, file },
        options,
      ),
    ).rejects.toMatchObject({ code: 'INVALID_DIMENSIONS' });
    expect(renderer.manipulate).not.toHaveBeenCalled();
  });

  it('rejects an oversized picker asset without fetching the entire source', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    try {
      await expect(
        prepareImageUpload(
          {
            uri: 'blob:large',
            width: 500,
            height: 500,
            fileSize: options.maxSourceBytes + 1,
          },
          options,
        ),
      ).rejects.toMatchObject({ code: 'SOURCE_TOO_LARGE' });
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('keeps transparency when resizing an oversized PNG by default', async () => {
    const file = new File(['png-input'], 'transparent.png', {
      type: 'image/png',
    });
    const output = new Blob(['png-output'], { type: 'image/png' });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      blob: async () => output,
    } as Response);
    renderer.save.mockResolvedValue({ uri: 'blob:resized-png' });
    renderer.manipulate.mockReturnValue({
      resize: renderer.resize,
      renderAsync: async () => ({
        saveAsync: renderer.save,
        release: renderer.renderRelease,
      }),
      release: renderer.contextRelease,
    });
    try {
      const prepared = await prepareImageUpload(
        { uri: 'blob:large-png', width: 2500, height: 1600, file },
        options,
      );
      expect(renderer.save).toHaveBeenCalledWith({
        format: 'png',
        compress: options.quality,
      });
      expect(prepared.blob.type).toBe('image/png');
    } finally {
      fetchSpy.mockRestore();
    }
  });

  function stageEncoder() {
    renderer.manipulate.mockReturnValue({
      resize: renderer.resize,
      renderAsync: async () => ({
        saveAsync: renderer.save,
        release: renderer.renderRelease,
      }),
      release: renderer.contextRelease,
    });
  }

  it('deletes every encoding that stays above the byte budget', async () => {
    const file = new File(['source'], 'portrait.png', { type: 'image/png' });
    const oversized = new Blob([new Uint8Array(options.maxBytes + 1)]);
    const uris = ['blob:try-0', 'blob:try-1', 'blob:try-2', 'blob:try-3'];
    let saved = 0;
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      blob: async () => oversized,
    } as Response);
    renderer.save.mockImplementation(async () => ({ uri: uris[saved++] }));
    stageEncoder();
    try {
      await expect(
        prepareImageUpload(
          { uri: 'blob:source', width: 4000, height: 3000, file },
          options,
        ),
      ).rejects.toMatchObject({ code: 'OUTPUT_TOO_LARGE' });
      expect(generated.deleteGeneratedImage.mock.calls.map((call) => call[0])).toEqual(
        uris,
      );
      expect(file.size).toBe('source'.length);
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('deletes a generated file when the encoded result cannot be read', async () => {
    const file = new File(['source'], 'portrait.png', { type: 'image/png' });
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('unreadable'));
    renderer.save.mockResolvedValue({ uri: 'blob:unreadable' });
    stageEncoder();
    try {
      await expect(
        prepareImageUpload(
          { uri: 'blob:source', width: 4000, height: 3000, file },
          options,
        ),
      ).rejects.toMatchObject({ code: 'READ_FAILED' });
      expect(generated.deleteGeneratedImage).toHaveBeenCalledExactlyOnceWith(
        'blob:unreadable',
      );
      expect(file.size).toBe('source'.length);
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('keeps the source and the accepted encoding after an oversized attempt', async () => {
    const file = new File(['source'], 'portrait.png', { type: 'image/png' });
    const oversized = new Blob([new Uint8Array(options.maxBytes + 1)]);
    const compact = new Blob(['compact']);
    let reads = 0;
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () =>
        ({
          ok: true,
          blob: async () => (reads++ === 0 ? oversized : compact),
        }) as Response,
    );
    renderer.save
      .mockResolvedValueOnce({ uri: 'blob:rejected' })
      .mockResolvedValueOnce({ uri: 'blob:accepted' });
    stageEncoder();
    try {
      const result = await prepareImageUpload(
        { uri: 'blob:source', width: 4000, height: 3000, file },
        options,
      );
      expect(result.uri).toBe('blob:accepted');
      expect(result.blob.size).toBe(compact.size);
      expect(generated.deleteGeneratedImage.mock.calls.map((call) => call[0])).toEqual([
        'blob:rejected',
      ]);
      expect(file.size).toBe('source'.length);
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
