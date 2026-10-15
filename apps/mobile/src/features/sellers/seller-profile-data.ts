import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { SellerProfileResponse } from '@bidplace/contracts';

import { canWritePrivateCache, currentAuthEpoch } from '../../lib/query-cache';
import { useApiClient } from '../../providers/api-provider';
import { normalizeInstagram, normalizeTelegram } from './contact-normalization';
import type { ProfileFields } from './seller-profile-steps';

export const sellerProfileQueryKey = ['seller', 'profile'] as const;

export const profileFieldOrder = [
  'slug',
  'fullName',
  'country',
  'city',
  'telegramUrl',
  'instagramUrl',
  'websiteUrl',
  'publicEmail',
  'directionCategoryIds',
  'discipline',
  'practice',
  'shortDescription',
] as const;

export type SubmittedAuthorApplication = {
  application: {
    slug: string;
    fullName: string;
    country: string;
    city: string | null;
    discipline: string | null;
    practice: string | null;
    shortDescription: string | null;
    status: SellerProfileResponse['sellerProfile']['status'];
    applicationStage: SellerProfileResponse['sellerProfile']['applicationStage'];
  };
  editingRevision: {
    id: string;
    version: number;
    status: string;
    updatedAt: string;
  } | null;
};

export function withSubmittedRevision(
  current: SellerProfileResponse | undefined,
  submitted: SubmittedAuthorApplication,
): SellerProfileResponse | undefined {
  const revision = submitted.editingRevision;
  if (
    !current?.sellerProfile ||
    !revision ||
    revision.status !== 'PENDING_REVIEW'
  ) {
    return current;
  }
  return {
    sellerProfile: {
      ...current.sellerProfile,
      slug: submitted.application.slug,
      fullName: submitted.application.fullName,
      country: submitted.application.country,
      city: submitted.application.city,
      discipline: submitted.application.discipline,
      practice: submitted.application.practice,
      shortDescription: submitted.application.shortDescription,
      status: submitted.application.status,
      applicationStage: submitted.application.applicationStage,
    },
    editingRevision: {
      id: revision.id,
      version: revision.version,
      status: 'PENDING_REVIEW',
      updatedAt: revision.updatedAt,
    },
  };
}

export function isSellerProfileResponse(
  value: unknown,
): value is SellerProfileResponse {
  if (!value || typeof value !== 'object') return false;
  return 'sellerProfile' in value && 'editingRevision' in value;
}

export function keepConfirmedPendingProfile(
  previous: unknown,
  next: unknown,
): unknown {
  if (
    !isSellerProfileResponse(previous) ||
    previous.editingRevision?.status !== 'PENDING_REVIEW'
  ) {
    return next;
  }
  if (!isSellerProfileResponse(next) || !next.editingRevision) return previous;
  const confirmedAt = Date.parse(previous.editingRevision.updatedAt);
  const incomingAt = Date.parse(next.editingRevision.updatedAt);
  if (!Number.isFinite(incomingAt) || incomingAt < confirmedAt) return previous;
  if (
    next.editingRevision.id === previous.editingRevision.id &&
    next.editingRevision.status !== 'PENDING_REVIEW' &&
    incomingAt <= confirmedAt
  ) {
    return previous;
  }
  return next;
}

export function toFields(profile: {
  slug: string;
  fullName: string;
  discipline: string | null;
  country: string;
  city: string | null;
  practice: string | null;
  socialLink: string | null;
  telegramUrl: string | null;
  instagramUrl: string | null;
  websiteUrl: string | null;
  publicEmail?: string | null;
  shortDescription: string | null;
  directionCategoryIds: string[];
}): ProfileFields {
  return {
    slug: profile.slug,
    fullName: profile.fullName,
    discipline: profile.discipline ?? '',
    directionCategoryIds: profile.directionCategoryIds ?? [],
    country: profile.country,
    city: profile.city ?? '',
    practice: profile.practice ?? '',
    socialLink: profile.socialLink ?? '',
    telegramUrl: profile.telegramUrl ?? '',
    instagramUrl: profile.instagramUrl ?? '',
    websiteUrl: profile.websiteUrl ?? '',
    publicEmail: profile.publicEmail ?? '',
    shortDescription: profile.shortDescription ?? '',
  };
}

export function profileFieldsToUpdate(fields: ProfileFields) {
  return {
    fullName: fields.fullName,
    discipline: fields.discipline.trim() || undefined,
    directionCategoryIds: fields.directionCategoryIds,
    country: fields.country,
    city: fields.city.trim() || null,
    practice: fields.practice.trim() || null,
    socialLink: fields.socialLink.trim() || null,
    telegramUrl: normalizeTelegram(fields.telegramUrl) ?? null,
    instagramUrl: normalizeInstagram(fields.instagramUrl) ?? null,
    websiteUrl: fields.websiteUrl.trim() || null,
    publicEmail: fields.publicEmail.trim() || null,
    shortDescription: fields.shortDescription.trim() || null,
  };
}

export function profileFieldsToCreate(fields: ProfileFields) {
  return {
    fullName: fields.fullName,
    country: fields.country,
    city: fields.city.trim() || null,
  };
}

export type ProfileSaveVariables = {
  fields: ProfileFields;
  photo: Blob | null;
  authEpoch: number;
  operation: number;
};

export type ProfileSaveResult =
  | { outcome: 'saved'; profile: SellerProfileResponse; created?: boolean }
  | { outcome: 'stored-slug'; slug: string };

export function useProfileData() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: sellerProfileQueryKey,
    queryFn: async () => {
      const epoch = currentAuthEpoch(queryClient);
      const result = await api.sellers.getMyProfile();
      if (!canWritePrivateCache(queryClient, epoch)) {
        const current = queryClient.getQueryData<SellerProfileResponse>(
          sellerProfileQueryKey,
        );
        if (current) return current;
        throw new Error('Private cache is closed');
      }
      return result;
    },
    retry: false,
    structuralSharing: keepConfirmedPendingProfile,
  });
}
