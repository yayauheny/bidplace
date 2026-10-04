export function publishedProductData(revision: {
  categoryId: string | null;
  title: string | null;
  story: string | null;
  technique: string | null;
  materials: string | null;
  dimensions: string | null;
  weight: string | null;
  year: number | null;
  condition: string | null;
  uniqueness: string | null;
  provenance: string | null;
  city: string | null;
  packaging: string | null;
  deliveryInfo: string | null;
  creationIntro: string | null;
}) {
  return {
    categoryId: revision.categoryId,
    title: revision.title,
    story: revision.story,
    technique: revision.technique,
    materials: revision.materials,
    dimensions: revision.dimensions,
    weight: revision.weight,
    year: revision.year,
    condition: revision.condition,
    uniqueness: revision.uniqueness,
    provenance: revision.provenance,
    city: revision.city,
    packaging: revision.packaging,
    deliveryInfo: revision.deliveryInfo,
    creationIntro: revision.creationIntro,
  };
}

export function publishedSellerProfileData(revision: {
  slug: string;
  discipline: string | null;
  fullName: string;
  country: string;
  city: string | null;
  practice: string | null;
  biography: string | null;
  socialLink: string | null;
  telegramUrl: string | null;
  instagramUrl: string | null;
  websiteUrl: string | null;
  publicEmail: string | null;
  shortDescription: string | null;
}) {
  return {
    slug: revision.slug,
    discipline: revision.discipline,
    fullName: revision.fullName,
    country: revision.country,
    city: revision.city,
    practice: revision.practice,
    biography: revision.biography,
    socialLink: revision.socialLink,
    telegramUrl: revision.telegramUrl,
    instagramUrl: revision.instagramUrl,
    websiteUrl: revision.websiteUrl,
    publicEmail: revision.publicEmail,
    shortDescription: revision.shortDescription,
  };
}
