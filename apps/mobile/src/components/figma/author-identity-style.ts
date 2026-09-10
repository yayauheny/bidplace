import { figmaTokens } from '@bidplace/design-tokens';

export function authorIdentitySpec() {
  return {
    sourceNodeId: '874:5591',
    width: figmaTokens.size.identityAvatar + figmaTokens.size.coverWidth,
    height: figmaTokens.size.identityAvatar,
    avatar: figmaTokens.size.identityAvatar,
    avatarRadius: figmaTokens.radius.avatar,
    contentPadding: figmaTokens.space.coverPad,
    contentGap: figmaTokens.space.identityGap,
    chipGap: figmaTokens.space.chipGap,
    chipWrap: 'nowrap' as const,
    handle: figmaTokens.typography.identityCompactHandle,
  } as const;
}

export function authorIdentityRowStyle() {
  const spec = authorIdentitySpec();

  return {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    overflow: 'hidden' as const,
    height: spec.height,
    maxHeight: spec.height,
    minWidth: 0,
    maxWidth: '100%' as const,
  };
}

export function authorIdentityAvatarStyle() {
  const spec = authorIdentitySpec();

  return {
    width: spec.avatar,
    height: spec.avatar,
    borderRadius: spec.avatarRadius,
    flexShrink: 0,
  };
}

export function authorIdentityContentStyle() {
  const spec = authorIdentitySpec();

  return {
    padding: spec.contentPadding,
    gap: spec.contentGap,
    flex: 1,
    minWidth: 0,
    overflow: 'hidden' as const,
  };
}

export function authorIdentityTagRowStyle() {
  const spec = authorIdentitySpec();

  return {
    flexDirection: 'row' as const,
    flexWrap: spec.chipWrap,
    gap: spec.chipGap,
    overflow: 'hidden' as const,
  };
}
