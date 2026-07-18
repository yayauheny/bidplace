import type { AuctionListItem, PublicAuctionDetailResponse } from '@bidplace/contracts';

import { resolveMediaUrl } from '../../lib/media';
import { getAuctionStatusLabel } from '../auctions/utils';
import type { CatalogFilterValue } from '../../components/storefront/FilterSheet';
import type { CatalogSortValue } from '../../components/storefront/SortMenu';
import type { ProductCardModel } from '../../components/storefront/ProductCard';

export type StorefrontProduct = ProductCardModel & {
  slug: string;
  description: string;
  sellerName: string;
  sellerCountry: string;
  auctionStatus: AuctionListItem['auction']['status'];
  bidCount: number;
  currentPrice: number;
  reservePrice: number;
  bidStep: number;
  startsAt: string;
  endsAt: string;
};

const swatchSets = [
  ['#111111', '#D5C8B0', '#7B6E63'],
  ['#8D8C89', '#D8D3C8', '#2B2B2B'],
  ['#A18873', '#EEE6DA', '#4E443B'],
  ['#C0BBB1', '#8F6B4E', '#151515'],
] as const;

function buildPlaceholderImage(seed: string, tint: string, secondaryTint: string) {
  const safeSeed = encodeURIComponent(seed);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
      <rect width="800" height="1000" fill="#F0F0EE"/>
      <rect x="130" y="120" width="540" height="620" rx="84" fill="${tint}"/>
      <circle cx="400" cy="310" r="120" fill="${secondaryTint}" opacity="0.32"/>
      <path d="M250 780C330 690 470 690 550 780" fill="none" stroke="${secondaryTint}" stroke-width="30" stroke-linecap="round"/>
      <text x="400" y="920" font-family="Georgia" font-size="34" text-anchor="middle" fill="#4A4640">${safeSeed}</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function buildProductColors(seed: string) {
  const code = Array.from(seed).reduce((sum, letter) => sum + letter.charCodeAt(0), 0);
  const set = swatchSets[code % swatchSets.length];

  return {
    colors: set.slice(0, 3),
    extraVariants: (code % 5) + 1,
  };
}

function buildFallbackImages(title: string, seed: string) {
  const swatches = buildProductColors(seed).colors;

  return {
    primary: buildPlaceholderImage(title, swatches[0], swatches[1]),
    secondary: buildPlaceholderImage(title, swatches[1], swatches[2]),
  };
}

export function mapAuctionListItemToStorefrontProduct(
  item: AuctionListItem,
  baseUrl: string,
): StorefrontProduct {
  const swatches = buildProductColors(item.auction.slug);
  const fallbackImages = buildFallbackImages(item.lot.title, item.auction.slug);
  const primaryImage = item.lot.images[0]
    ? resolveMediaUrl(item.lot.images[0], baseUrl)
    : fallbackImages.primary;
  const secondaryImage = item.lot.images[1]
    ? resolveMediaUrl(item.lot.images[1], baseUrl)
    : fallbackImages.secondary;

  return {
    id: item.auction.slug,
    slug: item.auction.slug,
    title: item.lot.title,
    description: item.lot.description,
    price: item.auction.currentPrice,
    currentPrice: item.auction.currentPrice,
    reservePrice: item.auction.reservePrice,
    bidStep: item.auction.bidStep,
    currency: item.auction.currency,
    imageUrl: primaryImage,
    secondaryImageUrl: secondaryImage,
    colors: swatches.colors,
    extraVariants: swatches.extraVariants,
    statusLabel:
      item.auction.status === 'sold' || item.auction.status === 'hidden'
        ? getAuctionStatusLabel(item.auction.status)
        : null,
    sellerName: item.sellerProfile.storeName,
    sellerCountry: item.sellerProfile.country,
    auctionStatus: item.auction.status,
    bidCount: item.auction.bidCount,
    startsAt: item.auction.startsAt,
    endsAt: item.auction.endsAt,
  };
}

export function mapAuctionDetailToStorefrontProduct(
  detail: PublicAuctionDetailResponse,
  baseUrl: string,
): StorefrontProduct {
  return mapAuctionListItemToStorefrontProduct(
    {
      auction: detail.auction,
      lot: detail.lot,
      sellerProfile: detail.sellerProfile,
    },
    baseUrl,
  );
}

export function sortStorefrontProducts(
  products: readonly StorefrontProduct[],
  sortValue: CatalogSortValue,
) {
  return [...products].sort((left, right) => {
    switch (sortValue) {
      case 'priceAsc':
        return left.price - right.price;
      case 'priceDesc':
        return right.price - left.price;
      case 'endingSoon':
        return new Date(left.endsAt).getTime() - new Date(right.endsAt).getTime();
      case 'featured':
      default:
        return right.bidCount - left.bidCount;
    }
  });
}

export function filterStorefrontProducts(
  products: readonly StorefrontProduct[],
  filterValue: CatalogFilterValue,
) {
  if (filterValue === 'all') {
    return [...products];
  }

  return products.filter((product) => {
    if (filterValue === 'sold') {
      return product.auctionStatus === 'sold' || product.auctionStatus === 'ended';
    }

    return product.auctionStatus === filterValue;
  });
}
