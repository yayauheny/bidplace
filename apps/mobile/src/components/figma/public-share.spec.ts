/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

  it('serializes native exports across button lifetimes', async () => {
    let release: () => void = () => {
      throw new Error('Missing native share');
    };
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    native.share.mockReturnValue(pending);
    const first = downloadQrPng('data:image/png;base64,cG5n', 'qr.png');
    await expect(
      downloadQrPng('data:image/png;base64,cG5n', 'qr.png'),
    ).rejects.toThrow('PNG export already in progress');
    release();
    await first;
    expect(native.file.write).toHaveBeenCalledOnce();
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

import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { useShareAction } from './use-share-action';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

function mountShareAction() {
  let action: ReturnType<typeof useShareAction> | undefined;
  let enabled = true;
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  function Probe() {
    action = useShareAction(enabled);
    return null;
  }
  act(() => root.render(createElement(Probe)));
  return {
    setEnabled(value: boolean) {
      enabled = value;
      act(() => root.render(createElement(Probe)));
    },
    current() {
      if (!action) throw new Error('Missing action hook');
      return action;
    },
    unmount() {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe('share action feedback lifetime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('confirms only after success and restores idle after 1800ms', async () => {
    const view = mountShareAction();
    let resolve: () => void = () => {
      throw new Error('Missing operation');
    };
    const operation = new Promise<void>((done) => {
      resolve = done;
    });
    act(() => {
      void view.current().run(() => operation);
    });
    expect(view.current().status).toBe('idle');
    await act(async () => {
      resolve();
      await operation;
    });
    expect(view.current().status).toBe('confirmed');
    act(() => vi.advanceTimersByTime(1799));
    expect(view.current().status).toBe('confirmed');
    act(() => vi.advanceTimersByTime(1));
    expect(view.current().status).toBe('idle');
    view.unmount();
  });
  it('shows error without confirmation and allows a successful retry', async () => {
    const view = mountShareAction();
    await act(async () => {
      await view.current().run(async () => {
        throw new Error('Clipboard denied');
      });
    });
    expect(view.current().status).toBe('error');
    await act(async () => {
      await view.current().run(async () => undefined);
    });
    expect(view.current().status).toBe('confirmed');
    view.unmount();
  });
  it('deduplicates concurrent presses and extends confirmation on a later press', async () => {
    const view = mountShareAction();
    let resolve: () => void = () => {
      throw new Error('Missing operation');
    };
    const pending = new Promise<void>((done) => {
      resolve = done;
    });
    const operation = vi.fn(() => pending);
    act(() => {
      void view.current().run(operation);
      void view.current().run(operation);
    });
    expect(operation).toHaveBeenCalledOnce();
    await act(async () => {
      resolve();
      await pending;
    });
    act(() => vi.advanceTimersByTime(1000));
    await act(async () => {
      await view.current().run(async () => undefined);
    });
    act(() => vi.advanceTimersByTime(1000));
    expect(view.current().status).toBe('confirmed');
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('ignores completion after close and creates clean state on reopen', async () => {
    const view = mountShareAction();
    let resolve: () => void = () => {
      throw new Error('Missing operation');
    };
    const pending = new Promise<void>((done) => {
      resolve = done;
    });
    act(() => {
      void view.current().run(() => pending);
    });
    view.unmount();
    await act(async () => {
      resolve();
      await pending;
    });
    expect(vi.getTimerCount()).toBe(0);
    const reopened = mountShareAction();
    expect(reopened.current().status).toBe('idle');
    reopened.unmount();
  });
  it('clears confirmation on close and rejects an older operation after a rapid reopen', async () => {
    const view = mountShareAction();
    await act(async () => {
      await view.current().run(async () => undefined);
    });
    view.setEnabled(false);
    expect(view.current().status).toBe('idle');
    expect(vi.getTimerCount()).toBe(0);
    view.setEnabled(true);
    let resolve: () => void = () => {
      throw new Error('Missing operation');
    };
    const pending = new Promise<void>((done) => {
      resolve = done;
    });
    act(() => {
      void view.current().run(() => pending);
    });
    view.setEnabled(false);
    view.setEnabled(true);
    await act(async () => {
      resolve();
      await pending;
    });
    expect(view.current().status).toBe('idle');
    expect(vi.getTimerCount()).toBe(0);
    view.unmount();
  });
});
