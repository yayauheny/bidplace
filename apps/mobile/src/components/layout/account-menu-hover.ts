export const ACCOUNT_MENU_HOVER_CLOSE_DELAY_MS = 150;

export function shouldDismissAccountMenuOnHoverLeave(
  triggerHovered: boolean,
  dropdownHovered: boolean,
): boolean {
  return !triggerHovered && !dropdownHovered;
}

export function subscribeAccountMenuSurfaceHover(
  element: EventTarget,
  handlers: { onEnter: () => void; onLeave: () => void },
): () => void {
  // pointerenter/leave do not fire when the pointer moves onto nested controls.
  // Pressable hover is contained, so hovering Кабинет/Модерация/Выйти looks like
  // a surface leave and would close the menu.
  const onEnter = () => handlers.onEnter();
  const onLeave = () => handlers.onLeave();
  element.addEventListener('pointerenter', onEnter);
  element.addEventListener('pointerleave', onLeave);
  return () => {
    element.removeEventListener('pointerenter', onEnter);
    element.removeEventListener('pointerleave', onLeave);
  };
}
