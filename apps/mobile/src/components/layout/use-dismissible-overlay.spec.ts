/**
 * @vitest-environment jsdom
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

// Installed @types/react does not declare React 19's act environment flag.
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

type DismissReason = import('./use-dismissible-overlay').DismissReason;
type UseDismissibleOverlay =
  typeof import('./use-dismissible-overlay').useDismissibleOverlay;
type ContainsLike = import('./dismissible-overlay').ContainsLike;

let useDismissibleOverlay: UseDismissibleOverlay;

beforeAll(async () => {
  ({ useDismissibleOverlay } = await import('./use-dismissible-overlay'));
});

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

type ProbeProps = {
  open: boolean;
  closeOnFocusIn?: boolean;
  onClose: (reason: DismissReason) => void;
  getSurfaces: () => Array<ContainsLike | null | undefined>;
  restoreFocus?: () => void;
};

function mountProbe(initial: ProbeProps) {
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);

  function OverlayProbe(props: ProbeProps) {
    useDismissibleOverlay(props);
    return null;
  }

  const render = (props: ProbeProps) => {
    act(() => {
      root.render(createElement(OverlayProbe, props));
    });
  };

  render(initial);

  return {
    rerender: render,
    unmount() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

function installTargets() {
  const inside = document.createElement('button');
  const outside = document.createElement('button');
  document.body.append(inside, outside);
  const surface: ContainsLike = {
    contains: (node) => node === inside,
  };
  return {
    inside,
    outside,
    getSurfaces: () => [surface],
  };
}

function trackFocusIn() {
  const added: EventListener[] = [];
  const removed: EventListener[] = [];
  const originalAdd = Document.prototype.addEventListener;
  const originalRemove = Document.prototype.removeEventListener;
  vi.spyOn(document, 'addEventListener').mockImplementation(
    (type, listener, options) => {
      if (type === 'focusin' && typeof listener === 'function') {
        added.push(listener);
      }
      originalAdd.call(document, type, listener, options);
    },
  );
  vi.spyOn(document, 'removeEventListener').mockImplementation(
    (type, listener, options) => {
      if (type === 'focusin' && typeof listener === 'function') {
        removed.push(listener);
      }
      originalRemove.call(document, type, listener, options);
    },
  );
  return { added, removed };
}

function focus(node: HTMLElement) {
  act(() => {
    node.focus();
  });
}

function pointerDown(node: HTMLElement) {
  act(() => {
    node.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  });
}

function pressEscape() {
  act(() => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      }),
    );
  });
}

describe('useDismissibleOverlay focusin lifecycle', () => {
  it('does not close or listen for focusin when the option is omitted', () => {
    const listeners = trackFocusIn();
    const targets = installTargets();
    const onClose = vi.fn();
    const view = mountProbe({
      open: true,
      onClose,
      getSurfaces: targets.getSurfaces,
    });

    focus(targets.outside);
    focus(targets.inside);

    expect(listeners.added).toHaveLength(0);
    expect(onClose).not.toHaveBeenCalled();
    view.unmount();
  });

  it('does not close or listen for focusin when the option is false', () => {
    const listeners = trackFocusIn();
    const targets = installTargets();
    const onClose = vi.fn();
    const view = mountProbe({
      open: true,
      closeOnFocusIn: false,
      onClose,
      getSurfaces: targets.getSurfaces,
    });

    focus(targets.outside);

    expect(listeners.added).toHaveLength(0);
    expect(onClose).not.toHaveBeenCalled();
    view.unmount();
  });

  it('closes once for outside focus and ignores focus inside the surface', () => {
    const listeners = trackFocusIn();
    const targets = installTargets();
    const onClose = vi.fn();
    const view = mountProbe({
      open: true,
      closeOnFocusIn: true,
      onClose,
      getSurfaces: targets.getSurfaces,
    });

    focus(targets.inside);
    expect(onClose).not.toHaveBeenCalled();

    focus(targets.outside);

    expect(listeners.added).toHaveLength(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith('focusin');
    view.unmount();
    expect(listeners.removed).toEqual(listeners.added);
  });

  it('removes the same focusin listener on cleanup and after closing', () => {
    const listeners = trackFocusIn();
    const targets = installTargets();
    const onClose = vi.fn();
    const view = mountProbe({
      open: true,
      closeOnFocusIn: true,
      onClose,
      getSurfaces: targets.getSurfaces,
    });
    const registered = listeners.added[0];

    view.unmount();
    focus(targets.outside);

    expect(listeners.removed).toEqual([registered]);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('registers focusin again after the overlay is reopened', () => {
    const listeners = trackFocusIn();
    const targets = installTargets();
    const onClose = vi.fn();
    const props = {
      open: true,
      closeOnFocusIn: true,
      onClose,
      getSurfaces: targets.getSurfaces,
    };
    const view = mountProbe({ ...props, open: false });

    expect(listeners.added).toHaveLength(0);

    view.rerender(props);
    focus(targets.outside);

    expect(listeners.added).toHaveLength(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith('focusin');

    view.rerender({ ...props, open: false });
    focus(targets.outside);

    expect(listeners.removed).toEqual(listeners.added);
    expect(onClose).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('keeps escape and outside pointer dismissal when focusin dismissal is off', () => {
    const targets = installTargets();
    const onClose = vi.fn();
    const restoreFocus = vi.fn();
    const view = mountProbe({
      open: true,
      closeOnFocusIn: false,
      onClose,
      restoreFocus,
      getSurfaces: targets.getSurfaces,
    });

    pressEscape();
    pointerDown(targets.inside);
    pointerDown(targets.outside);

    expect(onClose.mock.calls).toEqual([['escape'], ['pointerdown']]);
    expect(restoreFocus).toHaveBeenCalledTimes(1);
    view.unmount();
  });
});
