import { normalizeCatalogName } from '@bidplace/contracts';

export { normalizeCatalogName };

export const OTHER_CATEGORY_SLUG = 'other';

export const STARTER_CATEGORIES = [
  { slug: 'painting', name: 'Живопись', description: null },
  {
    slug: 'drawing',
    name: 'Графика и рисунок',
    description:
      'Уникальный рисунок или графика на листе. Авторская печатная графика относится к отдельной категории.',
  },
  {
    slug: 'printmaking',
    name: 'Печатная графика',
    description:
      'Авторский печатный оттиск: линогравюра, офорт, литография, шелкография и сходные техники. Не обычный рисунок.',
  },
  { slug: 'photography', name: 'Фотография', description: null },
  { slug: 'sculpture', name: 'Скульптура', description: null },
  { slug: 'installation', name: 'Арт-объекты и инсталляции', description: null },
  { slug: 'collage', name: 'Коллаж и смешанная техника', description: null },
  {
    slug: 'ceramics',
    name: 'Керамика',
    description:
      'Художественная керамика. Функциональная посуда и сервировка выбираются отдельно.',
  },
  {
    slug: 'textile',
    name: 'Текстильное искусство',
    description:
      'Текстиль как художественная работа. Одежда, сумки и носимые аксессуары выбираются отдельно.',
  },
  {
    slug: 'jewelry',
    name: 'Украшения и бижутерия',
    description:
      'Авторские украшения. Категория сама по себе не допускает драгоценности и другие предметы, которым нужна отдельная экспертиза.',
  },
  {
    slug: 'clothing',
    name: 'Одежда',
    description: 'Авторская одежда, а не текстильное панно или аксессуар.',
  },
  {
    slug: 'bags',
    name: 'Сумки и аксессуары',
    description: 'Сумки и носимые аксессуары, а не текстильное искусство и не одежда.',
  },
  { slug: 'toys', name: 'Игрушки и куклы', description: null },
  { slug: 'furniture', name: 'Мебель', description: null },
  { slug: 'interior', name: 'Предметы интерьера', description: null },
  {
    slug: 'tableware',
    name: 'Посуда и сервировка',
    description: 'Функциональная посуда. Художественная керамика выбирается отдельно.',
  },
  {
    slug: 'decorative',
    name: 'Декоративно-прикладное искусство',
    description: 'Используется, когда работа прикладная и более точной категории нет.',
  },
  {
    slug: OTHER_CATEGORY_SLUG,
    name: 'Другое',
    description:
      'Существующая категория, когда нужного названия нет. Автор указывает предложенное название отдельно.',
  },
] as const;

export const STARTER_MATERIALS = [
  ['canvas', 'Холст'],
  ['paper', 'Бумага'],
  ['cardboard', 'Картон'],
  ['oil', 'Масло'],
  ['acrylic', 'Акрил'],
  ['watercolor', 'Акварель'],
  ['gouache', 'Гуашь'],
  ['tempera', 'Темпера'],
  ['pastel', 'Пастель'],
  ['ink', 'Тушь'],
  ['graphite', 'Графит'],
  ['charcoal', 'Уголь'],
  ['clay', 'Глина'],
  ['chamotte', 'Шамот'],
  ['porcelain', 'Фарфор'],
  ['glaze', 'Глазурь'],
  ['plaster', 'Гипс'],
  ['stone', 'Камень'],
  ['bronze', 'Бронза'],
  ['brass', 'Латунь'],
  ['copper', 'Медь'],
  ['steel', 'Сталь'],
  ['wood', 'Дерево'],
  ['glass', 'Стекло'],
  ['cotton', 'Хлопок'],
  ['linen', 'Лён'],
  ['wool', 'Шерсть'],
  ['silk', 'Шёлк'],
  ['felt', 'Фетр'],
  ['leather', 'Кожа'],
  ['beads', 'Бисер'],
  ['polymer-clay', 'Полимерная глина'],
  ['epoxy', 'Эпоксидная смола'],
] as const;

export const STARTER_TECHNIQUES = [
  ['drawing', 'Рисунок'],
  ['oil-painting', 'Масляная живопись'],
  ['acrylic-painting', 'Акриловая живопись'],
  ['watercolor-painting', 'Акварельная живопись'],
  ['collage', 'Коллаж'],
  ['mixed-media', 'Смешанная техника'],
  ['linocut', 'Линогравюра'],
  ['etching', 'Офорт'],
  ['lithography', 'Литография'],
  ['screen-printing', 'Шелкография'],
  ['digital-print', 'Цифровая печать'],
  ['photo-print', 'Фотопечать'],
  ['modeling', 'Лепка'],
  ['potters-wheel', 'Гончарный круг'],
  ['casting', 'Литьё'],
  ['carving', 'Резьба'],
  ['painting-on', 'Роспись'],
  ['glazing', 'Глазурование'],
  ['raku', 'Раку'],
  ['stained-glass', 'Витраж'],
  ['fusing', 'Фьюзинг'],
  ['sewing', 'Шитьё'],
  ['knitting', 'Вязание'],
  ['weaving', 'Ткачество'],
  ['embroidery', 'Вышивка'],
  ['felting', 'Валяние'],
  ['beadwork', 'Бисероплетение'],
] as const;

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i',
  й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
  у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '',
  э: 'e', ю: 'yu', я: 'ya',
};

export function catalogSlug(name: string): string {
  const normalized = normalizeCatalogName(name);
  const latin = [...normalized].map((char) => TRANSLIT[char] ?? char).join('');
  const slug = latin
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
  return slug || 'term';
}
