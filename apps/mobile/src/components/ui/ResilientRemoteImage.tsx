import { Image, type ImageProps } from 'expo-image';
import {
  Platform,
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
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
  | 'CreatorCard'
  | 'CreationStep'
  | 'ProductGallery'
  | 'ProductAuthor'
  | 'AuthorPhoto'
  | 'AuthorAchievement'
  | 'WorkCoverCard'
  | 'AuthorCoverCard'
  | 'AuthorIdentity'
  | 'AuthorAtmosphere'
  | 'AuthorSearchRow';

type ResilientRemoteImageProps = {
  uri: string;
  component: ResilientRemoteImageComponent;
  accessibilityLabel: string;
  fallbackLabel: string;
  style: StyleProp<ViewStyle>;
  contentFit?: ImageProps['contentFit'];
  contentPosition?: ImageProps['contentPosition'];
  transition?: ImageProps['transition'];
  recyclingKey?: string;
  blurRadius?: number;
};

export function ResilientRemoteImage(props: ResilientRemoteImageProps) {
  return <RemoteImageLifetime key={props.uri} {...props} />;
}

function RemoteImageLifetime({
  uri,
  component,
  accessibilityLabel,
  fallbackLabel,
  style,
  contentFit = 'cover',
  contentPosition,
  transition,
  recyclingKey,
  blurRadius,
}: ResilientRemoteImageProps) {
  const [recovery, setRecovery] = useState(() => createMediaRecoveryState(uri));
  const recoveryRef = useRef(recovery);
  const mountedRef = useRef(true);
  recoveryRef.current = recovery;

  const commit = useCallback((next: MediaRecoveryState) => {
    recoveryRef.current = next;
    if (!mountedRef.current) return;
    setRecovery(next);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!recovery.failed || recovery.exhausted || recovery.failureCount < 1) {
      return;
    }

    const delay = mediaRetryDelaysMs[recovery.failureCount - 1];
    if (delay === undefined) return;

    const scheduledFailureCount = recovery.failureCount;
    const timer = setTimeout(() => {
      const current = recoveryRef.current;
      if (
        !mountedRef.current ||
        current.failureCount !== scheduledFailureCount ||
        current.exhausted
      ) {
        return;
      }

      commit(beginMediaRetry(current));
    }, delay);

    return () => clearTimeout(timer);
  }, [commit, recovery.exhausted, recovery.failed, recovery.failureCount]);

  const sourceUri = addMediaCacheBust(uri, recovery.requestVersion);

  const handleLoad = () => {
    if (!mountedRef.current) return;
    commit(markMediaLoaded(recoveryRef.current));
  };

  const handleError = (event: { error: string }) => {
    if (!mountedRef.current) return;

    const failure = recordMediaFailure(recoveryRef.current);
    commit(failure.state);

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
    if (!mountedRef.current) return;
    commit(beginManualMediaRetry(recoveryRef.current));
  };

  if (recovery.failed) {
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
        {recovery.exhausted ? (
          <View style={{ position: 'absolute', bottom: designTokens.space.x2 }}>
            <SecondaryButton label="Повторить" onPress={handleManualRetry} />
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[style, { overflow: 'hidden' }]}
    >
      <Image
        key={sourceUri}
        source={{ uri: sourceUri }}
        contentFit={contentFit}
        contentPosition={contentPosition}
        transition={transition}
        recyclingKey={`${recyclingKey ?? uri}-${recovery.requestVersion}`}
        accessible={false}
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
