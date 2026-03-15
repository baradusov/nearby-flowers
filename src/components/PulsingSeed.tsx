import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
} from "react-native-reanimated";

interface PulsingSeedProps {
  emoji: string;
  offset: { x: number; y: number; rotate: string };
  delay: number;
  isFirst: boolean;
}

export function PulsingSeed({ emoji, offset, delay, isFirst }: PulsingSeedProps) {
  const scale = useSharedValue(isFirst ? 0 : 1);

  useEffect(() => {
    const pulse = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1800 }),
        withTiming(0.95, { duration: 1800 }),
      ),
      -1,
      true,
    );

    if (isFirst) {
      scale.value = withSequence(
        withSpring(1, { damping: 8, stiffness: 80 }),
        withDelay(200, pulse),
      );
    } else {
      scale.value = withDelay(delay, pulse);
    }
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View
      style={[
        styles.container,
        {
          transform: [
            { translateX: offset.x },
            { translateY: offset.y },
            { rotate: offset.rotate },
          ],
        },
      ]}
    >
      <Animated.View style={pulseStyle}>
        <Text style={styles.emoji}>{emoji}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    opacity: 0.7,
  },
  emoji: {
    fontSize: 60,
  },
});
