import type { StorefrontProduct } from './model';

function createDataUri(title: string, fill: string, accent: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
      <rect width="800" height="1000" fill="#F0F0EE"/>
      <rect x="170" y="140" width="460" height="600" rx="90" fill="${fill}"/>
      <rect x="250" y="260" width="300" height="250" rx="90" fill="${accent}" opacity="0.32"/>
      <path d="M260 770C340 690 460 690 540 770" fill="none" stroke="${accent}" stroke-width="24" stroke-linecap="round"/>
      <text x="400" y="905" font-family="Georgia" font-size="34" text-anchor="middle" fill="#5F5A53">${title}</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const baseProducts = [
  { title: 'Obsidian Vessel', slug: 'OBS-01', price: 1850, colors: ['#111111', '#BCB5AA', '#75685F'] },
  { title: 'Porcelain Archive', slug: 'POR-02', price: 2200, colors: ['#D9D1C6', '#8A8076', '#171717'] },
  { title: 'Sand Studio Bowl', slug: 'SAN-03', price: 980, colors: ['#B89471', '#F3E8D5', '#4C3F34'] },
  { title: 'Graphite Frame', slug: 'GRA-04', price: 1450, colors: ['#1B1B1D', '#8A8C92', '#DADBDD'] },
  { title: 'Soft Clay Lamp', slug: 'CLA-05', price: 2680, colors: ['#C79C82', '#F4E8DE', '#675243'] },
  { title: 'Atelier Textile', slug: 'TEX-06', price: 1180, colors: ['#E2D8CD', '#B4A18B', '#22201C'] },
  { title: 'Still Form Mirror', slug: 'MIR-07', price: 1990, colors: ['#D2D6D8', '#898A88', '#353535'] },
  { title: 'Ritual Shelf', slug: 'RIT-08', price: 3140, colors: ['#8B6D55', '#F0E7DA', '#181614'] },
] as const;

export const demoProducts: StorefrontProduct[] = baseProducts.map((item, index) => ({
  id: item.slug,
  slug: item.slug,
  title: item.title,
  description: `${item.title} prepared as a premium demo lot for the storefront grid.`,
  price: item.price,
  currentPrice: item.price,
  reservePrice: item.price + 140,
  bidStep: 25,
  currency: 'USD',
  imageUrl: createDataUri(item.title, item.colors[0], item.colors[1]),
  secondaryImageUrl: createDataUri(item.title, item.colors[1], item.colors[2]),
  colors: item.colors,
  extraVariants: (index % 4) + 1,
  statusLabel: index === 6 ? 'Нет в наличии' : null,
  sellerName: 'Bidplace Studio',
  sellerCountry: 'BY',
  auctionStatus: index === 6 ? 'sold' : index === 5 ? 'scheduled' : 'active',
  bidCount: 8 + index,
  startsAt: new Date(Date.now() + index * 3_600_000).toISOString(),
  endsAt: new Date(Date.now() + (index + 8) * 3_600_000).toISOString(),
}));
