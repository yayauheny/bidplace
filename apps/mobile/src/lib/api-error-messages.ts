import { getApiErrorCode } from '@bidplace/api-client';

export function apiErrorCodeMessage(code: string | null): string | null {
  switch (code) {
    case 'PRODUCT_IN_SALE':
      return 'Работа сейчас в продаже. Снимите лот, чтобы изменить или скрыть её';
    case 'PRODUCT_STATE_CONFLICT':
      return 'Работа изменилась. Обновите страницу и попробуйте снова';
    case 'PRODUCT_ALREADY_SOLD':
      return 'Эта работа уже продана.';
    case 'BID_TOO_LOW':
      return 'Ставка ниже минимальной.';
    case 'BUYER_BLOCKED':
      return 'Ставки и покупки для вашего аккаунта ограничены.';
    case 'LISTING_NOT_OPEN':
      return 'Лот сейчас не принимает ставки.';
    case 'LISTING_NOT_FOUND':
      return 'Лот не найден.';
    case 'LISTING_CHANGED':
      return 'Лот изменился. Обновите страницу и попробуйте снова.';
    case 'SELF_BID_FORBIDDEN':
      return 'Нельзя ставить на свою работу.';
    case 'ADMIN_BID_FORBIDDEN':
      return 'Администратор не участвует в торгах.';
    case 'BID_ALREADY_LEADING':
      return 'Ваша ставка уже лидирует.';
    case 'BID_AMOUNT_INVALID':
      return 'Проверьте сумму ставки.';
    case 'BUYER_ORDER_LIMIT':
      return 'Слишком много незавершённых заказов.';
    case 'BUYER_CONTACTS_REQUIRED':
      return 'Укажите контакты, чтобы автор мог с вами связаться.';
    case 'IDEMPOTENCY_KEY_REUSED':
      return 'Этот запрос уже отправлен с другими данными.';
    case 'ORDER_TRANSITION_NOT_ALLOWED':
      return 'Это действие сейчас недоступно.';
    case 'NO_NEXT_BIDDER':
      return 'Следующего участника нет.';
    case 'DEAL_RULES_NOT_ACCEPTED':
      return 'Примите правила сделки.';
    default:
      return null;
  }
}

export function apiErrorMessage(error: unknown): string | null {
  return apiErrorCodeMessage(getApiErrorCode(error));
}
