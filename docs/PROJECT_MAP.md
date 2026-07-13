# Карта проекта bidplace

## Зачем читать этот документ

Этот файл нужен как практическая карта репозитория:

- где лежит backend;
- где лежит frontend;
- какие папки являются рабочими, а какие служебными;
- какие файлы отвечают за экран, стили, тему, формы и API.

Если нужно быстро войти в проект, лучше читать в таком порядке:

1. `docs/ARCHITECTURE.md` — общая архитектурная рамка.
2. Этот документ — что и где реально лежит в коде.
3. Уже потом открывать конкретные модули.

## Как устроена монорепа

### Корень репозитория

- `apps/` — приложения.
- `packages/` — общие пакеты, которые переиспользуют приложения.
- `docs/` — документация по продукту и архитектуре.
- `node_modules/`, `.turbo/`, `dist/` — служебные и сгенерированные директории.

## Папка `apps`

### `apps/api`

NestJS backend. Это главный источник истины для пользователей, продавцов, лотов, аукционов и ставок.

Что здесь важно:

- `src/main.ts` — точка входа backend, включает `/api`, CORS, static uploads.
- `src/app.module.ts` — главный модуль, показывает все подключённые доменные модули.
- `src/auth/` — логин, регистрация, текущая сессия, guards, хеширование паролей.
- `src/auctions/` — чтение и управление аукционами, закрытие аукционов.
- `src/bids/` — ставки и история ставок.
- `src/lots/` — создание лотов и работа с изображениями.
- `src/sellers/` — публичный и приватный профиль продавца.
- `src/admin/` — админские сценарии и модерация.
- `src/core/` — инфраструктура: база, env, healthcheck, storage, validation, realtime, logger.

Когда нужно понять backend-поток, обычно читают так:

1. `src/app.module.ts`
2. нужный доменный модуль, например `src/auctions/`
3. соответствующие DTO и contracts
4. Prisma-схему

### `apps/mobile`

Единый Expo Router frontend для web, iOS и Android.

Это основной frontend-контур. Здесь находятся:

- `src/app/` — маршруты и layout;
- `src/features/` — экраны, формы, hooks и flow-логика;
- `src/components/ui/` — базовые UI primitives;
- `src/components/auction/` — доменные auction-компоненты;
- `src/components/shared/` — общие композиции;
- `src/providers/` — auth, theme, api, query providers;
- `src/theme/` — токены, palette и layout values.

## Папка `packages`

### `packages/contracts`

Общие контракты между frontend и backend:

- Zod-схемы;
- DTO;
- enum-ы;
- типы запросов и ответов.

Если нужно понять форму данных API, это одна из первых папок для чтения.

### `packages/api-client`

Typed-клиент для вызова backend API из frontend.
Frontend не должен собирать URL и payload вручную по всему проекту — для этого есть этот пакет.

### `packages/design-tokens`

Единый источник визуальных токенов:

- цвета;
- spacing;
- radius;
- размеры;
- типографика;
- тени.

Если хочется поменять глобальную визуальную систему, смотреть нужно сюда в первую очередь.

### `packages/database`

Пакет с Prisma:

- `prisma/schema.prisma` — доменная модель базы;
- `prisma/migrations/` — миграции;
- `prisma/seed.js` — сиды.

Если надо понять, какие сущности реально существуют в системе, начинать стоит отсюда.

### `packages/config`

Общие конфигурационные утилиты.

### `packages/eslint-config`

Общие правила линтинга для монорепы.

### `packages/tsconfig`

Общие TypeScript-конфиги.

## Frontend подробно: `apps/mobile`

## С чего начать чтение frontend

Если открыть frontend с нуля, самый полезный маршрут чтения такой:

1. `apps/mobile/src/app/_layout.tsx`
2. `apps/mobile/src/providers/app-providers.tsx`
3. нужную страницу в `apps/mobile/src/app/...`
4. соответствующий экран или форму в `apps/mobile/src/features/...`
5. hooks этого feature
6. `packages/api-client` и `packages/contracts`, если нужно понять данные

Это позволяет быстро увидеть цепочку:

`route -> screen/form -> hooks -> api client -> backend`

## Как устроен mobile по слоям

### `apps/mobile/src/app/`

Expo Router routes и layout.
Здесь лежит маршрутизация и сборка экранов, но не основная бизнес-логика.

Главные файлы:

- `app/_layout.tsx` — корневой layout всего приложения;
- `app/(public)/...` — публичные страницы;
- `app/(auth)/...` — вход и регистрация;
- `app/(seller)/...` — seller-раздел;
- `app/(admin)/...` — admin-раздел.

Практическое правило:
если нужно изменить логику экрана, обычно сам файл в `app/` почти не трогают, а идут в `src/features/...`.

### `apps/mobile/src/features/`

Это главный слой бизнес-UI.
Здесь лежат экраны, формы и feature-specific hooks.

Ключевые разделы:

#### `src/features/auth/`

- `auth-form.tsx` — форма логина и регистрации.

Что делает:

- собирает поля;
- валидирует пользовательский ввод на уровне UI;
- вызывает auth-методы из provider/hook;
- показывает ошибки и загрузку.

#### `src/features/auctions/`

Основной доменный блок frontend.

Главные файлы:

- `auction-list-screen.tsx` — список аукционов на публичной витрине;
- `auction-detail-screen.tsx` — страница конкретного аукциона;
- `hooks.ts` — React Query hooks и cache keys для аукционов;
- `utils.ts` — маппинг статусов и helper-логика.

#### `src/features/seller/`

- `seller-dashboard-screen.tsx` — seller dashboard;
- `seller-profile-form.tsx` — создание и редактирование seller profile;
- `lot-create-form.tsx` — создание лота;
- `auction-create-form.tsx` — создание аукциона;
- `hooks.ts` — seller-related data hooks;
- `schemas.ts` — формы и валидация.

#### `src/features/admin/`

- `admin-dashboard-screen.tsx` — moderation dashboard;
- `hooks.ts` — получение данных и mutation hooks для admin-раздела.

### `apps/mobile/src/components/`

Это слой переиспользуемых компонентов.

Он делится на два уровня:

- `src/components/ui/` — базовые строительные блоки интерфейса;
- `src/components/auction/` — доменные auction-компоненты.

## `src/providers/`, `src/theme/`, `src/lib/`

- `src/providers/` — api, query, auth и theme providers;
- `src/theme/` — color palette, spacing, radius, semantic layout values;
- `src/lib/` — environment helpers, API client wrapper, formatters и media helpers.

## Порядок чтения, если нужно быстро менять экран

1. соответствующий route в `apps/mobile/src/app/...`
2. screen в `src/features/...`
3. hooks для данных и mutations
4. `src/components/ui/...` или `src/components/auction/...`
5. `packages/api-client`
6. `packages/contracts`

## Что не делать

- не дублировать API-клиент по экранам;
- не писать бизнес-логику в route-файлах;
- не добавлять новый frontend-контур без сильной причины.
