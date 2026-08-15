export const ACCOUNT_MENU_HOVER_CLOSE_DELAY_MS = 150;

export function shouldDismissAccountMenuOnHoverLeave(
  triggerHovered: boolean,
  dropdownHovered: boolean,
): boolean {
  return !triggerHovered && !dropdownHovered;
}
