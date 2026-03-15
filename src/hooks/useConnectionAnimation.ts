import { useEffect } from "react";
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from "react-native-reanimated";

export function useConnectionAnimation(connectedPeers: number) {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  useEffect(() => {
    if (connectedPeers > 0) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 0 }),
          withTiming(1.8, { duration: 1500 }),
        ),
        -1,
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 0 }),
          withTiming(0, { duration: 1500 }),
        ),
        -1,
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
      pulseOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [connectedPeers]);

  const pulseRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const searchPulse = useSharedValue(1);

  useEffect(() => {
    if (connectedPeers === 0) {
      searchPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 0 }),
          withTiming(0.3, { duration: 1000 }),
          withTiming(1, { duration: 1000 }),
        ),
        -1,
      );
    } else {
      searchPulse.value = withTiming(1, { duration: 300 });
    }
  }, [connectedPeers]);

  const searchDotStyle = useAnimatedStyle(() => ({
    opacity: searchPulse.value,
  }));

  return { pulseRingStyle, searchDotStyle };
}
