export function verificationStatusCopy(input: {
  email: string | null | undefined;
  sendAccepted: boolean;
}) {
  const purpose =
    'Подтверждение нужно, чтобы создавать и редактировать профиль автора.';
  if (!input.sendAccepted) {
    return `Код ещё не отправлен. ${purpose}`;
  }
  const address = input.email?.trim() ? input.email : 'ваш email';
  return `Отправка кода на ${address} принята. Доставку письма это не подтверждает. ${purpose}`;
}
