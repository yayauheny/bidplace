const phoneViewport = { width: 390, height: 874 } as const;
const shortPhoneViewport = { width: 390, height: 400 } as const;

export const AUTH_PHONE_VIEWPORT = phoneViewport;
export const AUTH_SHORT_PHONE_VIEWPORT = shortPhoneViewport;

export const AUTH_BROWSER_VIEWPORTS = [
  phoneViewport,
  { width: 375, height: 667 },
  { width: 440, height: 956 },
  { width: 1280, height: 720 },
  shortPhoneViewport,
] as const;

export function viewportLabel(viewport: { width: number; height: number }): string {
  return `${viewport.width}x${viewport.height}`;
}
