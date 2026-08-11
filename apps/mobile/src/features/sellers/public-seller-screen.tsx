import { useQuery } from '@tanstack/react-query';
import { Link, type Href, useRouter } from 'expo-router';
import { Platform, ScrollView, useWindowDimensions, View } from 'react-native';
import { useState } from 'react';

import type { PublicSellerWorksQuery } from '@bidplace/contracts';
import { ApiClientError } from '@bidplace/api-client';
import { designTokens } from '@bidplace/design-tokens';

import { AppShell } from '../../components/layout/AppShell';
import {
  AppIcon,
  AppText,
  AuctionCardGrid,
  MotionPressable,
  PageState,
  ResilientRemoteImage,
} from '../../components/ui';
import { getApiAssetUrl } from '../../lib/environment';
import { useApiClient } from '../../providers/api-provider';
import { getAuthorWorkColumnCount } from './author-layout';

type CreatorStatus = 'LIVE' | 'SCHEDULED' | 'ENDED';

const statusTabs: Array<{ value: CreatorStatus; label: string }> = [
  { value: 'LIVE', label: 'Идут торги' },
  { value: 'SCHEDULED', label: 'Запланированы' },
  { value: 'ENDED', label: 'Завершены' },
];

const sortOptions: Array<{
  value: PublicSellerWorksQuery['sort'];
  label: string;
}> = [
  { value: 'activity', label: 'По активности' },
  { value: 'newest', label: 'Сначала новые' },
  { value: 'priceAsc', label: 'Сначала дешевле' },
  { value: 'priceDesc', label: 'Сначала дороже' },
];

