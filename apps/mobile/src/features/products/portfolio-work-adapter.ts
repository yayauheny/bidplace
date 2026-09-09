import type { PortfolioWorkDetailResponse } from '@bidplace/contracts';

import {
  toAuctionCardItem,
  type AuctionCardItem,
} from '../../components/ui/auction-card-item';

export function toProductScreenModel(detail: PortfolioWorkDetailResponse): {
  product: {
    id: string;
    publicId: string;
    title: string;
    story: string | null;
    technique: string | null;
    materials: string | null;
    dimensions: string | null;
    year: number | null;
    images: PortfolioWorkDetailResponse['work']['images'];
    city: string;
    sellerProfileId: string;
  };
  sellerProfile: {
    slug: string;
    fullName: string;
    profilePhotoUrl: string;
    shortDescription: string;
    telegramUrl: string | null;
    instagramUrl: string | null;
    websiteUrl: string | null;
  };
  relatedItems: AuctionCardItem[];
} {
  return {
    product: {
      id: detail.work.id,
      publicId: detail.work.publicId,
      title: detail.work.title,
      story: detail.work.story,
      technique: detail.work.technique,
      materials: detail.work.materials,
      dimensions: detail.work.dimensions,
      year: detail.work.year,
      images: detail.work.images,
      city: detail.author.city,
      sellerProfileId: detail.author.id,
    },
    sellerProfile: {
      slug: detail.author.slug,
      fullName: detail.author.fullName,
      profilePhotoUrl: detail.author.profilePhotoUrl,
      shortDescription: detail.author.shortDescription,
      telegramUrl: detail.author.telegramUrl,
      instagramUrl: detail.author.instagramUrl,
      websiteUrl: detail.author.websiteUrl,
    },
    relatedItems: detail.relatedWorks.map(toAuctionCardItem),
  };
}
