export function publishedSellerProfileData(revision: {
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