function CreatorSort({
  sort,
  onChange,
}: {
  sort: PublicSellerWorksQuery['sort'];
  onChange: (sort: PublicSellerWorksQuery['sort']) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = sortOptions.find((option) => option.value === sort);

  return (
    <View style={{ position: 'relative', alignSelf: 'flex-start' }}>
      <MotionPressable
        accessibilityRole="button"
        accessibilityLabel="Сортировка работ автора"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
        preset="button"
        style={{
          minHeight: 40,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: designTokens.space.x3,
          minWidth: 160,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: designTokens.color.border,
          paddingHorizontal: 16,
        }}
      >
        <AppText role="label">{current?.label}</AppText>
        <AppIcon name="chevronDown" size={16} color={designTokens.color.textSecondary} />
      </MotionPressable>
      {open ? (
        <View
          accessibilityRole="menu"
          style={{
            position: 'absolute',
            top: 48,
            right: 0,
            zIndex: designTokens.layer.popover,
            minWidth: 190,
            gap: designTokens.space.x1,
            borderWidth: 1,
            borderColor: designTokens.color.border,
            borderRadius: 16,
            backgroundColor: designTokens.color.surface,
            padding: 10,
            ...designTokens.elevation.floating,
          }}
        >
          {sortOptions.map((option) => (
            <MotionPressable
              key={option.value}
              accessibilityRole="menuitem"
              accessibilityLabel={option.label}
              onPress={() => {
                onChange(option.value);
                setOpen(false);
              }}
              preset="button"
              style={{
                minHeight: designTokens.size.touch,
                justifyContent: 'center',
                borderRadius: designTokens.radius.small,
                paddingHorizontal: designTokens.space.x2,
              }}
              interactionStyle={({ hovered, pressed }) => ({
                backgroundColor:
                  hovered || pressed
                    ? designTokens.color.surfaceStrong
                    : 'transparent',
              })}
            >
              <AppText role="label">{option.label}</AppText>
            </MotionPressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function SocialLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: 'send' | 'instagram' | 'globe';
  label: string;
}) {
  return (
    <Link href={href as Href} target="_blank" asChild>
      <MotionPressable
        accessibilityRole="link"
        accessibilityLabel={label}
        preset="icon"
        style={{
          width: 28,
          height: 28,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: designTokens.color.border,
          borderRadius: 14,
        }}
      >
        <AppIcon name={icon} size={20} color={designTokens.color.textSecondary} />
      </MotionPressable>
    </Link>
  );
}

function CreatorHero({
  profile,
  slug,
}: {
  profile: {
    fullName: string;
    profilePhotoUrl: string;
    shortDescription: string;
    telegramUrl: string | null;
    instagramUrl: string | null;
    websiteUrl: string | null;
    socialLink: string;
  };
  slug: string;
}) {
  const [copyState, setCopyState] = useState<'idle' | 'success' | 'error'>('idle');
  const copyProfileLink = () => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !navigator.clipboard) {
      setCopyState('error');
      return;
    }
    void navigator.clipboard
      .writeText(new URL(`/seller/${slug}`, window.location.origin).toString())
      .then(() => setCopyState('success'))
      .catch(() => setCopyState('error'));
  };

  return (
    <View
      style={{
        minHeight: 500,
        alignItems: 'center',
        gap: 18,
        paddingTop: 64,
        paddingBottom: 72,
        backgroundColor: designTokens.color.surface,
      }}
    >
      <ResilientRemoteImage
        uri={getApiAssetUrl(profile.profilePhotoUrl)}
        component="AuthorPhoto"
        accessibilityLabel={`Фото автора ${profile.fullName}`}
        fallbackLabel={`Фото автора недоступно: ${profile.fullName}`}
        style={{ width: 120, height: 120, borderRadius: 60 }}
        contentFit="cover"
      />
      <View style={{ alignItems: 'center', gap: 6 }}>
        <AppText
          accessibilityRole="header"
          role="display"
          style={{ fontFamily: 'Inter_700Bold', fontSize: 48, lineHeight: 50, letterSpacing: -1, textAlign: 'center' }}
        >
          {profile.fullName}
        </AppText>
        {Platform.OS === 'web' ? (
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel={`Скопировать ссылку на профиль ${profile.fullName}`}
            onPress={copyProfileLink}
            preset="button"
            style={{
              minHeight: 28,
              flexDirection: 'row',
              alignItems: 'center',
              gap: designTokens.space.x2,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: designTokens.color.border,
              backgroundColor: designTokens.color.surfaceMuted,
              paddingHorizontal: 9,
            }}
          >
            <AppText role="label" tone="secondary" style={{ fontSize: 15 }}>
              @{slug}
            </AppText>
            <AppIcon name="copy" size={14} color={designTokens.color.ink} />
          </MotionPressable>
        ) : (
          <AppText role="label" tone="secondary">@{slug}</AppText>
        )}
        {copyState === 'success' ? <AppText role="caption" tone="success">Ссылка скопирована.</AppText> : null}
        {copyState === 'error' ? <AppText role="caption" tone="danger">Не удалось скопировать ссылку.</AppText> : null}
      </View>
      <View style={{ height: 28, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        {profile.telegramUrl ? <SocialLink href={profile.telegramUrl} icon="send" label="Telegram автора" /> : null}
        {profile.instagramUrl ? <SocialLink href={profile.instagramUrl} icon="instagram" label="Instagram автора" /> : null}
        {(profile.websiteUrl ?? profile.socialLink) ? (
          <SocialLink href={profile.websiteUrl ?? profile.socialLink} icon="globe" label="Сайт автора" />
        ) : null}
      </View>
      <AppText role="body" tone="secondary" style={{ maxWidth: 680, textAlign: 'center' }}>
        {profile.shortDescription}
      </AppText>
    </View>
  );
}

function CreatorStatusTabs({
  status,
  onChange,
}: {
  status?: CreatorStatus;
  onChange: (status?: CreatorStatus) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: designTokens.space.x2 }}>
      {statusTabs.map((tab) => {
        const selected = tab.value === status;
        return (
          <MotionPressable
            key={tab.value}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(selected ? undefined : tab.value)}
            preset="button"
            style={{
              minHeight: 40,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              borderRadius: 20,
              backgroundColor: selected ? designTokens.color.action : designTokens.color.surface,
              borderWidth: selected ? 0 : 1,
              borderColor: designTokens.color.border,
              paddingHorizontal: 17,
            }}
          >
            <AppText role="label" style={{ color: selected ? designTokens.color.surface : designTokens.color.ink }}>
              {tab.label}
            </AppText>
          </MotionPressable>
        );
      })}
    </ScrollView>
  );
}

export function PublicSellerScreen({
  slug,
  status,
  sort = 'activity',
}: {
  slug: string;
  status?: CreatorStatus;
  sort?: PublicSellerWorksQuery['sort'];
}) {
  const api = useApiClient();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const query = useQuery({
    queryKey: ['public-seller', slug, { status, sort }],
    queryFn: () => api.sellers.getPublicDetail(slug, { status, sort }),
    enabled: Boolean(slug),
    retry: false,
  });

  let content: React.ReactNode;
  if (query.isLoading) {
    content = <PageState title="Загружаем работы автора…" loading />;
  } else if (
    query.isError &&
    query.error instanceof ApiClientError &&
    query.error.kind === 'not_found'
  ) {
    content = <PageState title="Автор не найден" message="Профиль больше недоступен." />;
  } else if (query.isError || !query.data) {
    content = <PageState title="Не удалось загрузить работы автора" retry={() => void query.refetch()} />;
  } else if (query.data.products.length === 0) {
    content = <PageState title="У автора пока нет опубликованных работ" />;
  } else {
    content = (
      <AuctionCardGrid
        items={query.data.products}
        columns={getAuthorWorkColumnCount(width)}
      />
    );
  }

  return (
    <AppShell>
      <ScrollView
        style={{ backgroundColor: designTokens.color.surface }}
        contentContainerStyle={{ paddingBottom: designTokens.space.x20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: '100%', alignSelf: 'center' }}>
          {query.data ? (
            <CreatorHero profile={query.data.sellerProfile} slug={slug} />
          ) : null}
          <View
            style={{
              gap: designTokens.space.x5,
              paddingTop: designTokens.space.x6,
              paddingHorizontal:
                width >= designTokens.breakpoint.desktopShell
                  ? designTokens.space.x8
                  : designTokens.layout.mobileGutter,
              paddingBottom: designTokens.space.x12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: designTokens.space.x4 }}>
              <AppText role="sectionTitle" style={{ fontFamily: 'Inter_700Bold', fontSize: 30, lineHeight: 34 }}>
                Работы
              </AppText>
              <CreatorSort
                sort={sort}
                onChange={(nextSort) => router.setParams({ sort: nextSort })}
              />
            </View>
            <CreatorStatusTabs
              status={status}
              onChange={(nextStatus) => router.setParams({ status: nextStatus, sort })}
            />
            {content}
          </View>
        </View>
      </ScrollView>
    </AppShell>
  );
}
