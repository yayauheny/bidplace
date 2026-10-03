import { act } from 'react';

export async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

export function setInput(container: ParentNode, label: string, value: string) {
  const input = container.querySelector(`[aria-label="${label}"]`);
  if (!(input instanceof HTMLInputElement)) throw new Error(`Missing field ${label}`);
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  act(() => {
    setter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

export function inputValue(container: ParentNode, label: string) {
  const input = container.querySelector(`[aria-label="${label}"]`);
  if (!(input instanceof HTMLInputElement)) throw new Error(`Missing field ${label}`);
  return input.value;
}
