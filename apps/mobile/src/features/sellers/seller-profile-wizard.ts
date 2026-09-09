export const authorApplicationStep = {
  identity: 1,
  about: 2,
  contacts: 3,
  handoff: 4,
} as const;

export const authorApplicationStepCount = 4;

export type AuthorApplicationStep =
  (typeof authorApplicationStep)[keyof typeof authorApplicationStep];

export const authorApplicationStepTitles = {
  [authorApplicationStep.identity]: 'Основная информация',
  [authorApplicationStep.about]: 'Раскройте себя как автора',
  [authorApplicationStep.contacts]: 'Контакты',
  [authorApplicationStep.handoff]: 'Закрытый контакт',
} as const;

export const authorApplicationStepDescriptions = {
  [authorApplicationStep.identity]:
    'Тут все поля обязательны для заполнения',
  [authorApplicationStep.about]:
    'Напишите о себе и выберите основные направления',
  [authorApplicationStep.contacts]:
    'Эти ссылки будут видны на публичной странице автора',
  [authorApplicationStep.handoff]:
    'Контакт не публикуется. Он нужен только для передачи предмета.',
} as const;
