import { useEffect, useRef, useState } from 'react';
import { Platform, TextInput, View, type View as ViewRef } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { designTokens, searchChromeTokens } from '@bidplace/design-tokens';
import { FigmaIcon } from '../../components/figma/FigmaIcon';
import { FigmaSearchGlass } from '../../components/figma/FigmaSearchGlass';
import { AppText } from '../../components/ui/AppText';
import { MotionPressable } from '../../components/ui/MotionPressable';
import { useReducedMotion } from '../../lib/reduced-motion';
import { useAppTheme } from '../../providers/theme-provider';

export function ExploreHeader({
  open,
  query,
  onOpen,
  onClose,
  onChangeQuery,
  onBack,
}: {
  open: boolean;
  query: string;
  onOpen: () => void;
  onClose: () => void;
  onChangeQuery: (query: string) => void;
  onBack: () => void;
}) {
  const palette = useAppTheme();
  const reduced = useReducedMotion();
  const input = useRef<TextInput>(null);
  const trigger = useRef<ViewRef>(null);
  const wasOpen = useRef(open);
  const [width, setWidth] = useState(0);
  const progress = useSharedValue(open ? 1 : 0);
  const height = searchChromeTokens.field.sampleHeight;
  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, {
      duration: reduced ? 0 : designTokens.motion.control,
    });
    if (open) input.current?.focus();
    else if (wasOpen.current) {
      input.current?.blur();
      if (Platform.OS === 'web') trigger.current?.focus();
    }
    wasOpen.current = open;
  }, [open, progress, reduced]);
  const fieldStyle = useAnimatedStyle(() => ({
    left:
      Math.max(0, width - height - searchChromeTokens.rowGap) *
      (1 - progress.value),
    opacity: progress.value,
  }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -Math.max(0, width - height) * progress.value }],
  }));
  const showStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const hideStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));
  return (
    <View
      testID="explore-header"
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{ height, width: '100%' }}
    >
      <Animated.View
        pointerEvents={open ? 'none' : 'auto'}
        {...(Platform.OS === 'web' ? { 'aria-hidden': open, inert: open } : {})}
        accessibilityElementsHidden={open}
        importantForAccessibility={open ? 'no-hide-descendants' : 'auto'}
        style={[
          {
            height,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          },
          hideStyle,
        ]}
      >
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel="Назад"
          onPress={onBack}
          style={{
            width: height,
            height,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          {...(Platform.OS === 'web' && open ? { tabIndex: -1 } : {})}
        >
          <FigmaIcon name="arrow-left-01" size={designTokens.size.dockIcon} />
        </MotionPressable>
        <AppText role="navigationTitle">Исследовать</AppText>
        <View style={{ width: height }} />
      </Animated.View>
      <Animated.View
        testID="explore-search-field"
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: 0,
            right: height + searchChromeTokens.rowGap,
            height,
          },
          fieldStyle,
        ]}
      >
        <FigmaSearchGlass
          testID="explore-field-glass"
          kind="field"
          style={{ width: '100%', height }}
        />
      </Animated.View>
      <Animated.View
        pointerEvents={open ? 'none' : 'auto'}
        style={[
          { position: 'absolute', right: 0, top: 0, width: height, height },
          iconStyle,
        ]}
      >
        <MotionPressable
          ref={trigger}
          accessibilityRole="button"
          accessibilityLabel="Открыть поиск"
          {...(Platform.OS === 'web' ? { 'aria-hidden': open } : {})}
          accessibilityElementsHidden={open}
          importantForAccessibility={open ? 'no-hide-descendants' : 'auto'}
          onPress={() => {
            onOpen();
            input.current?.focus();
          }}
          {...(Platform.OS === 'web' && open ? { tabIndex: -1 } : {})}
          style={{ height, alignItems: 'center', justifyContent: 'center' }}
        >
          <FigmaIcon name="search-01" size={designTokens.size.dockIcon} />
        </MotionPressable>
      </Animated.View>
      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        {...(Platform.OS === 'web'
          ? { 'aria-hidden': !open, inert: !open }
          : {})}
        accessibilityElementsHidden={!open}
        importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
        style={[
          {
            position: 'absolute',
            left: height,
            right:
              height +
              searchChromeTokens.rowGap +
              searchChromeTokens.field.padding,
            height,
            justifyContent: 'center',
          },
          showStyle,
        ]}
      >
        <TextInput
          ref={input}
          testID="explore-query"
          accessibilityLabel="Поиск"
          value={query}
          onChangeText={onChangeQuery}
          placeholder="Поиск"
          placeholderTextColor={palette.muted}
          editable={open}
          maxLength={120}
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={() => input.current?.blur()}
          {...(Platform.OS === 'web' ? { tabIndex: open ? 0 : -1 } : {})}
          style={{
            ...searchChromeTokens.field.typography,
            color: palette.inkStrong,
            padding: 0,
            ...(Platform.OS === 'web'
              ? ({ outlineStyle: 'none', appearance: 'none' } as object)
              : {}),
          }}
        />
      </Animated.View>
      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        {...(Platform.OS === 'web'
          ? { 'aria-hidden': !open, inert: !open }
          : {})}
        accessibilityElementsHidden={!open}
        importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
        style={[
          { position: 'absolute', right: 0, top: 0, height, width: height },
          showStyle,
        ]}
      >
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel="Закрыть поиск"
          onPress={onClose}
          {...(Platform.OS === 'web' && !open ? { tabIndex: -1 } : {})}
        >
          <FigmaSearchGlass
            testID="explore-close-glass"
            kind="close"
            style={{
              height,
              width: height,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FigmaIcon name="x" size={designTokens.size.dockIcon} />
          </FigmaSearchGlass>
        </MotionPressable>
      </Animated.View>
    </View>
  );
}
