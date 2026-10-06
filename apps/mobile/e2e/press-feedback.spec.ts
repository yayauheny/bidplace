import { expect, test, type Locator, type Page } from '@playwright/test';

const mintRing = '235, 151';
const keyboardFocus = 'rgb(36, 87, 230)';

test.describe('ordinary press does not flash mint', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('keyboard focus stays blue and space does not flash mint', async ({
    page,
  }) => {
    await page.goto('/login');
    const register = page.getByRole('button', { name: 'Регистрация' });
    await focusByKeyboard(page, register);
    await expect.poll(async () => outlineOf(register)).toEqual({
      style: 'solid',
      width: '2px',
      color: keyboardFocus,
    });

    await watchMint(page);
    await page.keyboard.down(' ');
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }),
    );
    expect(await mintHits(page)).toEqual([]);
    await page.keyboard.up(' ');
    await expect(page).toHaveURL(/\/register$/);
    await settleFrames(page);
    expect(await mintHits(page)).toEqual([]);
  });

  for (const pointer of ['mouse', 'touch'] as const) {
    test(`${pointer} hold, release, and navigation stay free of a mint ring`, async ({
      page,
    }) => {
      await page.goto('/login');
      const dock = page.getByTestId('figma-floating-dock');
      const home = dock.getByRole('link', { name: 'Главная' });
      const releaseHome = await hold(page, home, pointer);
      try {
        await expect.poll(async () => opacityOf(home)).toBe('0.82');
        await expect.poll(async () => shadowOf(home)).toBe('none');
        expect(await mintHits(page)).toEqual([]);
      } finally {
        await releaseHome();
      }
      await expect(page).toHaveURL(/\/$/);
      await settleFrames(page);
      expect(await mintHits(page)).toEqual([]);

      await page.goto('/login');
      const login = page.getByRole('button', { name: 'Войти' });
      await login.scrollIntoViewIfNeeded();
      const releaseLogin = await hold(page, login, pointer);
      try {
        await expect.poll(async () => opacityOf(login)).toBe('0.9');
        expect(await mintHits(page)).toEqual([]);
      } finally {
        await releaseLogin();
      }
      await expect(page).toHaveURL(/\/login$/);
      expect(await mintHits(page)).toEqual([]);

      await dock.getByRole('button', { name: 'Поиск' }).click();
      const authors = page.getByRole('tab', { name: 'Авторы' });
      await expect(authors).toBeVisible();
      const releaseAuthors = await hold(page, authors, pointer);
      try {
        await expect.poll(async () => opacityOf(authors)).toBe('0.92');
        expect(await mintHits(page)).toEqual([]);
      } finally {
        await releaseAuthors();
      }
      await expect(authors).toHaveAttribute('aria-selected', 'true');
      await expect.poll(async () => opacityOf(authors)).toBe('1');
      expect(await mintHits(page)).toEqual([]);
      await page.getByRole('button', { name: 'Закрыть поиск' }).click();

      const register = page.getByRole('button', { name: 'Регистрация' });
      await register.scrollIntoViewIfNeeded();
      const releaseRegister = await hold(page, register, pointer);
      try {
        await expect.poll(async () => opacityOf(register)).toBe('0.9');
        expect(await mintHits(page)).toEqual([]);
      } finally {
        await releaseRegister();
      }
      await expect(page).toHaveURL(/\/register$/);
      await settleFrames(page);
      expect(await mintHits(page)).toEqual([]);
    });
  }
});

async function focusByKeyboard(page: Page, target: Locator) {
  await page.getByRole('textbox', { name: 'Email' }).click();
  for (let step = 0; step < 8; step += 1) {
    if (await target.evaluate((element) => element === document.activeElement)) {
      return;
    }
    await page.keyboard.press('Tab');
  }
  throw new Error('keyboard focus did not reach the target');
}

async function outlineOf(locator: Locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      style: style.outlineStyle,
      width: style.outlineWidth,
      color: style.outlineColor,
    };
  });
}

async function opacityOf(locator: Locator) {
  return locator.evaluate((element) => getComputedStyle(element).opacity);
}

async function shadowOf(locator: Locator) {
  return locator.evaluate((element) => getComputedStyle(element).boxShadow);
}

async function watchMint(page: Page) {
  await page.evaluate((needle) => {
    const host = window as Window & {
      __mint?: string[];
      __mintStop?: () => void;
    };
    host.__mint = [];
    let running = true;
    const scan = () => {
      if (!running) return;
      for (const node of document.querySelectorAll('*')) {
        const shadow = getComputedStyle(node).boxShadow;
        if (!shadow.includes(needle)) continue;
        const label =
          node.getAttribute('aria-label') || node.textContent || node.tagName;
        host.__mint?.push(label.trim().slice(0, 40));
      }
      requestAnimationFrame(scan);
    };
    requestAnimationFrame(scan);
    host.__mintStop = () => {
      running = false;
    };
  }, mintRing);
}

async function mintHits(page: Page) {
  return page.evaluate(
    () =>
      (window as Window & { __mint?: string[] }).__mint ?? [],
  );
}

async function settleFrames(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        let left = 8;
        const step = () => {
          left -= 1;
          if (left <= 0) resolve();
          else requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }),
  );
}

async function hold(page: Page, locator: Locator, pointer: 'mouse' | 'touch') {
  await watchMint(page);
  const box = await locator.boundingBox();
  expect(box).toBeTruthy();
  const x = box!.x + box!.width / 2;
  const y = box!.y + box!.height / 2;
  if (pointer === 'mouse') {
    await page.mouse.move(x, y);
    await page.mouse.down();
    return async () => {
      await page.mouse.up();
    };
  }
  if (test.info().project.name === 'chromium') {
    const client = await page.context().newCDPSession(page);
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y, radiusX: 1, radiusY: 1, force: 0.5, id: 1 }],
    });
    return async () => {
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });
    };
  }
  await locator.evaluate(dispatchTouch, 'touchstart');
  return async () => {
    await locator.evaluate(dispatchTouch, 'touchend');
  };
}

function dispatchTouch(element: Element, type: 'touchstart' | 'touchend') {
  const rect = element.getBoundingClientRect();
  const clientX = rect.left + rect.width / 2;
  const clientY = rect.top + rect.height / 2;
  const view = element.ownerDocument.defaultView;
  if (!view) throw new Error('missing view');
  const owner = element.ownerDocument as Document & {
    createTouch?: (
      view: Window,
      target: Element,
      identifier: number,
      pageX: number,
      pageY: number,
      screenX: number,
      screenY: number,
    ) => Touch;
    createTouchList?: (...touches: Touch[]) => TouchList;
  };
  const touch = owner.createTouch?.(
    view,
    element,
    1,
    clientX,
    clientY,
    clientX,
    clientY,
  );
  const list = touch ? owner.createTouchList?.(touch) : owner.createTouchList?.();
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'touches', {
    value: type === 'touchstart' ? list : owner.createTouchList?.(),
  });
  Object.defineProperty(event, 'targetTouches', {
    value: type === 'touchstart' ? list : owner.createTouchList?.(),
  });
  Object.defineProperty(event, 'changedTouches', { value: list });
  element.dispatchEvent(event);
  if (type === 'touchend') {
    element.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true }),
    );
  }
}
