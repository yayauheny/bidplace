import { ApiClientError } from '@bidplace/api-client';
import { describe, expect, it } from 'vitest';

import { apiErrorMessage } from './api-error-messages';

describe('apiErrorMessage', () => {
  it.each([
    [
      'PRODUCT_IN_SALE',
      'Работа сейчас в продаже. Снимите лот, чтобы изменить или скрыть её',
    ],
    [
      'PRODUCT_STATE_CONFLICT',
      'Работа изменилась. Обновите страницу и попробуйте снова',
    ],
    ['PRODUCT_ALREADY_SOLD', 'Эта работа уже продана.'],
    ['BID_TOO_LOW', 'Ставка ниже минимальной.'],
    ['BUYER_BLOCKED', 'Автор ограничил для вас ставки и покупки.'],
    ['LISTING_NOT_OPEN', 'Лот сейчас не принимает ставки.'],
    ['LISTING_NOT_FOUND', 'Лот не найден.'],
    ['LISTING_CHANGED', 'Лот изменился. Обновите страницу и попробуйте снова.'],
    ['SELF_BID_FORBIDDEN', 'Нельзя ставить на свою работу.'],
    ['ADMIN_BID_FORBIDDEN', 'Администратор не участвует в торгах.'],
    ['BID_ALREADY_LEADING', 'Ваша ставка уже лидирует.'],
    ['BID_AMOUNT_INVALID', 'Проверьте сумму ставки.'],
    ['BUYER_ORDER_LIMIT', 'Слишком много незавершённых заказов.'],
    [
      'BUYER_CONTACTS_REQUIRED',
      'Укажите контакты, чтобы автор мог с вами связаться.',
    ],
    ['IDEMPOTENCY_KEY_REUSED', 'Этот запрос уже отправлен с другими данными.'],
    ['ORDER_TRANSITION_NOT_ALLOWED', 'Это действие сейчас недоступно.'],
    ['NO_NEXT_BIDDER', 'Следующего участника нет.'],
    ['DEAL_RULES_NOT_ACCEPTED', 'Примите правила сделки.'],
    ['conflict', null],
  ] as const)(
    'maps %s to its approved work message or leaves the fallback',
    (code, message) => {
      expect(
        apiErrorMessage(
          new ApiClientError('Internal detail', {
            kind: 'conflict',
            status: 409,
            code,
          }),
        ),
      ).toBe(message);
    },
  );

  it.each([new Error('network'), null, { code: 'PRODUCT_IN_SALE' }])(
    'leaves non-API errors to the consumer fallback',
    (error) => {
      expect(apiErrorMessage(error)).toBeNull();
    },
  );
});
