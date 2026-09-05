import { useMemo, useRef } from 'react';
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Text,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CollapsingHeaderProps {
  title: string;
  scrollY: Animated.Value;
}

export function CollapsingHeader({ title, scrollY }: CollapsingHeaderProps) {
  const insets = useSafeAreaInsets();
  const opacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [18, 52],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        opacity,
      }}
    >
      <BlurView
        tint="systemChromeMaterial"
        intensity={70}
        style={{ overflow: 'hidden', paddingTop: insets.top }}
      >
        <View style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 17, fontWeight: '600', color: '#000000' }}>{title}</Text>
        </View>
      </BlurView>
    </Animated.View>
  );
}

export function useSafeScrollPadding(extraTop = 28) {
  const insets = useSafeAreaInsets();
  return {
    paddingTop: Platform.OS === 'android' ? insets.top + extraTop : 0,
  };
}

export function useCollapsingScroll() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const onScroll = useMemo(
    () => (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollY.setValue(event.nativeEvent.contentOffset.y);
    },
    [scrollY]
  );

  return { scrollY, onScroll };
}
