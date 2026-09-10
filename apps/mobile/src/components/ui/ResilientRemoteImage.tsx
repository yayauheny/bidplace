import { Image, type ImageProps } from 'expo-image';
import { Platform, StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';

import { designTokens } from '@bidplace/design-tokens';

import { SecondaryButton } from './Button';
import { ImagePlaceholder } from './ImagePlaceholder';
import {
  addMediaCacheBust,
  beginManualMediaRetry,
  beginMediaRetry,
  createMediaRecoveryState,
  markMediaLoaded,
  mediaRetryDelaysMs,
  recordMediaFailure,
  sanitizeMediaError,
  sanitizeMediaUrl,
  type MediaRecoveryState,
} from './media-recovery';

export type ResilientRemoteImageComponent =
  | 'AuctionCard'
  | 'CreatorCard'
  | 'CreationStep'
  | 'ProductGallery'
  | 'ProductAuthor'
  | 'AuthorPhoto'
  | 'WorkCoverCard'
  | 'AuthorCoverCard'
  | 'AuthorIdentity'
  | 'AuthorAtmosphere';

type ResilientRemoteImageProps = {
  uri: string;
  component: ResilientRemoteImageComponent;
  accessibilityLabel: string;
  fallbackLabel: string;
  style: StyleProp<ViewStyle>;
  contentFit?: ImageProps['contentFit'];
  transition?: ImageProps['transition'];
  recyclingKey?: string;
  blurRadius?: number;
};

export function ResilientRemoteImage({
  uri,
  component,
  accessibilityLabel,
  fallbackLabel,
  style,
  contentFit = 'cover',
  transition,
  recyclingKey,
  blurRadius,
}: ResilientRemoteImageProps) {
  const recovery = useMediaRecovery(uri);
  const currentUriRef = useRef(uri);
  currentUriRef.current = uri;
  const isCurrentUri = recovery.uri === uri;
  const visibleRecovery = isCurrentUri
    ? recovery
    : createMediaRecoveryState(uri);

  useEffect(() => {
    if (recovery.uri === uri) return;

    const next = createMediaRecoveryState(uri);
    recovery.ref.current = next;
    recovery.set(next);
  }, [recovery.ref, recovery.set, recovery.uri, uri]);

  useEffect(() => {
    if (
      !isCurrentUri ||
      !recovery.failed ||
      recovery.exhausted ||
      recovery.failureCount < 1
    ) {
      return;
    }

    const delay = mediaRetryDelaysMs[recovery.failureCount - 1];
    if (delay === undefined) return;

    const timer = setTimeout(() => {
      const current = recovery.ref.current;
      if (
        current.uri !== uri ||
        current.failureCount !== recovery.failureCount ||
        current.exhausted
      ) {
        return;
      }

      const next = beginMediaRetry(current);
      recovery.ref.current = next;
      recovery.set(next);
    }, delay);

    return () => clearTimeout(timer);
  }, [
    isCurrentUri,
    recovery.exhausted,
    recovery.failed,
    recovery.failureCount,
    recovery.ref,
    recovery.set,
    uri,
  ]);

  const sourceUri = addMediaCacheBust(uri, visibleRecovery.requestVersion);

  const handleLoad = () => {
    const current = recovery.ref.current;
    if (currentUriRef.current !== uri || current.uri !== uri) return;

    const next = markMediaLoaded(current);
    recovery.ref.current = next;
    recovery.set(next);
  };

  const handleError = (event: { error: string }) => {
    const current = recovery.ref.current;
    if (currentUriRef.current !== uri || current.uri !== uri) return;

    const failure = recordMediaFailure(current);
    recovery.ref.current = failure.state;
    recovery.set(failure.state);

    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        JSON.stringify({
          event: 'media_load_failed',
          component,
          url: sanitizeMediaUrl(uri),
          attempt: failure.attempt,
          message: sanitizeMediaError(event.error, uri),
        }),
      );
    }
  };

  const handleManualRetry = () => {
    const current = recovery.ref.current;
    const next = beginManualMediaRetry(
      current.uri === uri ? current : createMediaRecoveryState(uri),
    );
    recovery.ref.current = next;
    recovery.set(next);
  };

  if (visibleRecovery.failed) {
    return (
      <View
        style={[
          style,
          {
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
          },
        ]}
      >
        <ImagePlaceholder
          label={fallbackLabel}
          style={StyleSheet.absoluteFill}
        />
        {visibleRecovery.exhausted ? (
          <View style={{ position: 'absolute', bottom: designTokens.space.x2 }}>
            <SecondaryButton
              label="Повторить"
              onPress={handleManualRetry}
            />
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[style, { overflow: 'hidden' }]}>
      <Image
        key={sourceUri}
        source={{ uri: sourceUri }}
        contentFit={contentFit}
        transition={transition}
        recyclingKey={`${recyclingKey ?? uri}-${visibleRecovery.requestVersion}`}
        accessibilityLabel={accessibilityLabel}
        accessible={Boolean(accessibilityLabel)}
        blurRadius={blurRadius}
        onLoad={handleLoad}
        onError={handleError}
        style={[
          StyleSheet.absoluteFill,
          Platform.OS === 'web' && blurRadius
            ? ({ filter: `blur(${blurRadius}px)` } as ImageStyle)
            : null,
        ]}
      />
    </View>
  );
}

function useMediaRecovery(uri: string): {
  readonly failed: boolean;
  readonly exhausted: boolean;
  readonly failureCount: number;
  readonly requestVersion: number;
  readonly uri: string;
  readonly ref: { current: MediaRecoveryState };
  readonly set: (next: MediaRecoveryState) => void;
} {
  const [state, setState] = useState(() => createMediaRecoveryState(uri));
  const ref = useRef(state);
  const set = useCallback((next: MediaRecoveryState) => {
    ref.current = next;
    setState(next);
  }, []);

  return {
    ...state,
    ref,
    set,
  };
}
